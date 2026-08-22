"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import api from "@/lib/api";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  pinned: boolean;
  created_at: string;
}

const DISMISSED_KEY = "bb_banner_dismissed_ids";

const BANNER_STYLE: Record<string, { wrap: string; icon: string }> = {
  info: {
    wrap: "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500",
    icon: "text-purple-600",
  },
  warning: {
    wrap: "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500",
    icon: "text-amber-600",
  },
  success: {
    wrap: "bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500",
    icon: "text-emerald-600",
  },
  danger: {
    wrap: "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500",
    icon: "text-red-600",
  },
};

function getDismissedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function addDismissed(id: string) {
  try {
    const s = getDismissedIds();
    s.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/announcements");
        const items: Announcement[] = data.announcements ?? [];
        if (!items.length) return;

        const dismissedIds = getDismissedIds();
        const candidate =
          items.find((a) => a.pinned && !dismissedIds.has(a.id)) ??
          items.find((a) => !dismissedIds.has(a.id)) ??
          null;
        setAnnouncement(candidate);
      } catch {
        /* silent */
      }
    }
    load();
  }, []);

  if (!announcement || dismissed) return null;

  const style = BANNER_STYLE[announcement.type] ?? BANNER_STYLE.info;

  function dismiss() {
    addDismissed(announcement!.id);
    setDismissed(true);
  }

  return (
    <div className="relative w-full shrink-0 border-b border-zinc-200 bg-white" role="alert" aria-live="polite">
      <div className={style.wrap}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Sparkles className={`h-5 w-5 shrink-0 stroke-1 ${style.icon}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{announcement.title}</p>
              {announcement.body ? (
                <p className="text-xs text-zinc-600">{announcement.body}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
