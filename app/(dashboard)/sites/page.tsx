"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  Search,
  Plus,
  RefreshCw,
  ShieldAlert,
  Bug,
  Plug,
  Package,
  Monitor,
  Star,
  ListFilter,
  RotateCcw,
  Loader2,
  MoreVertical,
  Unplug,
  ArrowUpDown,
  Check,
  AppWindow,
  ExternalLink,
  Eye,
  Trash2,
} from "lucide-react";
import { cn, truncateUrl } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSites } from "@/hooks/useSites";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { SiteQuickViewDrawer } from "@/components/sites/SiteQuickViewDrawer";
import { SiteScreenshot } from "@/components/sites/SiteScreenshot";
import { WordPressIcon } from "@/components/shared/WordPressIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Site } from "@/types";

type QuickFilter = "all" | "malware" | "disconnected" | "down" | "updates";

const QUICK: { value: QuickFilter; label: string }[] = [
  { value: "malware", label: "Malware" },
  { value: "disconnected", label: "Disconnected" },
  { value: "down", label: "Site Down" },
  { value: "updates", label: "Needs Updates" },
];

function siteAlerts(site: Site): { label: string; tone: "danger" | "warning" | "muted" }[] {
  const out: { label: string; tone: "danger" | "warning" | "muted" }[] = [];
  if (site.uptime_status === "down") out.push({ label: "Site Unavailable", tone: "danger" });
  if (!site.plugin_connected) out.push({ label: "Plugin Disconnected", tone: "warning" });
  if (site.malware_status === "threat")
    out.push({ label: "Malware Detected", tone: "danger" });
  if ((site.plugins_needing_updates ?? 0) > 0 || (site.themes_needing_updates ?? 0) > 0)
    out.push({ label: "Updates Available", tone: "warning" });
  else if ((site.plugin_vuln_count ?? 0) > 0)
    out.push({ label: "Vulnerabilities Found", tone: "warning" });
  return out;
}

function matchesQuick(site: Site, filter: QuickFilter): boolean {
  switch (filter) {
    case "malware":
      return site.malware_status === "threat";
    case "disconnected":
      return !site.plugin_connected;
    case "down":
      return site.uptime_status === "down";
    case "updates":
      return (
        (site.plugins_needing_updates ?? 0) > 0 ||
        (site.themes_needing_updates ?? 0) > 0 ||
        (site.plugin_vuln_count ?? 0) > 0
      );
    default:
      return true;
  }
}

function formatCount(n: number) {
  return n > 9 ? "9+" : String(n);
}

/** MalCare-style checkbox */
function McCheckbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn(
        "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        checked ? "border-accent bg-accent text-white" : "border-zinc-300 hover:border-zinc-400"
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </button>
  );
}

const CHECKBOX_COL = "w-12 p-4 align-middle";
const TH =
  "h-14 px-2 text-left align-middle text-sm font-semibold text-zinc-950 whitespace-nowrap cursor-pointer select-none";
const TH_CHECKBOX = cn(CHECKBOX_COL, "h-14");
const HEADER_RULE =
  "relative after:pointer-events-none after:absolute after:bottom-0 after:left-12 after:right-4 after:h-px after:bg-zinc-200 after:content-['']";
const ROW_RULE =
  "relative after:pointer-events-none after:absolute after:bottom-0 after:left-12 after:right-4 after:h-px after:bg-zinc-200 after:content-[''] last:after:hidden";

function UpdateChip({
  icon: Icon,
  count,
  dimmed,
  title,
}: {
  icon: typeof Plug;
  count?: number;
  dimmed?: boolean;
  title: string;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center gap-0.5", dimmed && "opacity-40")}
      title={title}
    >
      <Icon size={16} strokeWidth={1} className="text-zinc-950" />
      {count != null && count > 0 && (
        <span className="text-xs font-semibold text-zinc-950">{formatCount(count)}</span>
      )}
    </span>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  href,
}: {
  children: ReactNode;
  title: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
}) {
  const cls =
    "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-gray-50 active:bg-zinc-200 [&_svg]:size-4";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        className={cls}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cls}
    >
      {children}
    </button>
  );
}

