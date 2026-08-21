"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Search,
  Zap,
  Shield,
  Bug,
  Activity,
  FileText,
  Bot,
  Settings,
  LogOut,
  Wifi,
  Users,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/contexts/BrandingContext";
import { useRole } from "@/hooks/useRole";
import { ChangelogModal } from "@/components/shared/ChangelogModal";
import api from "@/lib/api";
import { clearToken } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  clientVisible?: boolean;
  agencyOnly?: boolean;
  quickAdd?: boolean;
};

const MANAGE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, clientVisible: true },
  { href: "/sites", label: "Sites", icon: Globe, clientVisible: true, quickAdd: true },
  { href: "/clients", label: "Clients", icon: Users, clientVisible: false, agencyOnly: true },
  { href: "/notifications", label: "Notifications", icon: Bell, clientVisible: false },
];

const INSIGHTS_NAV: NavItem[] = [
  { href: "/performance", label: "Performance", icon: Zap, clientVisible: true },
  { href: "/seo", label: "SEO", icon: Search, clientVisible: true },
  { href: "/security", label: "Security", icon: Shield, clientVisible: true },
  { href: "/malware", label: "Malware", icon: Bug, clientVisible: true },
  { href: "/uptime", label: "Uptime", icon: Activity, clientVisible: true },
  { href: "/reports", label: "Reports", icon: FileText, clientVisible: false },
  { href: "/agent", label: "AI Agent", icon: Bot, clientVisible: false },
];

const SETTINGS_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function filterNav(
  items: NavItem[],
  isClientPortal: boolean,
  isIndividual: boolean
) {
  return items.filter(
    (item) =>
      (!isClientPortal || item.clientVisible) &&
      (!isIndividual || !item.agencyOnly)
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[4px] text-[13px] font-semibold transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
        active
          ? "bg-accent text-white"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.25 : 1.75} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.quickAdd && (
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-[3px] opacity-0 transition-opacity group-hover:opacity-100",
                active ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("bb:open-add-site"));
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("bb:open-add-site"));
                }
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
  pathname,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-5">
      {!collapsed ? (
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      ) : (
        <div className="mx-auto mb-2 h-px w-6 bg-border" />
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { agency, logout } = useAuth();
  const { logoUrl } = useBranding();
  const { roleCanDo } = useRole();
  const router = useRouter();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navQuery, setNavQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual = agency?.account_type === "individual";

  // Read collapse preference after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    setCollapsed(localStorage.getItem("bb_sidebar_collapsed") === "1");
  }, []);

  useEffect(() => {
    if (isClientPortal) return;
    api
      .get<{ unread: number }>("/changelog")
      .then(({ data }) => setUnreadCount(data.unread))
      .catch(() => {});
  }, [isClientPortal]);

  const manageItems = filterNav(MANAGE_NAV, isClientPortal, isIndividual);
  const insightsItems = filterNav(INSIGHTS_NAV, isClientPortal, isIndividual);
  const settingsItems = filterNav(SETTINGS_NAV, isClientPortal, isIndividual).filter(
    ({ href }) => (href === "/billing" ? roleCanDo("access_billing") : true)
  );

  const allItems = useMemo(
    () => [...manageItems, ...insightsItems, ...settingsItems],
    [manageItems, insightsItems, settingsItems]
  );

  const filtered = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return null;
    return allItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [allItems, navQuery]);

  const displayName = agency?.member_name ?? agency?.name ?? "";
  const displayEmail = agency?.email ?? "";
  const brand = agency?.brand_name || "Site Armor";

  function handleLogout() {
    if (isClientPortal) {
      clearToken();
      router.push("/client-portal/login");
    } else {
      logout();
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("bb_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      <aside
        className={cn(
          "hidden min-h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border",
            collapsed ? "justify-center px-2" : "gap-3 px-4"
          )}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className={cn("object-contain", collapsed ? "h-7 w-7" : "h-8 max-w-[130px]")}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-accent">
              <Wifi size={15} className="text-white" />
            </div>
          )}
          {!collapsed && !logoUrl && (
            <div className="min-w-0 flex-1">
              <p className="font-portal-display truncate text-sm font-bold text-foreground">
                {brand}
              </p>
            </div>
          )}
          {!collapsed && logoUrl && <div className="flex-1" />}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 w-full rounded-[4px] border border-border bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {filtered ? (
            <div className="space-y-0.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
              ) : (
                filtered.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={
                      pathname === item.href || pathname.startsWith(item.href + "/")
                    }
                    collapsed={collapsed}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              <NavSection
                label="Manage"
                items={manageItems}
                collapsed={collapsed}
                pathname={pathname}
              />
              <NavSection
                label="Insights"
                items={insightsItems}
                collapsed={collapsed}
                pathname={pathname}
              />
              {!isClientPortal && (
                <NavSection
                  label="Settings"
                  items={settingsItems}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              )}
            </>
          )}

          {!isClientPortal && !collapsed && (
            <button
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="mt-1 flex w-full items-center gap-3 rounded-[4px] px-3 py-2 text-[13px] font-semibold text-foreground/80 hover:bg-muted"
            >
              <Sparkles size={16} strokeWidth={1.75} />
              What&apos;s new
              {unreadCount > 0 && (
                <span className="ml-auto rounded-[4px] bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Support + user */}
        <div className={cn("shrink-0 border-t border-border p-3", collapsed && "px-2")}>
          {!collapsed && (
            <a
              href="mailto:support@sitearmor.com"
              className="mb-3 flex items-center gap-3 rounded-[4px] border border-border bg-background px-3 py-2.5 hover:border-accent/30"
            >
              <LifeBuoy size={16} className="shrink-0 text-accent" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">Support</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  support@sitearmor.com
                </p>
              </div>
            </a>
          )}

          {!!agency && (
            <div
              className={cn(
                "flex items-center gap-2.5",
                collapsed ? "flex-col" : "rounded-[4px] px-1 py-1"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {displayName
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{displayEmail}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="rounded-[4px] p-1.5 text-muted-foreground hover:bg-[var(--destructive-light)] hover:text-destructive"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>

        <ChangelogModal
          open={changelogOpen}
          onClose={() => setChangelogOpen(false)}
          onSeen={() => setUnreadCount(0)}
        />
      </aside>
    </>
  );
}
