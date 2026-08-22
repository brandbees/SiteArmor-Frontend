"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  AlertTriangle,
  Megaphone,
  Pin,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Zap,
  Search,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { McAlert, McIconBox, McPill } from "@/components/shared/MalCareUI";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "all" | "alerts" | "announcements";
type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

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

const LIMIT = 25;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alerts", label: "Site Alerts" },
  { key: "announcements", label: "Announcements" },
];

const SEV_TONE: Record<NotifItem["severity"], Tone> = {
  critical: "bad",
  warning: "warn",
  success: "good",
  info: "accent",
};

const ROW_GRID =
  "md:grid-cols-[36px_minmax(0,1fr)_minmax(100px,160px)_92px_20px]";

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function pillarIcon(pillar: string, size = 14) {
  if (pillar === "malware" || pillar === "security")
    return <ShieldAlert size={size} strokeWidth={2.25} />;
  if (pillar === "performance") return <Zap size={size} strokeWidth={2.25} />;
  if (pillar === "seo") return <Search size={size} strokeWidth={2.25} />;
  if (pillar === "uptime") return <WifiOff size={size} strokeWidth={2.25} />;
  return <AlertTriangle size={size} strokeWidth={2.25} />;
}

function rowIcon(item: NotifItem) {
  if (item.notification_type === "announcement")
    return <Megaphone size={14} strokeWidth={2.25} />;
  if (item.action === "audit_failed")
    return <AlertTriangle size={14} strokeWidth={2.25} />;
  const firstPillar = item.details?.breaches?.[0]?.pillar ?? "";
  if (firstPillar) return pillarIcon(firstPillar, 14);
  return <Bell size={14} strokeWidth={2.25} />;
}

function notifTitle(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.title;
  if (item.action === "audit_failed") return "Audit failed";
  const breaches = item.details?.breaches ?? [];
  if (breaches.length === 0) return item.title;
  const pillars = breaches.map((b) => b.pillar);
  if (pillars.length === 1) {
    const p = pillars[0];
    if (p === "malware") return "Malware detected";
    if (p === "security") return "Security issue";
    if (p === "performance") return "Performance degraded";
    if (p === "seo") return "SEO score dropped";
    if (p === "uptime") return "Site offline";
    return item.title;
  }
  return `${pillars.length} pillar alerts`;
}

function rawDescription(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.body;
  if (item.action === "audit_failed") return item.body;
  const breaches = item.details?.breaches ?? [];
  if (breaches.length === 0) return item.body;
  return breaches
    .map((b) => {
      const name = b.pillar.charAt(0).toUpperCase() + b.pillar.slice(1);
      if (b.score === null) return `${name}: site appears offline`;
      return `${name} score ${b.score}/100`;
    })
    .join(" · ");
}

/** Turn raw backend / scanner errors into readable copy */
function formatNotifBody(raw: string): string {
  const body = raw.trim();
  if (!body) return "No additional details.";

  if (
    /is not a function/i.test(body) ||
    /TypeError|ReferenceError|SyntaxError/i.test(body)
  ) {
    return "Scanner encountered an internal error. Reconnect the plugin and run a manual scan from the site page.";
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network error/i.test(body)) {
    return "Could not reach the site. Check that the plugin is connected and the site is online.";
  }
  if (/Scanner failed after/i.test(body)) {
    if (/fetch failed/i.test(body)) {
      return "Scanner could not reach the site after multiple attempts.";
    }
    return "Automated scan failed. Try running a manual scan from the site dashboard.";
  }
  return body;
}

