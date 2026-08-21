"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, AlertTriangle, Megaphone,
  Pin, ChevronLeft, ChevronRight, Globe,
  ShieldAlert, Zap, Search, ArrowRight, WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { PortalTabs } from "@/components/shared/PortalPrimitives";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";

type Tab = "all" | "alerts" | "announcements";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SEV: Record<string, { iconBg: string; iconColor: string; badge: string; label: string }> = {
  critical: { iconBg: "bg-red-50",   iconColor: "text-red-500",   badge: "bg-red-50 text-red-600 border border-red-100",     label: "Critical" },
  warning:  { iconBg: "bg-amber-50", iconColor: "text-amber-500", badge: "bg-amber-50 text-amber-600 border border-amber-100", label: "Warning"  },
  success:  { iconBg: "bg-green-50", iconColor: "text-green-600", badge: "bg-green-50 text-green-700 border border-green-100", label: "Healthy"  },
  info:     { iconBg: "bg-blue-50",  iconColor: "text-blue-500",  badge: "bg-blue-50 text-blue-700 border border-blue-100",   label: "Info"     },
};

function pillarIcon(pillar: string, cls: string, size = 16) {
  if (pillar === "malware" || pillar === "security") return <ShieldAlert size={size} className={cls} />;
  if (pillar === "performance") return <Zap size={size} className={cls} />;
  if (pillar === "seo")         return <Search size={size} className={cls} />;
  if (pillar === "uptime")      return <WifiOff size={size} className={cls} />;
  return <AlertTriangle size={size} className={cls} />;
}

function mainIcon(item: NotifItem, cls: string) {
  if (item.notification_type === "announcement") return <Megaphone size={16} className={`text-[var(--accent)] ${cls}`} />;
  if (item.action === "audit_failed")            return <AlertTriangle size={16} className={`text-amber-500 ${cls}`} />;
  const breaches = item.details?.breaches ?? [];
  const firstPillar = breaches[0]?.pillar ?? "";
  const sev = SEV[item.severity] ?? SEV.info;
  return pillarIcon(firstPillar, `${sev.iconColor} ${cls}`);
}

function notifTitle(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.title;
  if (item.action === "audit_failed") return "Audit Failed";
  const breaches = item.details?.breaches ?? [];
  if (breaches.length === 0) return item.title;
  const pillars = breaches.map(b => b.pillar);
  if (pillars.length === 1) {
    const p = pillars[0];
    if (p === "malware")     return "Malware Detected";
    if (p === "security")    return "Security Issue Found";
    if (p === "performance") return "Performance Degraded";
    if (p === "seo")         return "SEO Score Dropped";
    if (p === "uptime")      return "Site Went Offline";
    return item.title;
  }
  return pillars.map(p => p[0].toUpperCase() + p.slice(1)).join(" & ") + " Alert";
}

function notifDescription(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.body;
  if (item.action === "audit_failed") {
    return item.body || "The scheduled audit could not be completed. Check the site connection.";
  }
  const breaches = item.details?.breaches ?? [];
  if (breaches.length === 0) return item.body;
  return breaches.map(b => {
    const name = b.pillar.charAt(0).toUpperCase() + b.pillar.slice(1);
    if (b.score === null) return `${name} monitoring detected the site is offline.`;
    if (b.pillar === "malware")     return `Malware scan scored ${b.score}/100 — threats detected on this site.`;
    if (b.pillar === "security")    return `Security score dropped to ${b.score}/100 — review firewall and hardening settings.`;
    if (b.pillar === "performance") return `Performance score is ${b.score}/100 — page speed issues detected.`;
    if (b.pillar === "seo")         return `SEO score dropped to ${b.score}/100 — check metadata and crawlability.`;
    if (b.pillar === "uptime")      return `Uptime score is ${b.score}/100 — site may be intermittently down.`;
    return `${name} score: ${b.score}/100`;
  }).join(" ");
}

function breachChipClass(b: NotifBreach): string {
  const bad = b.score === null || b.score < 50;
  return bad
    ? "bg-red-50 text-red-600 border border-red-100"
    : "bg-amber-50 text-amber-600 border border-amber-100";
}

function breachLabel(b: NotifBreach): string {
  const name = b.pillar.charAt(0).toUpperCase() + b.pillar.slice(1);
  if (b.score === null) return `${name}: Offline`;
  return `${name}: ${b.score}/100`;
}

const LIMIT = 20;

const TABS: { key: Tab; label: string }[] = [
  { key: "all",           label: "All"           },
  { key: "alerts",        label: "Site Alerts"   },
  { key: "announcements", label: "Announcements" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [tab,     setTab]     = useState<Tab>("all");
  const [page,    setPage]    = useState(1);
  const [items,   setItems]   = useState<NotifItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notifications?tab=${tab}&page=${page}&limit=${LIMIT}`);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  function switchTab(t: Tab) { setTab(t); setPage(1); }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = (page - 1) * LIMIT + 1;
  const to   = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Site alerts and platform announcements."
        icon={<Bell size={22} />}
        action={
          total > 0 ? (
            <Badge variant="muted">{total} total</Badge>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="px-2 pt-1">
          <PortalTabs tabs={TABS} value={tab} onChange={switchTab} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell size={20} />}
            title="No notifications"
            description={
              tab === "alerts"
                ? "Site alerts appear here when thresholds are breached."
                : tab === "announcements"
                  ? "Platform announcements will appear here."
                  : "Alerts and announcements will appear here."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const sev = SEV[item.severity] ?? SEV.info;
              const breaches = item.details?.breaches ?? [];
              const dest = item.site_id ? `/sites/${item.site_id}` : null;
              const isAlert = item.notification_type === "alert";

              return (
                <div
                  key={item.id}
                  role={dest ? "button" : undefined}
                  tabIndex={dest ? 0 : undefined}
                  onClick={dest ? () => router.push(dest) : undefined}
                  onKeyDown={
                    dest
                      ? (e) => {
                          if (e.key === "Enter") router.push(dest);
                        }
                      : undefined
                  }
                  className={`group flex items-start gap-3 px-4 py-3.5 transition-colors ${
                    dest ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] ${sev.iconBg}`}
                  >
                    {mainIcon(item, "")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{notifTitle(item)}</p>
                      {item.pinned && <Pin size={10} className="shrink-0 text-amber-500" />}
                      <Badge variant={isAlert ? "danger" : "accent"}>
                        {isAlert ? "Alert" : "Announcement"}
                      </Badge>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.badge}`}
                      >
                        {sev.label}
                      </span>
                    </div>

                    {(item.site_name || item.site_url) && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Globe size={11} className="shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-medium text-muted-foreground">
                          {item.site_name ?? ""}
                          {item.site_url && (
                            <span className="font-normal text-muted-foreground/60">
                              {item.site_name ? " · " : ""}
                              {item.site_url.replace(/^https?:\/\//, "")}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {notifDescription(item)}
                    </p>

                    {isAlert && breaches.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {breaches.map((b, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${breachChipClass(b)}`}
                          >
                            {pillarIcon(b.pillar, "", 11)}
                            {breachLabel(b)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-2 flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {timeAgo(item.created_at)}
                    </span>
                    {dest && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        View <ArrowRight size={11} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-[4px] border border-border bg-surface p-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-foreground">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-[4px] border border-border bg-surface p-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
