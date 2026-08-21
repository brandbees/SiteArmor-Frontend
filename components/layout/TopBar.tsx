"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Bell, Plus, RefreshCw, User, LogOut, X, Pin, AlertTriangle, Megaphone, ShieldAlert, Zap, Search, ArrowRight, Settings, MoreVertical } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AddSiteModal } from "@/components/sites/AddSiteModal";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { cacheClear, getLastFetchedAt } from "@/lib/dataCache";

interface NotifBreach {
  pillar: string;
  score: number | null;
  priority?: string;
}

interface NotifItem {
  id: string;
  notification_type: "alert" | "announcement";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  body: string;
  site_id: string | null;
  site_name: string | null;
  site_url: string | null;
  action: string | null;
  details: { breaches?: NotifBreach[] } | null;
  pinned: boolean;
  created_at: string;
}

// ── LocalStorage read tracking ────────────────────────────────────────────────

const SEEN_ANNC_KEY   = "bb_announcements_seen";
const SEEN_ALERTS_KEY = "bb_alerts_seen_at";

function getSeenAnnouncementIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_ANNC_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function markAnnouncementsSeen(ids: string[]) {
  try {
    const s = getSeenAnnouncementIds();
    ids.forEach(id => s.add(id));
    localStorage.setItem(SEEN_ANNC_KEY, JSON.stringify([...s]));
  } catch { /* ignore */ }
}

function getAlertSeenAt(): number {
  try { return parseInt(localStorage.getItem(SEEN_ALERTS_KEY) ?? "0"); }
  catch { return 0; }
}
function markAlertsSeen() {
  try { localStorage.setItem(SEEN_ALERTS_KEY, String(Date.now())); }
  catch { /* ignore */ }
}

