"use client";

import { X, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";
import { scoreHex } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import type { Site } from "@/types";

interface Props {
  site: Site;
  onClose: () => void;
}

const AVATAR_COLORS = ["#1f5fb8", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

function ScoreChip({ score, label }: { score: number; label: string }) {
  const hex = scoreHex(score);
  const bgMap: Record<string, string> = {
    "#16a34a": "#f0fdf4",
    "#d97706": "#fffbeb",
    "#dc2626": "#fef2f2",
  };
  return (
    <div
      className="flex flex-col items-center rounded-[4px] border px-2 py-2"
      style={{ background: bgMap[hex] ?? "#f9fafb", borderColor: hex + "33" }}
    >
      <span className="text-base font-bold tabular-nums" style={{ color: hex }}>
        {score}
      </span>
      <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function SiteQuickViewDrawer({ site, onClose }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { agency } = useAuth();
  const isClientPortal = agency?.is_client_portal ?? false;
  const uptime = site.uptime_percentage ?? 0;
  const isOnline = site.uptime_status === "up";
  const scores = site.latest_scores;
  const overallScore = scores
    ? Math.round((scores.performance + scores.seo + scores.security + scores.malware) / 4)
    : null;

  const cleanUrl = site.url.replace(/^https?:\/\//, "");

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-40 bg-[#0f172a]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 z-50 flex h-full w-[420px] max-w-[100vw] flex-col overflow-hidden border-l border-border bg-white shadow-[0_24px_64px_-16px_rgb(15_23_42/0.28)] animate-slide-in-right">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-base font-bold text-white"
            style={{ background: avatarColor(site.id) }}
          >
            {site.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{site.name}</p>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {cleanUrl}
              <ExternalLink size={10} className="shrink-0" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[4px] p-1.5 text-muted-foreground transition-colors hover:bg-[#f0f2f5] hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f0f2f5] px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[4px] border border-border bg-white p-3.5">
              <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Status</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${isOnline ? "bg-[var(--score-good)]" : "bg-[var(--score-bad)]"}`}
                />
                <span
                  className={`text-sm font-bold ${
                    isOnline ? "text-[var(--score-good)]" : "text-[var(--score-bad)]"
                  }`}
                >
                  {isOnline ? "Online" : site.uptime_status === "down" ? "Down" : "Unknown"}
                </span>
              </div>
            </div>
            <div className="rounded-[4px] border border-border bg-white p-3.5">
              <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Health</p>
              {overallScore !== null ? (
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-xl font-bold" style={{ color: scoreHex(overallScore) }}>
                    {overallScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">No data</p>
              )}
            </div>
          </div>

          {scores && (
            <div className="rounded-[4px] border border-border bg-white p-3.5">
              <p className="mb-2.5 text-[13px] font-bold text-foreground">Audit Scores</p>
              <div className="grid grid-cols-4 gap-2">
                <ScoreChip score={scores.performance} label="Perf" />
                <ScoreChip score={scores.seo} label="SEO" />
                <ScoreChip score={scores.security} label="Sec" />
                <ScoreChip score={scores.malware} label="Malware" />
              </div>
            </div>
          )}

          <div className="rounded-[4px] border border-border bg-white p-3.5">
            <p className="mb-1 text-[13px] font-bold text-foreground">Uptime</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{uptime.toFixed(1)}%</p>
                <p className="mt-0.5 text-xs text-muted-foreground">30-day window</p>
              </div>
              <SiteScoreWheel score={Math.round(uptime)} caption="" size={72} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[4px] border border-border bg-white">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3.5 py-3 text-[13px] font-bold text-foreground transition-colors hover:bg-[#f0f2f5]"
            >
              Site Details
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {detailsOpen && (
              <div className="space-y-2 border-t border-border px-3.5 pb-3.5 pt-3">
                <DetailRow label="Plugin" value={site.plugin_connected ? "Connected" : "Not connected"} />
                {site.plugin_data?.wp_version && (
                  <DetailRow label="WP Version" value={site.plugin_data.wp_version} />
                )}
                {site.plugin_data?.php_version && (
                  <DetailRow label="PHP Version" value={site.plugin_data.php_version} />
                )}
                {site.scan_schedule && (
                  <DetailRow label="Scan Schedule" value={site.scan_schedule} />
                )}
                {site.last_audit_at && (
                  <DetailRow
                    label="Last Audit"
                    value={new Date(site.last_audit_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-white px-4 py-3">
          {isClientPortal ? (
            <Button
              className="flex-1"
              size="sm"
              onClick={() => {
                window.location.href = `/sites/${site.id}`;
              }}
            >
              View Site Details
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                size="sm"
                onClick={() => {
                  window.location.href = `/sites/${site.id}`;
                }}
              >
                Run Audit Now
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.href = `/reports/${site.id}`;
                }}
              >
                View Reports
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold capitalize text-foreground">{value}</span>
    </div>
  );
}
