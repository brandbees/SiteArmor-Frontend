"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Globe,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
  X,
  Bell,
  Sparkles,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import api from "@/lib/api";
import { mapSite, type RawSite } from "@/lib/mappers";
import type { Site } from "@/types";

type PaletteItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  keywords?: string[];
  href?: string;
  onSelect?: () => void;
};

function matchesQuery(item: PaletteItem, q: string) {
  if (!q) return true;
  const haystack = [item.title, item.description, ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesSite(site: Site, q: string) {
  const haystack = [site.name, site.url, site.client_name ?? ""].join(" ").toLowerCase();
  return haystack.includes(q);
}

export function CommandPalette() {
  const router = useRouter();
  const { agency } = useAuth();
  const { roleCanDo } = useRole();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual = agency?.account_type === "individual";

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const runItem = useCallback(
    (item: PaletteItem) => {
      close();
      if (item.onSelect) {
        item.onSelect();
        return;
      }
      if (item.href) router.push(item.href);
    },
    [close, router]
  );

  const quickActions = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Portfolio overview, alerts, and health summary",
        icon: LayoutDashboard,
        iconClass: "bg-blue-100 text-blue-600",
        href: "/dashboard",
        keywords: ["home", "overview"],
      },
      {
        id: "sites",
        title: "Sites Dashboard",
        description: "View and manage all your WordPress sites",
        icon: Globe,
        iconClass: "bg-sky-100 text-sky-600",
        href: "/sites",
        keywords: ["wordpress", "portfolio"],
      },
    ];

    if (!isClientPortal && roleCanDo("add_site")) {
      items.push({
        id: "add-site",
        title: "Add a site",
        description: "Connect a new WordPress site to your account",
        icon: Plus,
        iconClass: "bg-emerald-100 text-emerald-600",
        onSelect: () => window.dispatchEvent(new CustomEvent("bb:open-add-site")),
        keywords: ["new", "connect", "wordpress"],
      });
    }

    if (!isClientPortal && !isIndividual) {
      items.push({
        id: "clients",
        title: "Clients",
        description: "Manage client accounts and site assignments",
        icon: Users,
        iconClass: "bg-violet-100 text-violet-600",
        href: "/clients",
        keywords: ["customer", "agency"],
      });
    }

    if (!isClientPortal) {
      items.push(
        {
          id: "notifications",
          title: "Notifications",
          description: "Review alerts and announcements",
          icon: Bell,
          iconClass: "bg-amber-100 text-amber-600",
          href: "/notifications",
          keywords: ["alerts", "announcements"],
        },
        {
          id: "reports",
          title: "Reports",
          description: "Generate and send white-label client reports",
          icon: FileText,
          iconClass: "bg-rose-100 text-rose-600",
          href: "/reports",
          keywords: ["pdf", "client report"],
        },
        {
          id: "agent",
          title: "AI Agent",
          description: "Ask questions and remediate issues with AI",
          icon: Sparkles,
          iconClass: "bg-indigo-100 text-indigo-600",
          href: "/agent",
          keywords: ["ai", "chat", "fix"],
        }
      );
    }

    items.push({
      id: "settings",
      title: "Account Settings",
      description: "Manage your account preferences and billing",
      icon: Settings,
      iconClass: "bg-green-100 text-green-600",
      href: "/settings",
      keywords: ["profile", "preferences", "billing"],
    });

    if (!isClientPortal && !isIndividual && roleCanDo("manage_team")) {
      items.push({
        id: "team",
        title: "Team Management",
        description: "Invite users and manage team permissions",
        icon: Users,
        iconClass: "bg-purple-100 text-purple-600",
        href: "/settings?tab=team",
        keywords: ["invite", "members", "roles"],
      });
    }

    if (!isClientPortal && roleCanDo("access_billing")) {
      items.push({
        id: "billing",
        title: "Billing & Plans",
        description: "View your plan, usage, and upgrade options",
        icon: Settings,
        iconClass: "bg-zinc-100 text-zinc-600",
        href: "/settings?tab=billing",
        keywords: ["plan", "subscription", "invoice"],
      });
    }

    return items;
  }, [isClientPortal, isIndividual, roleCanDo]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredActions = useMemo(
    () => quickActions.filter((item) => matchesQuery(item, normalizedQuery)),
    [quickActions, normalizedQuery]
  );

  const filteredSites = useMemo(() => {
    if (!normalizedQuery) return [];
    return sites.filter((site) => matchesSite(site, normalizedQuery)).slice(0, 8);
  }, [sites, normalizedQuery]);

  const siteItems = useMemo<PaletteItem[]>(
    () =>
      filteredSites.map((site) => ({
        id: `site-${site.id}`,
        title: site.name,
        description: site.url,
        icon: Globe,
        iconClass: "bg-sky-100 text-sky-600",
        href: `/sites/${site.id}`,
        keywords: [site.url, site.client_name ?? ""],
      })),
    [filteredSites]
  );

  const visibleItems = useMemo(
    () => [...filteredActions, ...siteItems],
    [filteredActions, siteItems]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    api
      .get<{ sites: RawSite[] } | RawSite[]>("/sites")
      .then(({ data }) => {
        const raw = Array.isArray(data) ? data : (data.sites ?? []);
        setSites(raw.map(mapSite));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(visibleItems.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && visibleItems[activeIndex]) {
        e.preventDefault();
        runItem(visibleItems[activeIndex]);
      }
    }

    function onOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("bb:open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("bb:open-command-palette", onOpen);
    };
  }, [open, close, visibleItems, activeIndex, runItem]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:p-6">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[1px]"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_24px_64px_-16px_rgb(15_23_42/0.28)]"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for pages, actions, sites..."
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[min(60vh,520px)] overflow-y-auto px-4 py-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Quick Actions</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Get started with these common actions, or search for anything.
            </p>
          </div>

          {visibleItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <div className="space-y-2">
              {filteredActions.length > 0 && (
                <div className="space-y-2">
                  {filteredActions.map((item, index) => (
                    <PaletteRow
                      key={item.id}
                      item={item}
                      index={index}
                      active={activeIndex === index}
                      onSelect={() => runItem(item)}
                      onHover={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              )}

              {siteItems.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Sites
                  </p>
                  <div className="space-y-2">
                    {siteItems.map((item, i) => {
                      const index = filteredActions.length + i;
                      return (
                        <PaletteRow
                          key={item.id}
                          item={item}
                          index={index}
                          active={activeIndex === index}
                          onSelect={() => runItem(item)}
                          onHover={() => setActiveIndex(index)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  item,
  index,
  active,
  onSelect,
  onHover,
}: {
  item: PaletteItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      data-index={index}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
        active
          ? "border-accent/30 bg-accent/5"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          item.iconClass
        )}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
        <p className="truncate text-xs text-zinc-500">{item.description}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-zinc-300" />
    </button>
  );
}