function siteLabel(item: NotifItem): string | null {
  if (item.site_name) return item.site_name;
  if (item.site_url) return item.site_url.replace(/^https?:\/\//, "");
  return null;
}

function stripeClass(tone: Tone) {
  const map: Record<Tone, string> = {
    bad: "bg-[var(--score-bad)]",
    warn: "bg-[var(--score-warn)]",
    good: "bg-[var(--score-good)]",
    accent: "bg-accent",
    neutral: "bg-muted-foreground",
  };
  return map[tone];
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-portal-display text-xl font-bold tabular-nums leading-none",
          tone === "warn" && "text-[var(--score-warn)]",
          tone === "accent" && "text-accent",
          tone === "bad" && "text-[var(--score-bad)]",
          !tone && "text-foreground"
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotifItem;
  onNavigate: (path: string) => void;
}) {
  const tone = SEV_TONE[item.severity] ?? "neutral";
  const dest = item.site_id ? `/sites/${item.site_id}` : null;
  const site = siteLabel(item);
  const title = notifTitle(item);
  const message = formatNotifBody(rawDescription(item));
  const isAnnouncement = item.notification_type === "announcement";

  return (
    <div
      role={dest ? "button" : undefined}
      tabIndex={dest ? 0 : undefined}
      onClick={dest ? () => onNavigate(dest) : undefined}
      onKeyDown={
        dest
          ? (e) => {
              if (e.key === "Enter") onNavigate(dest);
            }
          : undefined
      }
      className={cn(
        "group relative grid min-w-0 grid-cols-1 gap-1 border-b border-border px-4 py-3 transition-colors last:border-b-0",
        ROW_GRID,
        "md:items-center md:gap-3 md:py-2.5",
        dest ? "cursor-pointer hover:bg-[#f7f9fc]" : "hover:bg-[#fafbfc]"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] md:hidden",
          stripeClass(tone)
        )}
      />

      <McIconBox icon={rowIcon(item)} tone={tone} size="sm" className="hidden md:flex" />

      <div className="flex min-w-0 items-start gap-2.5 md:contents">
        <McIconBox icon={rowIcon(item)} tone={tone} size="sm" className="md:hidden" />
        <div className="min-w-0 flex-1 md:col-start-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[13px] font-bold text-foreground">{title}</p>
            {item.pinned && (
              <Pin size={10} className="shrink-0 text-[var(--score-warn)]" />
            )}
            {isAnnouncement && (
              <McPill tone="accent" className="hidden shrink-0 sm:inline-flex">
                Announcement
              </McPill>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground md:line-clamp-1">
            {message}
          </p>
          {site && (
            <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground/80 md:hidden">
              {site}
            </p>
          )}
        </div>
      </div>

      <p className="hidden min-w-0 truncate text-xs font-medium text-muted-foreground md:block">
        {site ?? "—"}
      </p>

      <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground md:text-right">
        {timeAgo(item.created_at)}
      </time>

      <ChevronRight
        size={14}
        strokeWidth={2.25}
        className={cn(
          "hidden shrink-0 text-muted-foreground/40 transition-colors md:block",
          dest && "group-hover:text-accent"
        )}
      />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    all: 0,
    alerts: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        TABS.map(async ({ key }) => {
          const { data } = await api.get(
            `/notifications?tab=${key}&page=1&limit=1`
          );
          return [key, data.total ?? 0] as const;
        })
      );
      setCounts(Object.fromEntries(results) as Record<Tab, number>);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(
        `/notifications?tab=${tab}&page=${page}&limit=${LIMIT}`
      );
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setCounts((prev) => ({ ...prev, [tab]: data.total ?? prev[tab] }));
    } catch {
      setError("Could not load notifications. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    load();
  }, [load]);

  function switchTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  return (
    <div className="flex min-w-0 w-full flex-col overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <McIconBox icon={<Bell size={16} strokeWidth={2.25} />} tone="accent" />
            <div className="min-w-0">
              <h1 className="font-portal-display text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
                Notifications
              </h1>
              <p className="text-xs text-muted-foreground">
                Site alerts and platform announcements
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => load()}
            disabled={loading}
            className="normal-case tracking-normal"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-white">
        <StatCell label="Site alerts" value={counts.alerts} tone="warn" />
        <StatCell label="Announcements" value={counts.announcements} tone="accent" />
        <StatCell label="Total" value={counts.all} />
      </div>

      {/* Tabs — 3 items, no horizontal scroll needed */}
      <div className="flex border-b border-border bg-white px-2 sm:px-4">
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-[13px] font-semibold transition-colors sm:px-4",
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active
                    ? "bg-accent/10 text-accent"
                    : "bg-[#eef1f6] text-muted-foreground"
                )}
              >
                {count}
              </span>
              {active && (
                <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-t-full bg-accent sm:inset-x-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* List panel — full width, no side padding wrapper */}
      <div className="min-w-0 overflow-x-hidden bg-white">
        {error && (
          <div className="border-b border-border p-4">
            <McAlert variant="error" title="Failed to load">
              {error}
            </McAlert>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 && !error ? (
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
          <>
            <div
              className={cn(
                "hidden min-w-0 border-b border-border bg-[#f7f9fc] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground md:grid md:gap-3",
                ROW_GRID
              )}
            >
              <span />
              <span>Notification</span>
              <span>Site</span>
              <span className="text-right">When</span>
              <span />
            </div>

            <div className="min-w-0 divide-y-0">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onNavigate={(path) => router.push(path)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[#f7f9fc] px-4 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{from}–{to}</span> of{" "}
              <span className="font-bold text-foreground">{total.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="normal-case tracking-normal"
              >
                <ChevronLeft size={14} />
                Prev
              </Button>
              <span className="min-w-[4rem] text-center text-xs font-bold tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="normal-case tracking-normal"
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
