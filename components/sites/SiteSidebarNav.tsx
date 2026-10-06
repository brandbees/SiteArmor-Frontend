"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, truncateUrl } from "@/lib/utils";
import {
  SITE_NAV_GROUPS,
  filterSiteNavForClient,
  isNavItemActive,
  parseSiteTab,
  resolveSiteNavHref,
  type SiteNavGroup,
  type SiteNavLeaf,
} from "@/components/sites/site-nav";
import { useSiteContextOptional } from "@/components/sites/SiteContext";
import { getAgency } from "@/lib/auth";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 px-1.5 text-[10px] font-bold tabular-nums text-zinc-700">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function ActiveBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold tabular-nums text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SiteNavLeafLink({
  siteId,
  item,
  active,
  collapsed,
  badge,
  indent,
}: {
  siteId: string;
  item: SiteNavLeaf;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  indent?: boolean;
}) {
  const Icon = item.icon;
  const href = resolveSiteNavHref(siteId, item);

  if (active) {
    return (
      <Link
        href={href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group flex items-center rounded-lg bg-accent text-white transition-colors",
          collapsed ? "mx-auto w-fit p-2" : "h-8 gap-2 px-3",
          indent && !collapsed && "ml-3"
        )}
      >
        <Icon size={16} strokeWidth={2} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
            <ActiveBadge count={badge ?? 0} />
          </>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm font-normal text-zinc-700 transition-colors hover:bg-zinc-100",
        collapsed ? "mx-auto w-fit p-2" : "h-8 gap-2 px-3",
        indent && !collapsed && "ml-3"
      )}
    >
      <Icon size={16} strokeWidth={1.5} className="shrink-0 text-zinc-950" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <NavBadge count={badge ?? 0} />
        </>
      )}
    </Link>
  );
}

