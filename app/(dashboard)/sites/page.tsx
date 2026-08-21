"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  WifiOff,
  Bug,
  Plug,
  Palette,
  Package,
  Star,
  Filter,
  RotateCcw,
  Loader2,
  Eye,
} from "lucide-react";
import { cn, truncateUrl } from "@/lib/utils";
import api from "@/lib/api";
import { useSites } from "@/hooks/useSites";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { SiteQuickViewDrawer } from "@/components/sites/SiteQuickViewDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { AddSiteModal } from "@/components/sites/AddSiteModal";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Site } from "@/types";

type QuickFilter = "all" | "hacked" | "disconnected" | "down" | "vulnerable" | "warning" | "healthy";

const QUICK: { value: QuickFilter; label: string }[] = [
  { value: "hacked", label: "Threats" },
  { value: "disconnected", label: "Disconnected" },
  { value: "down", label: "Down" },
  { value: "vulnerable", label: "Vulnerable" },
];

function siteAlerts(site: Site): { label: string; tone: "danger" | "warning" | "muted" }[] {
  const out: { label: string; tone: "danger" | "warning" | "muted" }[] = [];
  if (site.uptime_status === "down") out.push({ label: "Site Down", tone: "danger" });
  if (!site.plugin_connected) out.push({ label: "Disconnected", tone: "muted" });
  if (site.malware_status === "threat" || (site.major_threat_count ?? 0) > 0)
    out.push({ label: "Threat Detected", tone: "danger" });
  if ((site.plugin_vuln_count ?? 0) > 0)
    out.push({ label: "Vulnerabilities Found", tone: "warning" });
  if ((site.latest_scores?.security ?? 100) < 50)
    out.push({ label: "Security Issues", tone: "warning" });
  if (out.length === 0 && (site.overall_score ?? 100) < 80)
    out.push({ label: "Needs Attention", tone: "warning" });
  return out;
}

function matchesQuick(site: Site, filter: QuickFilter): boolean {
  switch (filter) {
    case "hacked":
      return site.malware_status === "threat" || (site.major_threat_count ?? 0) > 0;
    case "disconnected":
      return !site.plugin_connected;
    case "down":
      return site.uptime_status === "down";
    case "vulnerable":
      return (site.plugin_vuln_count ?? 0) > 0;
    case "warning":
      return (site.overall_score ?? 100) < 80 && (site.overall_score ?? 100) >= 50;
    case "healthy":
      return (site.overall_score ?? 0) >= 80 && site.uptime_status === "up";
    default:
      return true;
  }
}