function computeUnread(items: NotifItem[]): number {
  const seenIds     = getSeenAnnouncementIds();
  const alertSentAt = getAlertSeenAt();
  return items.filter(item => {
    if (item.notification_type === "announcement") return !seenIds.has(item.id);
    return new Date(item.created_at).getTime() > alertSentAt;
  }).length;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function tsAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_STYLE: Record<string, { dot: string; iconBg: string; iconColor: string; badge: string; label: string }> = {
  critical: { dot: "bg-red-500",   iconBg: "bg-red-50",    iconColor: "text-red-500",    badge: "bg-red-50 text-red-600 border border-red-100",    label: "Critical" },
  warning:  { dot: "bg-amber-400", iconBg: "bg-amber-50",  iconColor: "text-amber-500",  badge: "bg-amber-50 text-amber-600 border border-amber-100", label: "Warning"  },
  success:  { dot: "bg-green-500", iconBg: "bg-green-50",  iconColor: "text-green-600",  badge: "bg-green-50 text-green-700 border border-green-100", label: "Success"  },
  info:     { dot: "bg-blue-400",  iconBg: "bg-blue-50",   iconColor: "text-blue-500",   badge: "bg-blue-50 text-blue-700 border border-blue-100",   label: "Info"     },
};

function pillarIcon(pillar: string, cls: string, size = 15) {
  if (pillar === "malware" || pillar === "security") return <ShieldAlert size={size} className={cls} />;
  if (pillar === "performance") return <Zap size={size} className={cls} />;
  if (pillar === "seo")         return <Search size={size} className={cls} />;
  return <AlertTriangle size={size} className={cls} />;
}

function notifMainIcon(item: NotifItem) {
  if (item.notification_type === "announcement") return <Megaphone size={15} className="text-indigo-500" />;
  if (item.action === "audit_failed") return <AlertTriangle size={15} className="text-amber-500" />;
  const breaches = item.details?.breaches ?? [];
  const firstPillar = breaches[0]?.pillar ?? "";
  const sev = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.info;
  return pillarIcon(firstPillar, sev.iconColor);
}

function notifTitle(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.title;
  if (item.action === "audit_failed") return "Audit Failed";
  const breaches = item.details?.breaches ?? [];
  if (breaches.length === 0) return item.title;
  const pillars = breaches.map(b => b.pillar);
  if (pillars.length === 1) {
    const p = pillars[0];
    if (p === "malware") return "Malware Detected";
    if (p === "security") return "Security Issue Found";
    if (p === "performance") return "Performance Degraded";
    if (p === "seo") return "SEO Score Dropped";
    if (p === "uptime") return "Site Went Offline";
    return item.title;
  }
  return pillars.map(p => p[0].toUpperCase() + p.slice(1)).join(" & ") + " Alert";
}

function breachLabel(b: NotifBreach): string {
  const name = b.pillar.charAt(0).toUpperCase() + b.pillar.slice(1);
  if (b.score === null) return `${name}: Offline`;
  return `${name}: ${b.score}/100`;
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
  billing: "Billing",
  profile: "Profile",
};

function useBreadcrumbs(pathname: string) {
  return useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Dashboard", href: "/dashboard" }];
    const crumbs: { label: string; href: string }[] = [
      { label: "Dashboard", href: "/dashboard" },
    ];
    let href = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      href += `/${part}`;
      if (part === "dashboard" && i === 0) continue;
      const isId = /^[0-9a-f-]{8,}$/i.test(part);
      const label = isId
        ? "Details"
        : CRUMB_LABELS[part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label, href });
    }
    return crumbs;
  }, [pathname]);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TopBar() {
  const { agency, logout } = useAuth();
  const { roleCanDo } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(pathname);

  const isClientPortal = agency?.is_client_portal ?? false;
  const isIndividual   = agency?.account_type === "individual";

  const [showAddSite,    setShowAddSite]    = useState(false);
  const [showNotif,      setShowNotif]      = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<number | null>(null);
  const [, tick] = useState(0);

  const notifRef     = useRef<HTMLDivElement>(null);
  const avatarRef    = useRef<HTMLDivElement>(null);

  const displayName = agency?.member_name ?? agency?.name ?? "";
  const initials    = displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    function openAdd() {
      if (!isClientPortal && !isIndividual && roleCanDo("add_site")) setShowAddSite(true);
    }
    window.addEventListener("bb:open-add-site", openAdd);
    return () => window.removeEventListener("bb:open-add-site", openAdd);
  }, [isClientPortal, isIndividual, roleCanDo]);

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

  const loadNotifications = useCallback(async () => {
    if (!agency || isClientPortal) return;
    try {
      const { data } = await api.get("/notifications?tab=all&limit=20");
      const items: NotifItem[] = data.items ?? [];
      setNotifications(items);
      setUnreadCount(computeUnread(items));
    } catch { /* silently ignore */ }
  }, [agency, isClientPortal]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setShowNotif(false);
      if (avatarRef.current   && !avatarRef.current.contains(e.target as Node))   setShowAvatarMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function openNotif() {
    setShowNotif(v => {
      if (!v) {
        markAnnouncementsSeen(notifications.filter(n => n.notification_type === "announcement").map(n => n.id));
        markAlertsSeen();
        setUnreadCount(0);
      }
      return !v;
    });
  }

  function handleSignOut() {
    if (isClientPortal) {
      clearToken();
      router.push("/client-portal/login");
    } else {
      logout();
    }
  }

  const preview = notifications.slice(0, 3);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
        {/* Left: breadcrumbs */}
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={c.href + i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/50">›</span>}
                  {last ? (
                    <span className="truncate font-semibold text-accent">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
                      {c.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="hidden items-center gap-2 rounded-[4px] border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 md:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--score-good)]" />
            {refreshing ? "Refreshing…" : lastUpdated ? `Updated ${tsAgo(lastUpdated)}` : "No tasks running"}
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
          </button>

          {!isClientPortal && !isIndividual && roleCanDo("add_site") && (
            <Button size="sm" onClick={() => setShowAddSite(true)} className="hidden h-9 sm:inline-flex">
              <Plus size={14} strokeWidth={2.5} />
              Add Site
            </Button>
          )}

          {!isClientPortal && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotif}
                className="relative rounded-[4px] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-border bg-surface shadow-elevated-lg">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">Notifications</p>
                      {notifications.length > 0 && (
                        <span className="rounded-[4px] bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotif(false)}
                      className="rounded-[4px] p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
                    {preview.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      preview.map((item) => {
                        const sev = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.info;
                        const breaches = item.details?.breaches ?? [];
                        const dest = item.site_id ? `/sites/${item.site_id}` : "/notifications";
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              router.push(dest);
                              setShowNotif(false);
                            }}
                            className="group w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] ${sev.iconBg}`}
                              >
                                {notifMainIcon(item)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <p className="text-xs font-bold leading-snug text-foreground">
                                      {notifTitle(item)}
                                    </p>
                                    {item.pinned && (
                                      <Pin size={9} className="shrink-0 text-amber-500" />
                                    )}
                                  </div>
                                  <span className="mt-0.5 shrink-0 whitespace-nowrap text-[10px] text-muted-foreground/60">
                                    {timeAgo(item.created_at)}
                                  </span>
                                </div>
                                {item.site_name && (
                                  <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                                    {item.site_name}
                                  </p>
                                )}
                                {breaches.length > 0 ? (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {breaches.map((b, i) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold ${
                                          b.score === null || b.score < 50
                                            ? "border border-red-100 bg-red-50 text-red-600"
                                            : "border border-amber-100 bg-amber-50 text-amber-600"
                                        }`}
                                      >
                                        {pillarIcon(b.pillar, "w-2.5 h-2.5")}
                                        {breachLabel(b)}
                                      </span>
                                    ))}
                                  </div>
                                ) : item.body ? (
                                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                                    {item.body}
                                  </p>
                                ) : null}
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span
                                    className={`rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sev.badge}`}
                                  >
                                    {sev.label}
                                  </span>
                                  {item.site_id && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                      View site <ArrowRight size={10} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-border bg-muted/30 px-4 py-2.5">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotif(false)}
                      className="block text-center text-xs font-bold text-accent hover:underline"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {!!agency && (
            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowAvatarMenu((v) => !v);
                  setShowNotif(false);
                }}
                className="flex items-center gap-2.5 rounded-[4px] py-1 pl-1 pr-1.5 transition-colors hover:bg-muted"
              >
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-xs font-bold leading-tight text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{agency?.email}</p>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </div>
                <MoreVertical size={14} className="hidden text-muted-foreground sm:block" />
              </button>

              {showAvatarMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-elevated-lg">
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {agency?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    {!isClientPortal && (
                      <>
                        <Link
                          href="/settings/profile"
                          onClick={() => setShowAvatarMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          <User size={14} className="text-accent" />
                          <span className="font-semibold">Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowAvatarMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          <Settings size={14} className="text-muted-foreground" />
                          <span className="font-semibold">Settings</span>
                        </Link>
                        <div className="mx-3 my-1 border-t border-border" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAvatarMenu(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-[var(--destructive-light)]"
                    >
                      <LogOut size={14} />
                      <span className="font-semibold">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showAddSite && (
        <AddSiteModal
          onClose={() => setShowAddSite(false)}
          onSuccess={(siteId) => {
            setShowAddSite(false);
            router.push(`/sites/${siteId}`);
          }}
        />
      )}
    </>
  );
}
