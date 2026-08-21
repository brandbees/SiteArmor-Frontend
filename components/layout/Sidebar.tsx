"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
};

const MANAGE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, clientVisible: true },
  { href: "/sites", label: "Sites", icon: Globe, clientVisible: true },
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

const ACCOUNT_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

type TooltipState = { label: string; top: number; left: number } | null;

function SidebarTooltipPortal({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: tooltip.top,
        left: tooltip.left,
        transform: "translateY(-50%)",
        zIndex: 9999,
      }}
      className="pointer-events-none"
    >
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
      <div className="whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-elevated-md">
        {tooltip.label}
      </div>
    </div>,
    document.body
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onShowTooltip,
  onHideTooltip,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onShowTooltip: (e: React.MouseEvent<HTMLElement>, label: string) => void;
  onHideTooltip: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onMouseEnter={(e) => onShowTooltip(e, item.label)}
      onMouseLeave={onHideTooltip}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg text-sm font-semibold transition-all duration-150",
        collapsed ? "w-full justify-center px-0 py-2.5" : "px-3 py-2",
        active
          ? "bg-accent-light text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && !collapsed ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
      ) : null}
      <Icon
        size={16}
        strokeWidth={active ? 2.25 : 2}
        className={cn("shrink-0", active ? "text-accent" : "group-hover:text-accent")}
      />
      {!collapsed && item.label}
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
  pathname,
  onShowTooltip,
  onHideTooltip,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  onShowTooltip: (e: React.MouseEvent<HTMLElement>, label: string) => void;
  onHideTooltip: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-4">
      {!collapsed ? (
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
          {label}
        </p>
      ) : (
        <div className="mx-auto mb-1.5 h-px w-6 bg-border" />
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            collapsed={collapsed}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("bb_sidebar_collapsed") === "1";
  });
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual = agency?.account_type === "individual";

  useEffect(() => {
    if (isClientPortal) return;
    api
      .get<{ unread: number }>("/changelog")
      .then(({ data }) => setUnreadCount(data.unread))
      .catch(() => {});
  }, [isClientPortal]);

  function filterNav(items: NavItem[]) {
    return items.filter(
      (item) =>
        (!isClientPortal || item.clientVisible) &&
        (!isIndividual || !item.agencyOnly)
    );
  }

  const manageItems = filterNav(MANAGE_NAV);
  const insightsItems = filterNav(INSIGHTS_NAV);
  const accountItems = filterNav(ACCOUNT_NAV).filter(({ href }) => {
    if (href === "/billing") return roleCanDo("access_billing");
    return true;
  });

  const displayName = agency?.member_name ?? agency?.name ?? "";
  const displayEmail = agency?.email ?? "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleLogout() {
    if (isClientPortal) {
      clearToken();
      router.push("/client-portal/login");
    } else {
      logout();
    }
  }

  function toggleCollapsed() {
    setTooltip(null);
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("bb_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  const showTooltip = useCallback(
    (e: React.MouseEvent<HTMLElement>, label: string) => {
      if (!collapsed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 12 });
    },
    [collapsed]
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  return (
    <>
      <aside
        className={cn(
          "hidden min-h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-all duration-200 lg:flex",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <div className="flex h-[4.5rem] shrink-0 items-center gap-2 border-b border-border px-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Agency logo"
                className={cn(
                  "shrink-0 object-contain",
                  collapsed ? "h-7 w-7" : "h-8 max-h-8 max-w-[120px]"
                )}
              />
            ) : (
              <>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Wifi size={16} className="text-white" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="font-portal-display truncate text-sm font-bold leading-none text-foreground">
                      {agency?.brand_name || "Site Armor"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Agency portal</p>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-all hover:border-border-strong hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto pb-2 pt-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          <NavSection
            label="Manage"
            items={manageItems}
            collapsed={collapsed}
            pathname={pathname}
            onShowTooltip={showTooltip}
            onHideTooltip={hideTooltip}
          />
          <NavSection
            label="Insights"
            items={insightsItems}
            collapsed={collapsed}
            pathname={pathname}
            onShowTooltip={showTooltip}
            onHideTooltip={hideTooltip}
          />
          {!isClientPortal && (
            <NavSection
              label="Account"
              items={accountItems}
              collapsed={collapsed}
              pathname={pathname}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          )}
        </nav>

        {!isClientPortal && (
          <div className={cn("pb-2", collapsed ? "px-2" : "px-3")}>
            <button
              onClick={() => setChangelogOpen(true)}
              onMouseEnter={(e) => showTooltip(e, "What's new")}
              onMouseLeave={hideTooltip}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
              )}
            >
              <div className="relative shrink-0">
                <Sparkles size={16} />
                {collapsed && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                )}
              </div>
              {!collapsed && (
                <>
                  What&apos;s new
                  {unreadCount > 0 && (
                    <span className="ml-auto min-w-[18px] rounded-md bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        )}

        <div className={cn("border-t border-border py-3", collapsed ? "px-2" : "px-3")}>
          {!!agency &&
            (collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 cursor-default items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                  onMouseEnter={(e) => showTooltip(e, displayName)}
                  onMouseLeave={hideTooltip}
                >
                  {initials}
                </div>
                <button
                  onClick={handleLogout}
                  onMouseEnter={(e) => showTooltip(e, "Sign out")}
                  onMouseLeave={hideTooltip}
                  className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-[var(--destructive-light)] hover:text-destructive"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold leading-none text-foreground">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[var(--destructive-light)] hover:text-destructive"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ))}
        </div>

        <ChangelogModal
          open={changelogOpen}
          onClose={() => setChangelogOpen(false)}
          onSeen={() => setUnreadCount(0)}
        />
      </aside>

      <SidebarTooltipPortal tooltip={tooltip} />
    </>
  );
}