function SiteActionsMenu({
  site,
  onView,
  onQuickView,
  canDelete,
}: {
  site: Site;
  onView: () => void;
  onQuickView: () => void;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const siteUrl = site.url.startsWith("http") ? site.url : `https://${site.url}`;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleDelete() {
    if (!window.confirm(`Delete "${site.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/sites/${site.id}`);
      await api.post("/sites/cache/clear").catch(() => {});
      window.dispatchEvent(new Event("bb:refresh"));
      toast.success("Site deleted.");
      setOpen(false);
    } catch {
      toast.error("Failed to delete site.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <ActionBtn title="More actions" onClick={() => setOpen((v) => !v)}>
        <MoreVertical size={16} strokeWidth={1} className="text-zinc-950" />
      </ActionBtn>
      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Eye size={14} strokeWidth={1.5} />
            View site
          </button>
          <button
            type="button"
            onClick={() => {
              onQuickView();
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Globe size={14} strokeWidth={1.5} />
            Quick view
          </button>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            Open site URL
          </a>
          {canDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} strokeWidth={1.5} />
              )}
              Delete site
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AlertBadge({ label, tone }: { label: string; tone: "danger" | "warning" | "muted" }) {
  const icon =
    tone === "danger" ? (
      <Bug size={12} className="shrink-0 text-red-600" strokeWidth={1.5} />
    ) : tone === "warning" ? (
      <ShieldAlert size={12} className="shrink-0 text-amber-600" strokeWidth={1.5} />
    ) : (
      <Unplug size={12} className="shrink-0 text-amber-600" strokeWidth={1.5} />
    );

  return (
    <span className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent text-sm leading-tight text-zinc-950 transition-opacity hover:opacity-80">
      {icon}
      {label}
    </span>
  );
}

function SiteRow({
  site,
  selected,
  onToggle,
  onOpen,
  onQuickView,
  showSelect,
  canDeleteSite,
}: {
  site: Site;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onQuickView: () => void;
  showSelect: boolean;
  canDeleteSite: boolean;
}) {
  const alerts = siteAlerts(site);
  const visible = alerts.slice(0, 2);
  const overflow = alerts.length - visible.length;
  const updates = site.plugins_needing_updates ?? 0;
  const themeUpdates = site.themes_needing_updates ?? 0;
  const coreUpdates = site.site_health?.wp_update_available ? 1 : 0;
  const isHacked = site.malware_status === "threat";
  const siteUrl = site.url.startsWith("http") ? site.url : `https://${site.url}`;

  return (
    <tr
      className={cn("group cursor-pointer transition-colors hover:bg-[#f4f4f5]", ROW_RULE)}
      onClick={onOpen}
    >
      {showSelect && (
        <td className={cn(CHECKBOX_COL, "h-16")} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <McCheckbox checked={selected} onChange={onToggle} ariaLabel={`Select ${site.name}`} />
          </div>
        </td>
      )}
      <td className="h-16 p-4 pl-0 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/sites/${site.id}`}
            onClick={(e) => e.stopPropagation()}
            className="relative h-16 w-[105px] shrink-0 cursor-pointer overflow-hidden rounded-sm border border-zinc-200 bg-zinc-100 shadow-sm"
          >
            <SiteScreenshot
              url={site.url}
              connected={site.plugin_connected}
              hacked={isHacked}
              width={280}
              className="h-full w-full"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/sites/${site.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-semibold text-zinc-950 cursor-pointer hover:text-accent"
            >
              {site.name}
            </Link>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-xs font-normal text-accent cursor-pointer hover:underline"
            >
              {truncateUrl(site.url)}
            </a>
          </div>
        </div>
      </td>
      <td className="h-16 w-[200px] p-4 align-middle">
        <div className="flex flex-wrap items-center gap-1">
          {visible.length > 0 ? (
            visible.map((a) => <AlertBadge key={a.label} label={a.label} tone={a.tone} />)
          ) : (
            <span className="text-sm text-zinc-400">—</span>
          )}
          {overflow > 0 && (
            <span className="inline-flex items-center bg-transparent px-2 py-1 text-xs text-zinc-600">
              +{overflow}
            </span>
          )}
        </div>
      </td>
      <td className="h-16 w-[120px] p-4 align-middle">
        <div className="flex items-center gap-3 text-zinc-600">
          <UpdateChip icon={Plug} count={updates} title="Plugin updates" />
          <UpdateChip
            icon={Monitor}
            count={themeUpdates}
            title={
              themeUpdates === 1
                ? "1 theme update available"
                : `${themeUpdates} theme updates available`
            }
            dimmed={themeUpdates === 0}
          />
          <UpdateChip icon={Package} count={coreUpdates} title="Core updates" dimmed={coreUpdates === 0} />
        </div>
      </td>
      <td className="h-16 w-[100px] p-4 align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <ActionBtn
            href={siteUrl}
            title="Open WordPress admin"
          >
            <WordPressIcon size={16} className="text-zinc-500" />
          </ActionBtn>
          <ActionBtn title="Sync site" onClick={onOpen}>
            <RefreshCw size={16} strokeWidth={1} className="text-zinc-950" />
          </ActionBtn>
          <SiteActionsMenu
            site={site}
            onView={onOpen}
            onQuickView={onQuickView}
            canDelete={canDeleteSite}
          />
        </div>
      </td>
    </tr>
  );
}

export default function SitesPage() {
  const router = useRouter();
  const { sites, loading, error } = useSites();
  const { clients } = useClients();
  const { agency } = useAuth();
  const { roleCanDo } = useRole();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState<QuickFilter>(() => {
    const p = searchParams.get("filter");
    const valid: QuickFilter[] = ["all", "malware", "disconnected", "down", "updates"];
    // Legacy URL params from older filter names
    if (p === "hacked") return "malware";
    if (p === "vulnerable") return "updates";
    return valid.includes(p as QuickFilter) ? (p as QuickFilter) : "all";
  });
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [quickViewSiteId, setQuickViewSiteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const limit = agency ? PLAN_LIMITS[agency.plan] : 1;
  const atLimit = sites.length >= limit;
  const canAddSite = roleCanDo("add_site");
  const canDeleteSite = roleCanDo("delete_site");
  const showSelect = !agency?.is_client_portal;
  const showClientFilter = !agency?.is_client_portal;

  useEffect(() => {
    setSelected(new Set());
  }, [sites]);

  const filteredSites = useMemo(() => {
    let list = sites;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    if (activeClientId === "__unassigned__") {
      list = list.filter((s) => !s.client_id);
    } else if (activeClientId) {
      list = list.filter((s) => s.client_id === activeClientId);
    }
    if (quick !== "all") list = list.filter((s) => matchesQuick(s, quick));
    return list;
  }, [sites, search, activeClientId, quick]);

  const sortedSites = useMemo(() => {
    const list = [...filteredSites];
    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [filteredSites, sortAsc]);

  const quickViewSite = quickViewSiteId
    ? (sites.find((s) => s.id === quickViewSiteId) ?? null)
    : null;

  const allSelected =
    filteredSites.length > 0 && filteredSites.every((s) => selected.has(s.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredSites.map((s) => s.id)));
  }

  function toggleSite(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function executeBulk(action: "run_audit" | "trigger_scan" | "send_report") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setBulkMsg(null);
    try {
      const { data } = await api.post("/sites/bulk", {
        action,
        site_ids: Array.from(selected),
      });
      setBulkMsg(`Queued for ${(data as { queued: number }).queued} site(s).`);
      setSelected(new Set());
      setTimeout(() => setBulkMsg(null), 4000);
    } catch {
      setBulkMsg("Bulk action failed. Please try again.");
      setTimeout(() => setBulkMsg(null), 4000);
    } finally {
      setBulkLoading(false);
    }
  }

  function resetFilters() {
    setQuick("all");
    setActiveClientId(null);
    setSearch("");
    setFiltersDirty(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f4f5]">
      {bulkMsg && (
        <div
          className={cn(
            "mx-4 mt-3 shrink-0 rounded-lg border px-4 py-3 text-sm font-medium",
            bulkMsg.includes("failed")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-accent"
          )}
        >
          {bulkMsg}
        </div>
      )}

      {/* Page header — separate bar, no border-radius (MalCare page-header) */}
      <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-8 border-b border-zinc-200 bg-white p-4 pr-6 sm:flex-row sm:items-center">
        <div className="flex min-w-[222px] max-w-[50%] items-start gap-4 overflow-hidden">
          <AppWindow
            size={24}
            strokeWidth={1}
            className="m-1 shrink-0 rounded-full bg-zinc-300 text-zinc-950 shadow-[0_0_0_4px_rgb(244,244,245)]"
          />
          <div className="flex min-w-0 flex-col gap-1 overflow-hidden">
            <h1 className="overflow-hidden text-xl font-semibold leading-normal text-black">Manage Sites</h1>
            <p className="overflow-hidden text-xs font-normal leading-normal text-accent">Configure your sites</p>
          </div>
        </div>

        <div className="flex h-10 flex-1 flex-row items-center justify-end gap-6">
          <div className="min-w-0 flex-1">
            <div className="relative flex h-10 w-full items-center gap-2.5 rounded-lg bg-zinc-100 px-3">
              <Search size={16} strokeWidth={1} className="pointer-events-none shrink-0 text-zinc-950" />
              <input
                type="text"
                placeholder="Search for sites"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          {canAddSite && !agency?.is_client_portal && (
            <Button onClick={() => router.push("/sites/add")} disabled={atLimit} className="h-10 shrink-0 px-4">
              <Plus size={16} strokeWidth={1.5} />
              Add Site
            </Button>
          )}
        </div>
      </header>

      {/* Scroll area + rounded card (filters + table only) */}
      <div className="min-h-0 flex-1 overflow-auto p-4 pr-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && sites.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20">
            <EmptyState
              icon={<Globe size={24} className="text-zinc-300" />}
              title="No sites found"
              description="Get started by adding your first WordPress site."
              action={
                canAddSite ? (
                  <Button onClick={() => router.push("/sites/add")}>
                    <Plus size={16} />
                    Add Site
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {!loading && sites.length > 0 && (
          <div className="flex min-h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white md:flex-row">
            {/* Filter panel — MalCare 246px */}
            <aside className="sticky top-0 flex w-full shrink-0 flex-col border-b border-zinc-200 md:w-[246px] md:rounded-l-3xl md:border-b-0 md:border-r">
              <div className="border-b border-zinc-200 px-4 py-6">
                <div className="mb-4 flex items-center gap-2">
                  <Star size={16} strokeWidth={1.5} className="shrink-0 text-accent" />
                  <p className="text-sm font-semibold text-zinc-950">Quick Suggestions</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => {
                        setQuick(quick === q.value ? "all" : q.value);
                        setFiltersDirty(true);
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        quick === q.value
                          ? "border-accent bg-accent text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col px-4 py-4">
                <div className="flex items-center gap-2 rounded bg-zinc-100 p-2">
                  <ListFilter size={16} strokeWidth={1.5} className="shrink-0 text-accent" />
                  <p className="text-sm font-semibold text-zinc-950">Filters</p>
                </div>

                {showClientFilter ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium text-zinc-600">Client</label>
                    <select
                      value={activeClientId ?? ""}
                      onChange={(e) => {
                        setActiveClientId(e.target.value || null);
                        setFiltersDirty(true);
                      }}
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">All clients</option>
                      <option value="__unassigned__">Unassigned</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    Use Quick Suggestions above to focus on sites that need attention.
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 border-t border-zinc-200 px-4 py-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!filtersDirty && quick === "all" && !activeClientId}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-950 disabled:opacity-40"
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  Reset
                </button>
                <Button
                  size="sm"
                  disabled={!filtersDirty && quick === "all" && !activeClientId}
                  className="flex-1"
                  onClick={() => setFiltersDirty(false)}
                >
                  Apply
                </Button>
              </div>
            </aside>

            {/* Table area */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-r-3xl">
              {showSelect && selected.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
                  <span className="text-xs font-medium text-zinc-700">{selected.size} selected</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={bulkLoading}
                    onClick={() => executeBulk("run_audit")}
                  >
                    {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                    Run Audit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                </div>
              )}

              {filteredSites.length === 0 ? (
                <EmptyState
                  icon={<Search size={20} className="text-zinc-300" />}
                  title="No sites match"
                  description="Try resetting filters or clearing your search."
                  action={
                    <Button variant="secondary" onClick={resetFilters}>
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-white text-sm font-medium">
                      <tr className={cn("transition-colors hover:bg-[#f4f4f5]", HEADER_RULE)}>
                        {showSelect && (
                          <th className={TH_CHECKBOX}>
                            <div className="flex items-center justify-center">
                              <McCheckbox
                                checked={allSelected}
                                onChange={toggleAll}
                                ariaLabel="Select all sites"
                              />
                            </div>
                          </th>
                        )}
                        <th
                          className={cn(TH, "pl-0")}
                          onClick={() => setSortAsc((v) => !v)}
                        >
                          <div className="flex items-center gap-2">
                            Site Name
                            <ArrowUpDown
                              size={16}
                              strokeWidth={1}
                              className="shrink-0 text-zinc-950 opacity-60"
                            />
                          </div>
                        </th>
                        <th className={cn(TH, "w-[200px]")}>Alerts</th>
                        <th className={cn(TH, "w-[120px]")}>Updates</th>
                        <th className={cn(TH, "w-[100px]")}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSites.map((site) => (
                        <SiteRow
                          key={site.id}
                          site={site}
                          selected={selected.has(site.id)}
                          showSelect={showSelect}
                          canDeleteSite={canDeleteSite}
                          onToggle={() => toggleSite(site.id)}
                          onOpen={() => router.push(`/sites/${site.id}`)}
                          onQuickView={() => setQuickViewSiteId(site.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="shrink-0 px-4 py-3">
                <p className="text-sm font-medium text-zinc-500">
                  {filteredSites.length} of {sites.length} total sites.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {quickViewSite && (
        <SiteQuickViewDrawer site={quickViewSite} onClose={() => setQuickViewSiteId(null)} />
      )}
    </div>
  );
}
