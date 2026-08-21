"use client";

import { useState, useEffect } from "react";
import { Activity, TrendingUp, Search, Shield, Bug, Eye, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { truncateUrl, scoreHex } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import type { Site } from "@/types";

interface SiteCardProps {
  site: Site;
  onClick: () => void;
}

const AVATAR_COLORS = ["#1a56db", "#0ea5e9", "#16a34a", "#d97706", "#dc2626", "#475569"];

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

const pillars = [
  { key: "performance" as const, label: "Perf", Icon: TrendingUp },
  { key: "seo" as const, label: "SEO", Icon: Search },
  { key: "security" as const, label: "Sec", Icon: Shield },
  { key: "malware" as const, label: "Malware", Icon: Bug },
];

export function SiteCard({ site, onClick }: SiteCardProps) {
  const router = useRouter();
  const { agency } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hovered) setDeleteConfirm(false);
  }, [hovered]);

  async function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/sites/${site.id}`);
      await api.post("/sites/cache/clear").catch(() => {});
      window.dispatchEvent(new Event("bb:refresh"));
      toast.success("Site deleted.");
    } catch {
      toast.error("Failed to delete site.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  const isClientPortal = agency?.is_client_portal ?? false;
  const uptime = site.uptime_percentage ?? 0;
  const isOnline = site.uptime_status === "up";
  const isDown = site.uptime_status === "down";
  const siteHref = `/sites/${site.id}`;

  const alertChips: { label: string; variant: "danger" | "warning" | "success" | "muted" }[] = [];
  if (isDown) alertChips.push({ label: "Down", variant: "danger" });
  else if (isOnline) alertChips.push({ label: "Online", variant: "success" });
  else alertChips.push({ label: "Unknown", variant: "muted" });

  const scores = site.latest_scores;
  if (scores?.malware != null && scores.malware < 80)
    alertChips.push({ label: "Malware", variant: "danger" });
  if (scores?.security != null && scores.security < 50)
    alertChips.push({ label: "Security", variant: "warning" });
  if (scores?.performance != null && scores.performance < 50)
    alertChips.push({ label: "Perf", variant: "warning" });

  return (
    <div
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-accent/30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: avatarColor(site.id) }}
            >
              {site.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-snug text-foreground">
                {site.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {truncateUrl(site.url)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {alertChips.slice(0, 3).map((c) => (
              <Badge key={c.label} variant={c.variant} dot>
                {c.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-px border-y border-border bg-border">
          {pillars.map(({ key, label, Icon }) => {
            const score = site.latest_scores?.[key];
            return (
              <div
                key={key}
                className="flex flex-col items-center gap-1 bg-surface px-1 py-2.5"
              >
                <Icon size={13} className="text-muted-foreground" />
                <span
                  className="text-base font-bold tabular-nums leading-none"
                  style={{ color: score !== undefined ? scoreHex(score) : "#cbd5e1" }}
                >
                  {score !== undefined ? score : "—"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Activity size={13} className="text-[var(--score-good)]" />
            Uptime
          </div>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {uptime.toFixed(1)}%
          </span>
        </div>
      </div>

      {!isClientPortal && hovered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/90 px-5 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-surface px-3 py-2.5 text-xs font-bold uppercase tracking-[0.06em] text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <Eye size={14} />
            Quick View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(siteHref);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-hover"
          >
            Open Site
            <ArrowRight size={14} />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] transition-colors"
            style={{
              background: deleteConfirm ? "var(--destructive)" : "transparent",
              color: deleteConfirm ? "white" : "var(--destructive)",
            }}
          >
            {deleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {deleting ? "Deleting…" : deleteConfirm ? "Confirm Delete?" : "Delete"}
          </button>
        </div>
      )}

      {isClientPortal && (
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(siteHref);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2.5 text-xs font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-hover"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}