function CollapsedGroupFlyout({
  group,
  siteId,
  activeTab,
  pathname,
  search,
  badges,
  hasActiveChild,
}: {
  group: SiteNavGroup;
  siteId: string;
  activeTab: ReturnType<typeof parseSiteTab>;
  pathname: string;
  search: string;
  badges: Record<string, number>;
  hasActiveChild: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const GroupIcon = group.icon;

  function place() {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = group.items.length * 40 + 16;
    const top = Math.min(r.top, Math.max(8, window.innerHeight - menuH - 8));
    setPos({ top, left: r.right + 10 });
  }

  function show() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    place();
    setOpen(true);
  }

  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const menu = open
    ? createPortal(
        <div
          role="menu"
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[80] min-w-[220px] rounded-2xl border border-zinc-200/90 bg-white py-2 shadow-[0_12px_40px_rgb(15_23_42/0.14)]"
        >
          {group.items.map((item) => {
            const Icon = item.icon;
            const href = resolveSiteNavHref(siteId, item);
            const active = isNavItemActive(activeTab, item, pathname, siteId, search);
            return (
              <Link
                key={item.id}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-zinc-50 font-medium text-accent"
                    : "font-normal text-zinc-700 hover:bg-zinc-50"
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.5}
                  className={cn("shrink-0", active ? "text-accent" : "text-zinc-500")}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {(badges[item.id] ?? 0) > 0 && <NavBadge count={badges[item.id]} />}
              </Link>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        title={group.label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
        className={cn(
          "relative mx-auto flex w-fit items-center justify-center rounded-lg p-2 transition-colors",
          hasActiveChild ? "bg-accent text-white" : "text-zinc-950 hover:bg-zinc-100"
        )}
      >
        <GroupIcon size={16} strokeWidth={hasActiveChild ? 2 : 1.5} />
        <ChevronRight
          size={10}
          strokeWidth={2.5}
          className={cn(
            "absolute -right-0.5 top-1/2 -translate-y-1/2",
            hasActiveChild ? "text-white/90" : "text-zinc-400"
          )}
        />
      </button>
      {menu}
    </div>
  );
}

function NavGroup({
  group,
  siteId,
  activeTab,
  pathname,
  search,
  collapsed,
  open,
  onToggle,
  badges,
}: {
  group: SiteNavGroup;
  siteId: string;
  activeTab: ReturnType<typeof parseSiteTab>;
  pathname: string;
  search: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  badges: Record<string, number>;
}) {
  const GroupIcon = group.icon;
  const hasActiveChild = group.items.some((item) =>
    isNavItemActive(activeTab, item, pathname, siteId, search)
  );

  // Single-item groups render as direct links (MalCare: Performance, etc.)
  if (group.items.length === 1) {
    const item = group.items[0];
    return (
      <SiteNavLeafLink
        siteId={siteId}
        item={item}
        active={isNavItemActive(activeTab, item, pathname, siteId, search)}
        collapsed={collapsed}
        badge={badges[item.id]}
      />
    );
  }

  if (collapsed) {
    return (
      <CollapsedGroupFlyout
        group={group}
        siteId={siteId}
        activeTab={activeTab}
        pathname={pathname}
        search={search}
        badges={badges}
        hasActiveChild={hasActiveChild}
      />
    );
  }

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors",
          hasActiveChild ? "text-accent" : "text-zinc-800 hover:bg-zinc-100"
        )}
      >
        <GroupIcon size={16} strokeWidth={1.5} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
        {open ? (
          <ChevronDown size={14} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-zinc-500" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 border-l border-zinc-200/80 pl-1">
          {group.items.map((item) => (
            <SiteNavLeafLink
              key={item.id}
              siteId={siteId}
              item={item}
              active={isNavItemActive(activeTab, item, pathname, siteId, search)}
              collapsed={false}
              badge={badges[item.id]}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteSidebarNav({
  siteId,
  collapsed,
}: {
  siteId: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const activeTab = parseSiteTab(searchParams.get("tab"));
  const siteCtx = useSiteContextOptional();
  const site = siteCtx?.site;

  const badges = useMemo(() => {
    const pluginUpdates = site?.plugins_needing_updates ?? 0;
    const map: Record<string, number> = {};
    for (const group of SITE_NAV_GROUPS) {
      for (const item of group.items) {
        if (item.badgeFrom === "plugins") map[item.id] = pluginUpdates;
      }
    }
    return map;
  }, [site?.plugins_needing_updates]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SITE_NAV_GROUPS.map((g) => [g.id, g.defaultOpen ?? false]))
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of SITE_NAV_GROUPS) {
        if (group.items.some((item) => isNavItemActive(activeTab, item, pathname, siteId, search))) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [activeTab, pathname, siteId, search]);

  const visibleGroups = useMemo(() => {
    const isClientPortal = !!getAgency()?.is_client_portal;
    return filterSiteNavForClient(SITE_NAV_GROUPS, isClientPortal).filter((g) => {
      if (g.id === "commerce" && !site?.woocommerce_active) return false;
      return true;
    });
  }, [site?.woocommerce_active]);

  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="mb-1 flex h-8 shrink-0 items-center px-3 text-xs font-medium text-zinc-500/80">
          Site Navigation
        </p>
      )}
      {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-zinc-200" />}

      {/* Site identity — MalCare gray card + status square */}
      {!collapsed && site && (
        <Link
          href={`/sites/${siteId}`}
          className={cn(
            "mb-3 flex items-start gap-2.5 rounded-lg bg-zinc-100 px-2.5 py-2.5 transition-colors hover:bg-zinc-200/70",
            activeTab === "overview" && "ring-1 ring-accent/25"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 rounded-[3px]",
              site.uptime_status === "down" ? "bg-red-500" : "bg-[var(--score-good)]"
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">{site.name}</p>
            <p className="truncate text-xs font-medium text-accent">{truncateUrl(site.url, 36)}</p>
          </div>
        </Link>
      )}

      {collapsed && site && (
        <Link
          href={`/sites/${siteId}`}
          title={site.name}
          className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-accent"
        >
          {site.name[0]?.toUpperCase()}
        </Link>
      )}

      {!collapsed && !site && (
        <div className="mb-3 h-[52px] animate-pulse rounded-lg bg-zinc-100" />
      )}

      <div className="space-y-0.5">
        {visibleGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            siteId={siteId}
            activeTab={activeTab}
            pathname={pathname}
            search={search}
            collapsed={collapsed}
            open={!!openGroups[group.id]}
            onToggle={() =>
              setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
            }
            badges={badges}
          />
        ))}
      </div>
    </div>
  );
}

export function SiteSidebarNavFallback({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="mb-2 space-y-1">
      {!collapsed && (
        <div className="mb-3 h-14 animate-pulse rounded-lg bg-zinc-100" />
      )}
      {SITE_NAV_GROUPS.slice(0, 4).map((g) => (
        <div
          key={g.id}
          className={cn("h-9 animate-pulse rounded-lg bg-zinc-100", collapsed ? "mx-auto w-9" : "w-full")}
        />
      ))}
    </div>
  );
}
