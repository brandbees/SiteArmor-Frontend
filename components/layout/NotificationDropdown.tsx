"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CheckCheck,
  Download,
  Megaphone,
  Search,
  ShieldAlert,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export interface NotifItem {
  id: string;
  notification_type: "alert" | "announcement";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  body: string;
  site_id: string | null;
  site_name: string | null;
  site_url: string | null;
  action: string | null;
  details: { breaches?: { pillar: string; score: number | null; priority?: string }[]; error?: string } | null;
  pinned: boolean;
  created_at: string;
}

const SEEN_ANNC_KEY = "bb_announcements_seen";
const SEEN_ALERTS_KEY = "bb_alerts_seen_at";

function getSeenAnnouncementIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_ANNC_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markAnnouncementsSeen(ids: string[]) {
  try {
    const s = getSeenAnnouncementIds();
    ids.forEach((id) => s.add(id));
    localStorage.setItem(SEEN_ANNC_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

function getAlertSeenAt(): number {
  try {
    return parseInt(localStorage.getItem(SEEN_ALERTS_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

function markAlertsSeen() {
  try {
    localStorage.setItem(SEEN_ALERTS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function computeUnread(items: NotifItem[]): number {
  const seenIds = getSeenAnnouncementIds();
  const alertSeenAt = getAlertSeenAt();
  return items.filter((item) => {
    if (item.notification_type === "announcement") return !seenIds.has(item.id);
    return new Date(item.created_at).getTime() > alertSeenAt;
  }).length;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEV: Record<string, { label: string; badge: string; iconBg: string }> = {
  critical: { label: "Critical", badge: "bg-red-50 text-red-600", iconBg: "bg-red-50 text-red-500" },
  warning: { label: "Warning", badge: "bg-amber-50 text-amber-600", iconBg: "bg-amber-50 text-amber-500" },
  success: { label: "Success", badge: "bg-emerald-50 text-emerald-700", iconBg: "bg-emerald-50 text-emerald-600" },
  info: { label: "Info", badge: "bg-blue-50 text-blue-700", iconBg: "bg-blue-50 text-blue-500" },
};

function RowIcon({ item }: { item: NotifItem }) {
  const cls = "h-[18px] w-[18px]";
  if (item.notification_type === "announcement") return <Megaphone className={cls} />;
  if (item.severity === "success") return <Download className={cls} />;
  if (item.action === "audit_failed") return <BellOff className={cls} />;
  const pillar = item.details?.breaches?.[0]?.pillar;
  if (pillar === "malware" || pillar === "security") return <ShieldAlert className={cls} />;
  if (pillar === "performance") return <Zap className={cls} />;
  if (pillar === "seo") return <Search className={cls} />;
  return <AlertTriangle className={cls} />;
}

function rowTitle(item: NotifItem): string {
  if (item.notification_type === "announcement") return item.title;
  if (item.action === "audit_failed") return "Audit Failed";
  return item.title;
}

function fixHref(item: NotifItem): string | null {
  if (item.site_id) return `/sites/${item.site_id}`;
  if (item.action === "audit_failed") return "/notifications";
  return "/notifications";
}

const headerIconBtnSm =
  "inline-flex aspect-square shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white p-2 shadow-xs transition-colors hover:bg-zinc-100 active:bg-neutral-200 [&_svg]:size-4 [&_svg]:stroke-1.5 [&_svg]:text-zinc-950";

export function NotificationDropdown() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: NotifItem[] }>("/notifications?tab=all&limit=12");
      const list = data.items ?? [];
      setItems(list);
      setUnread(computeUnread(list));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function markAllRead() {
    markAnnouncementsSeen(items.filter((n) => n.notification_type === "announcement").map((n) => n.id));
    markAlertsSeen();
    setUnread(0);
  }

  function go(item: NotifItem) {
    const dest = fixHref(item);
    if (dest) router.push(dest);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            if (!v) markAllRead();
            return !v;
          });
        }}
        className={cn(
          headerIconBtnSm,
          "relative h-8 w-8",
          unread > 0 && "border-emerald-600/30 ring-2 ring-emerald-500/20"
        )}
      >
        <Bell size={16} strokeWidth={1.25} className={unread > 0 ? "text-emerald-800" : "text-emerald-900"} />
        <span className="sr-only">View notifications</span>
      </button>
      {unread > 0 && (
        <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex aspect-square h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-0.5 text-center text-[8px] font-bold leading-none text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,420px)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_40px_-8px_rgb(15_23_42/0.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Bell size={15} className="shrink-0 text-zinc-500" />
              <p className="text-sm font-bold text-zinc-900">Notifications</p>
              {unread > 0 && (
                <span className="text-xs font-medium text-zinc-400">{unread} unread</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-700/30 px-2 py-1 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                >
                  <CheckCheck size={12} />
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[min(70vh,480px)] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={28} className="mx-auto mb-2 text-zinc-300" />
                <p className="text-sm text-zinc-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {items.slice(0, 8).map((item) => {
                  const sev = SEV[item.severity] ?? SEV.info;
                  const dest = fixHref(item);
                  return (
                    <div key={item.id} className="px-4 py-3.5 transition-colors hover:bg-zinc-50/80">
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            sev.iconBg
                          )}
                        >
                          <RowIcon item={item} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-snug text-zinc-900">{rowTitle(item)}</p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                sev.badge
                              )}
                            >
                              {sev.label}
                            </span>
                          </div>
                          {item.body && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.body}</p>
                          )}
                          {item.site_name && (
                            <p className="mt-1 truncate text-[11px] font-medium text-zinc-400">{item.site_name}</p>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-400">{timeAgo(item.created_at)}</span>
                            {dest && (
                              <button
                                type="button"
                                onClick={() => go(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-700/25 px-2 py-1 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                              >
                                <Wrench size={11} />
                                {item.site_id ? "Fix now" : "View"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              View all notifications
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