function faviconSrc(url: string) {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

function SiteRow({
  site,
  selected,
  onToggle,
  onOpen,
  onQuick,
  showSelect,
}: {
  site: Site;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onQuick: () => void;
  showSelect: boolean;
}) {
  const alerts = siteAlerts(site);
  const primary = alerts[0];
  const updates = site.plugins_needing_updates ?? 0;
  const fav = faviconSrc(site.url);

  return (
    <tr className="group border-b border-border last:border-0 hover:bg-muted/40">
      {showSelect && (
        <td className="w-10 px-3 py-3.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="h-4 w-4 rounded-[3px] border-border accent-[var(--accent)]"
          />
        </td>
      )}
      <td className="px-3 py-3.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-border bg-muted">
            {fav ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fav} alt="" className="h-6 w-6 object-contain" />
            ) : (
              <Globe size={16} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground group-hover:text-accent">
              {site.name}
            </p>
            <p className="truncate text-xs font-medium text-accent/80">
              {truncateUrl(site.url)}
            </p>
          </div>
        </button>
      </td>
      <td className="px-3 py-3.5">
        {primary ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold",
              primary.tone === "danger" && "text-[var(--score-bad)]",
              primary.tone === "warning" && "text-[var(--score-warn)]",
              primary.tone === "muted" && "text-muted-foreground"
            )}
          >
            {primary.tone === "danger" ? (
              <Bug size={14} />
            ) : primary.label.includes("Down") ? (
              <WifiOff size={14} />
            ) : (
              <ShieldAlert size={14} />
            )}
            {primary.label}
          </span>
        ) : (
          <span className="text-xs font-medium text-[var(--score-good)]">All clear</span>
        )}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="relative inline-flex" title="Plugin updates">
            <Plug size={16} strokeWidth={1.75} />
            {updates > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                {updates}
              </span>
            )}
          </span>
          <span className="relative inline-flex opacity-50" title="Themes">
            <Palette size={16} strokeWidth={1.75} />
          </span>
          <span className="relative inline-flex opacity-50" title="Core">
            <Package size={16} strokeWidth={1.75} />
          </span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onQuick}
            title="Quick view"
            className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Eye size={15} strokeWidth={1.75} />
          </button>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open site"
            className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={15} strokeWidth={1.75} />
          </a>
          <button
            type="button"
            onClick={onOpen}
            title="Refresh / manage"
            className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-accent"
          >
            <RefreshCw size={15} strokeWidth={1.75} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SitesPage() {
  const router = useRouter();
  const { sites, loading, error } = useSites();
  const { agency } = useAuth();
  const { roleCanDo } = useRole();
  const searchParams = useSearchParams();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState<QuickFilter>(() => {
    const p = searchParams.get("filter");
    const valid: QuickFilter[] = [
      "all",
      "hacked",
      "disconnected",
      "down",
      "vulnerable",
      "warning",
      "healthy",
    ];
    return valid.includes(p as QuickFilter) ? (p as QuickFilter) : "all";
  });
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [quickViewSiteId, setQuickViewSiteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const limit = agency ? PLAN_LIMITS[agency.plan] : 1;
  const atLimit = sites.length >= limit;
  const canAddSite = roleCanDo("add_site");
  const showSelect = !agency?.is_client_portal;

  const allTags = useMemo(
    () => Array.from(new Set(sites.flatMap((s) => s.tags ?? []))).sort(),
    [sites]
  );

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
    if (activeTag) list = list.filter((s) => s.tags?.includes(activeTag));
    if (quick !== "all") list = list.filter((s) => matchesQuick(s, quick));
    return list;
  }, [sites, search, activeTag, quick]);

  const quickViewSite = quickViewSiteId
    ? (sites.find((s) => s.id === quickViewSiteId) ?? null)
    : null;

  const allSelected =
    filteredSites.length > 0 && filteredSites.every((s) => selected.has(s.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredSites.map((s) => s.id)));
    }
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
    setActiveTag(null);
    setSearch("");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Sites"
        description="Configure your sites."
        icon={<Globe size={22} strokeWidth={2} />}
        action={
          <>
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search for sites"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-[4px] border border-border bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-surface focus:outline-none"
              />
            </div>
            {canAddSite && !agency?.is_client_portal && (
              <Button onClick={() => setShowAdd(true)} disabled={atLimit}>
                <Plus size={15} strokeWidth={2.5} />
                Add Site
              </Button>
            )}
          </>
        }
      />

      {bulkMsg && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-[4px] border px-4 py-3 text-sm font-medium",
            bulkMsg.includes("failed")
              ? "border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] text-[var(--score-bad)]"
              : "border-accent/20 bg-accent-light text-accent"
          )}
        >
          <RefreshCw size={14} />
          {bulkMsg}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && sites.length === 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            tone="brand"
            icon={<Globe size={22} />}
            title="No sites found"
            description="Get started by adding your first WordPress site."
            action={
              canAddSite ? (
                <Button onClick={() => setShowAdd(true)}>
                  <Plus size={15} />
                  Add Site
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {!loading && sites.length > 0 && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Filter rail */}
          <aside className="w-full shrink-0 space-y-3 lg:w-56">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Star size={13} className="text-accent" />
                <p className="text-xs font-bold text-foreground">Quick Suggestions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setQuick(quick === q.value ? "all" : q.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      quick === q.value
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-foreground hover:border-accent/40"
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Filter size={13} className="text-accent" />
                <p className="text-xs font-bold text-foreground">Filters</p>
              </div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Tags
              </label>
              <select
                value={activeTag ?? ""}
                onChange={(e) => setActiveTag(e.target.value || null)}
                className="mb-4 h-10 w-full rounded-[4px] border border-border bg-muted/40 px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
                <Button size="sm" className="flex-1" onClick={() => {}}>
                  Apply
                </Button>
              </div>
            </div>
          </aside>

          {/* Table card */}
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface">
            {showSelect && selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
                <span className="text-xs font-bold text-foreground">
                  {selected.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => executeBulk("run_audit")}
                  className="h-8"
                >
                  {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                  Run Audit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                  className="h-8"
                >
                  Clear
                </Button>
              </div>
            )}

            {filteredSites.length === 0 ? (
              <EmptyState
                icon={<Search size={20} />}
                title="No sites match"
                description="Try resetting filters or clearing your search."
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {showSelect && (
                        <th className="w-10 px-3 py-3">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="h-4 w-4 rounded-[3px] border-border accent-[var(--accent)]"
                          />
                        </th>
                      )}
                      <th className="px-3 py-3">Site Name</th>
                      <th className="px-3 py-3">Alerts</th>
                      <th className="px-3 py-3">Updates</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSites.map((site) => (
                      <SiteRow
                        key={site.id}
                        site={site}
                        selected={selected.has(site.id)}
                        showSelect={showSelect}
                        onToggle={() => toggleSite(site.id)}
                        onOpen={() => router.push(`/sites/${site.id}`)}
                        onQuick={() => setQuickViewSiteId(site.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-border px-4 py-3 text-xs font-medium text-muted-foreground">
              {filteredSites.length} of {sites.length} total sites
            </div>
          </div>
        </div>
      )}

      {quickViewSite && (
        <SiteQuickViewDrawer
          site={quickViewSite}
          onClose={() => setQuickViewSiteId(null)}
        />
      )}

      {showAdd && (
        <AddSiteModal
          onClose={() => setShowAdd(false)}
          onSuccess={(siteId) => {
            setShowAdd(false);
            router.push(`/sites/${siteId}`);
          }}
        />
      )}
    </div>
  );
}
