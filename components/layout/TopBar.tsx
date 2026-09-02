"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { RefreshCw, User, LogOut, Settings, MoreVertical, PanelLeft, PanelLeftClose, ChevronRight, SquareDashedKanban } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useSiteContextOptional } from "@/components/sites/SiteContext";
import { parseSiteTab, SITE_TAB_LABELS } from "@/components/sites/site-nav";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { cacheClear, getLastFetchedAt } from "@/lib/dataCache";

function tsAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sites: "Sites",
  clients: "Clients",
  notifications: "Notifications",
  performance: "Performance",
  seo: "SEO",
  security: "Security",
  malware: "Malware",
  uptime: "Uptime",
  reports: "Reports",
  agent: "AI Agent",
  settings: "Settings",
  billing: "Plans & Billing",
  profile: "Profile",
};

function useBreadcrumbs(pathname: string, siteName?: string | null, activeTab?: string | null) {
  return useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);

    if (parts[0] === "sites") {
      if (parts[1] === "add") {
        return [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Site Onboarding", href: "/sites/add" },
        ];
      }
      const crumbs: { label: string; href: string }[] = [{ label: "Sites", href: "/sites" }];
      if (parts.length >= 2 && /^[0-9a-f-]{8,}$/i.test(parts[1])) {
        const siteHref = `/sites/${parts[1]}`;
        crumbs.push({ label: siteName ?? "Site", href: siteHref });
        if (activeTab && activeTab !== "overview") {
          const tabLabel = SITE_TAB_LABELS[parseSiteTab(activeTab)] ?? activeTab;
          crumbs.push({ label: tabLabel, href: `${siteHref}?tab=${activeTab}` });
        }
      }
      return crumbs;
    }

    if (parts[0] === "clients" && parts[1] === "add") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Client Onboarding", href: "/clients/add" },
      ];
    }

    if (parts.length === 0) return [{ label: "Dashboard", href: "/dashboard" }];
    const crumbs: { label: string; href: string }[] = [];
    let href = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      href += `/${part}`;
      if (part === "dashboard" && i === 0) continue;
      const isId = /^[0-9a-f-]{8,}$/i.test(part);
      const label = isId
        ? siteName ?? "Site"
        : CRUMB_LABELS[part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label, href });
    }
    return crumbs.length ? crumbs : [{ label: "Dashboard", href: "/dashboard" }];
  }, [pathname, siteName, activeTab]);
}

// ── Component ─────────────────────────────────────────────────────────────────

/** MalCare icon-only header control — bordered square */
const headerIconBtn =
  "inline-flex aspect-square shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white p-2 shadow-xs transition-colors hover:bg-zinc-200/30 active:bg-neutral-200 [&_svg]:size-5 [&_svg]:stroke-2 [&_svg]:text-zinc-950";

const headerIconBtnSm =
  "inline-flex aspect-square shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white p-2 shadow-xs transition-colors hover:bg-zinc-100 active:bg-neutral-200 [&_svg]:size-4 [&_svg]:stroke-1.5 [&_svg]:text-zinc-950";

export function TopBar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <Suspense fallback={<TopBarFallback collapsed={collapsed} onToggleSidebar={onToggleSidebar} />}>
      <TopBarInner collapsed={collapsed} onToggleSidebar={onToggleSidebar} />
    </Suspense>
  );
}

function TopBarFallback({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky z-40 flex h-20 w-full shrink-0 items-center gap-2.5 border-b border-zinc-300 bg-background p-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className={cn(headerIconBtn, "hidden h-10 w-10 md:inline-flex")}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeft size={20} strokeWidth={1} /> : <PanelLeftClose size={20} strokeWidth={1} />}
      </button>
    </header>
  );
}

