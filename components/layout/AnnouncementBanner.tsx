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

  function dismiss() {
    addDismissed(announcement!.id);
    setDismissed(true);
  }

  return (
    <div
      className="relative w-full shrink-0"
      style={{ background: "#fbf3fa" }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
          <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#7c3aed] sm:mt-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-[#5b21b6]">{announcement.title}</p>
            {announcement.body ? (
              <p className="mt-0.5 text-xs leading-snug text-[#7c3aed]/80">{announcement.body}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#7c3aed]/60 transition-colors hover:bg-[#7c3aed]/10 hover:text-[#5b21b6]"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
