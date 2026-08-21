"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

const FALLBACK_ENTRIES: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-05-20",
    highlights: [
      "In-app changelog — stay up to date without leaving the dashboard",
      "Onboarding checklist — guided steps for new agencies",
      "Demo workspace — seed realistic data for client demos",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-05-10",
    highlights: [
      "Slack webhook alerts — get notified in your workspace",
      "Weekly digest emails — one summary instead of many alerts",
      "Score trend charts — 30 / 90 / 180 / 365 day range toggle",
      "Report annotations — add internal notes to any PDF report",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-22",
    highlights: [
      "Client report portal — shareable branded link for each report",
      "Per-client branding kits — individual logo and color per client",
      "Standalone security audit PDF — one-click download from malware tab",
    ],
  },
];

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
  onSeen?: () => void;
}

export function ChangelogModal({ open, onClose, onSeen }: ChangelogModalProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get<{ entries: ChangelogEntry[]; unread: number }>("/changelog")
      .then(({ data }) => setEntries(data.entries))
      .catch(() => setEntries(FALLBACK_ENTRIES))
      .finally(() => setLoading(false));

    api.post("/changelog/seen").then(onSeen).catch(() => {});
  }, [open, onSeen]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          What&apos;s new
        </span>
      }
      size="lg"
      className="max-h-[80vh]"
    >
      <div className="max-h-[55vh] space-y-8 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={`${entry.version}-${idx}`}>
              <div className="mb-3 flex items-center gap-3">
                <Badge variant="accent">v{entry.version}</Badge>
                {idx === 0 && <Badge variant="success">Latest</Badge>}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <ul className="space-y-1.5">
                {entry.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