function TopBarInner({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const { agency, logout } = useAuth();
  const { roleCanDo } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const siteCtx = useSiteContextOptional();
  const breadcrumbs = useBreadcrumbs(pathname, siteCtx?.site?.name, activeTab);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual   = agency?.account_type === "individual";

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<number | null>(null);
  const [, tick] = useState(0);

  const avatarRef    = useRef<HTMLDivElement>(null);

  const displayName = agency?.member_name ?? agency?.name ?? "";
  const initials    = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    function openAdd() {
      if (!isClientPortal && roleCanDo("add_site")) router.push("/sites/add");
    }
    window.addEventListener("bb:open-add-site", openAdd);
    return () => window.removeEventListener("bb:open-add-site", openAdd);
  }, [isClientPortal, roleCanDo, router]);

  // Seed lastUpdated from cache on mount, then listen for fresh fetches
  useEffect(() => {
    const ts = getLastFetchedAt("sites");
    if (ts) setLastUpdated(ts);
  }, []);

  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ key: string; fetchedAt: number }>;
      if (ce.detail.key === "sites") setLastUpdated(ce.detail.fetchedAt);
    }
    window.addEventListener("bb:data-fetched", handle);
    return () => window.removeEventListener("bb:data-fetched", handle);
  }, []);

  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      cacheClear();
      await api.post("/sites/cache/clear").catch(() => {});
      window.dispatchEvent(new Event("bb:refresh"));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (avatarRef.current   && !avatarRef.current.contains(e.target as Node))   setShowAvatarMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleSignOut() {
    if (isClientPortal) {
      clearToken();
      router.push("/client-portal/login");
    } else {
      logout();
    }
  }

  return (
    <>
      <header className="sticky z-40 flex h-20 w-full shrink-0 items-center gap-2.5 border-b border-zinc-300 bg-background p-4">
        {/* Left: collapse + breadcrumbs */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(headerIconBtn, "hidden h-10 w-10 md:inline-flex")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={20} strokeWidth={1} /> : <PanelLeftClose size={20} strokeWidth={1} />}
        </button>
        <MobileNav />
        <nav aria-label="Breadcrumb" className="flex min-w-0 grow flex-nowrap items-center gap-1 overflow-hidden">
          <ol className="flex items-center gap-1">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li
                  key={c.href + i}
                  className={cn(
                    "flex items-center text-sm font-medium leading-4",
                    last ? "text-accent" : "text-zinc-600"
                  )}
                  aria-current={last ? "page" : undefined}
                >
                  {i > 0 && (
                    <ChevronRight size={16} strokeWidth={1.5} className="mx-1 shrink-0 text-zinc-400" aria-hidden />
                  )}
                  {last ? (
                    <div className="min-w-0 truncate">{c.label}</div>
                  ) : (
                    <Link href={c.href} className="min-w-0 truncate transition-colors hover:text-zinc-900">
                      {c.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="hidden max-w-44 cursor-not-allowed items-center gap-2 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 opacity-60 disabled:pointer-events-none md:flex"
          >
            <SquareDashedKanban size={16} strokeWidth={1} className="shrink-0 text-zinc-400" />
            <span className="truncate text-xs font-medium text-zinc-500">
              {refreshing ? "Refreshing…" : lastUpdated ? `Updated ${tsAgo(lastUpdated)}` : "No Tasks Running"}
            </span>
          </button>

          {!isClientPortal && <NotificationDropdown />}

          {!!agency && (
            <div className="flex items-center gap-2.5">
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="truncate text-xs text-zinc-600">{agency?.email}</div>
              </div>

              <div className="relative" ref={avatarRef}>
                <button
                  type="button"
                  onClick={() => setShowAvatarMenu((v) => !v)}
                  className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white shadow-xs ring-2 ring-orange-400 ring-offset-1 transition-all hover:border-gray-400 hover:shadow-md"
                  title={agency?.email ?? ""}
                >
                  {initials}
                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />
                </button>

                {showAvatarMenu && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    <div className="border-b border-zinc-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-zinc-950">{displayName}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">{agency?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      {!isClientPortal && (
                        <>
                          <Link
                            href="/settings/profile"
                            onClick={() => setShowAvatarMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-900 hover:bg-zinc-50"
                          >
                            <User size={14} className="text-accent" />
                            <span className="font-medium">Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setShowAvatarMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-900 hover:bg-zinc-50"
                          >
                            <Settings size={14} className="text-zinc-500" />
                            <span className="font-medium">Settings</span>
                          </Link>
                          <div className="mx-3 my-1 border-t border-zinc-200" />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAvatarMenu(false);
                          handleSignOut();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        <span className="font-medium">Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAvatarMenu((v) => !v)}
                className={cn(headerIconBtn, "h-10 w-10 hover:bg-gray-50 [&_svg]:size-6")}
                aria-label="Account menu"
              >
                <MoreVertical size={24} strokeWidth={1} />
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
