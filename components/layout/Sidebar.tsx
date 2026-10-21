"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Search,
  Settings,
  Wifi,
  Users,
  Sparkles,
  Bell,
  LifeBuoy,
  Plus,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/contexts/BrandingContext";
import { useRole } from "@/hooks/useRole";
import { ChangelogModal } from "@/components/shared/ChangelogModal";
import { SiteSidebarNav, SiteSidebarNavFallback } from "@/components/sites/SiteSidebarNav";
import { SiteSidebarFooter } from "@/components/sites/SiteSidebarFooter";
import { useSiteContextOptional } from "@/components/sites/SiteContext";
import api from "@/lib/api";

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
  { href: "/malware", label: "Malware", icon: ShieldAlert, clientVisible: true },
  { href: "/clients", label: "Clients", icon: Users, clientVisible: false, agencyOnly: true },
  { href: "/notifications", label: "Notifications", icon: Bell, clientVisible: false },
];

const SETTINGS_NAV: NavItem[] = [
  { href: "/billing", label: "Plans & Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function filterNav(items: NavItem[], isClientPortal: boolean, isIndividual: boolean) {
  return items.filter(
    (item) =>
      (!isClientPortal || item.clientVisible) && (!isIndividual || !item.agencyOnly)
  );
}

function QuickAddButton({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
        active ? "text-white/90 hover:bg-white/15" : "text-zinc-500 hover:bg-zinc-200"
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
      <Plus size={14} strokeWidth={1.5} />
    </span>
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

  if (active) {
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group flex items-center rounded-lg bg-accent text-white transition-colors",
          collapsed ? "mx-auto w-fit gap-0 p-2" : "h-8 w-full gap-2 px-3"
        )}
      >
        <Icon size={16} strokeWidth={2} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
            {item.quickAdd && <QuickAddButton active />}
          </>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm font-normal text-zinc-700 transition-colors hover:bg-zinc-100",
        collapsed ? "mx-auto w-fit p-2" : "h-8 gap-2 px-3"
      )}
    >
      <Icon size={16} strokeWidth={1.5} className="shrink-0 text-zinc-950" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.quickAdd && <QuickAddButton />}
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
    <div className="mb-2">
      {!collapsed && (
        <p className="mb-1 flex h-8 shrink-0 items-center px-3 text-xs font-medium text-zinc-500/80">
          {label}
        </p>
      )}
      {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-zinc-200" />}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={
              item.href === "/sites"
                ? pathname === "/sites" || pathname === "/sites/add"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            }
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const siteCtx = useSiteContextOptional();
  const siteDetailMatch = pathname?.match(/^\/sites\/([^/]+)$/);
  const isSiteDetail = !!siteDetailMatch && siteDetailMatch[1] !== "add";
  const siteIdFromPath = siteDetailMatch?.[1];
  const { agency } = useAuth();
  const { logoUrl } = useBranding();
  const { roleCanDo } = useRole();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  /** Peek-open while pointer is over the rail — widens layout slot like pin-toggle. */
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual = agency?.account_type === "individual";
  const brand = agency?.brand_name || "Site Armor";
  const railCollapsed = collapsed && !hoverExpanded;

  useEffect(() => {
    if (!collapsed) setHoverExpanded(false);
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  function handleRailEnter() {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (collapsed) setHoverExpanded(true);
  }

  function handleRailLeave() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHoverExpanded(false), 120);
  }

  useEffect(() => {
    if (isClientPortal) return;
    api
      .get<{ unread: number }>("/changelog")
      .then(({ data }) => setUnreadCount(data.unread))
      .catch(() => {});
  }, [isClientPortal]);

  const manageItems = filterNav(MANAGE_NAV, isClientPortal, isIndividual);
  const globalItems = isSiteDetail
    ? manageItems.filter((item) => item.href === "/sites")
    : manageItems;
  const settingsItems = filterNav(SETTINGS_NAV, isClientPortal, isIndividual).filter(({ href }) =>
    href === "/billing" ? roleCanDo("access_billing") : true
  );
  const activeSiteId = siteCtx?.siteId ?? siteIdFromPath;

  return (
    <>
      {/* Hover expand widens the slot (same as pin-toggle) so header/content shrink instead of overlay */}
      <div
        className={cn(
          "relative hidden shrink-0 self-stretch transition-[width] duration-200 ease-linear md:block",
          railCollapsed ? "w-[4rem]" : "w-[280px]"
        )}
      >
        <aside
          onMouseEnter={handleRailEnter}
          onMouseLeave={handleRailLeave}
          className="flex h-full w-full flex-col border-r border-zinc-200 bg-white"
        >
        {/* Search trigger — MalCare pill */}
        <div className={cn("shrink-0", railCollapsed ? "px-2 py-2" : "p-2 px-3")}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("bb:open-command-palette"))}
            className={cn(
              "flex w-full items-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200/80",
              railCollapsed ? "h-9 justify-center" : "h-9 gap-2 px-3"
            )}
            title="Search (Ctrl+K)"
          >
            {!railCollapsed && (
              <>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent">
                    <Wifi size={11} className="text-white" />
                  </div>
                )}
                <span className="flex-1 truncate text-left text-xs font-extralight text-zinc-600">
                  Search or press Ctrl+K / ⌘K
                </span>
              </>
            )}
            <Search size={16} strokeWidth={1.5} className="shrink-0 text-zinc-950" />
          </button>
          {!railCollapsed && !logoUrl && (
            <p className="mt-2 truncate px-1 text-[11px] font-semibold text-zinc-400">{brand}</p>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("mx-2 flex-1 overflow-y-auto overflow-x-hidden py-2", railCollapsed ? "px-1.5" : "px-2")}>
          <NavSection
            label={isSiteDetail ? "Global" : "Manage"}
            items={globalItems}
            collapsed={railCollapsed}
            pathname={pathname}
          />
          {isSiteDetail && activeSiteId ? (
            <Suspense fallback={<SiteSidebarNavFallback collapsed={railCollapsed} />}>
              <SiteSidebarNav siteId={activeSiteId} collapsed={railCollapsed} />
            </Suspense>
          ) : null}
          {!isClientPortal && (
            <NavSection label="Account" items={settingsItems} collapsed={railCollapsed} pathname={pathname} />
          )}

          {!isClientPortal && !railCollapsed && (
            <button
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="mt-1 flex h-8 w-full items-center gap-2 rounded-lg px-3 text-sm font-normal text-zinc-700 hover:bg-zinc-100"
            >
              <Sparkles size={16} strokeWidth={1.5} />
              What&apos;s new
              {unreadCount > 0 && (
                <span className="ml-auto rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {isSiteDetail && (
          <SiteSidebarFooter site={siteCtx?.site} collapsed={railCollapsed} />
        )}

        {/* Support footer — hidden on site detail (WP/PHP sticky footer instead) */}
        {!isSiteDetail && (
        <div className={cn("shrink-0 border-t border-zinc-200", railCollapsed ? "p-2" : "p-2 px-3")}>
          {!railCollapsed ? (
            <a
              href="mailto:support@sitearmor.com"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-colors hover:bg-zinc-100"
            >
              <LifeBuoy size={16} strokeWidth={1.5} className="shrink-0 text-zinc-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900">Support</p>
                <p className="truncate text-[11px] text-zinc-500">support@sitearmor.com</p>
              </div>
            </a>
          ) : (
            <a
              href="mailto:support@sitearmor.com"
              title="Support"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
            >
              <LifeBuoy size={18} strokeWidth={1.5} />
            </a>
          )}
        </div>
        )}

        <ChangelogModal
          open={changelogOpen}
          onClose={() => setChangelogOpen(false)}
          onSeen={() => setUnreadCount(0)}
        />
        </aside>
      </div>
    </>
  );
}
