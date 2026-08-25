"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, X } from "lucide-react";
import { cn, scoreHex, truncateUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { SiteScreenshot } from "@/components/sites/SiteScreenshot";
import type { Site } from "@/types";

interface Props {
  site: Site;
  onClose: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number | null | undefined }) {
  const n = score ?? 0;
  const hex = score != null ? scoreHex(score) : "#a1a1aa";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: hex }}>
          {score != null ? score : "—"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${n}%`, background: hex }}
        />
      </div>
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
  const isHacked = site.malware_status === "threat";
  const siteUrl = site.url.startsWith("http") ? site.url : `https://${site.url}`;

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-40 bg-zinc-950/30"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 z-50 flex h-full w-[420px] max-w-[100vw] flex-col overflow-hidden border-l border-zinc-200 bg-[#f4f4f5] shadow-lg animate-slide-in-right">
        <div className="relative h-44 shrink-0 overflow-hidden bg-zinc-200">
          <SiteScreenshot
            url={site.url}
            connected={site.plugin_connected}
            hacked={isHacked}
            width={840}
            className="h-full w-full"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-xs hover:bg-white hover:text-zinc-900"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-950">{site.name}</p>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 truncate text-xs font-medium text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {truncateUrl(site.url, 40)}
              <ExternalLink size={11} className="shrink-0" />
            </a>
          </div>
          {overallScore != null && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium text-zinc-400">Health</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: scoreHex(overallScore) }}>
                {overallScore}
                <span className="text-xs font-medium text-zinc-400">/100</span>
              </p>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 scrollbar-none">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">Status</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isOnline ? "bg-emerald-500" : site.uptime_status === "down" ? "bg-red-500" : "bg-zinc-300"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isOnline
                      ? "text-emerald-700"
                      : site.uptime_status === "down"
                        ? "text-red-600"
                        : "text-zinc-500"
                  )}
                >
                  {isOnline ? "Online" : site.uptime_status === "down" ? "Down" : "Unknown"}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">Uptime</p>
              <p className="text-sm font-semibold tabular-nums text-zinc-900">
                {uptime.toFixed(1)}%
                <span className="ml-1 text-[11px] font-normal text-zinc-400">30d</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-900">Audit scores</p>
            {scores ? (
              <div className="flex flex-col gap-3">
                <ScoreBar label="Performance" score={scores.performance} />
                <ScoreBar label="SEO" score={scores.seo} />
                <ScoreBar label="Security" score={scores.security} />
                <ScoreBar label="Malware" score={scores.malware} />
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Run an audit to see pillar scores.</p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-900"
            >
              Site details
              <ChevronDown
                size={16}
                className={cn("text-zinc-400 transition-transform", detailsOpen && "rotate-180")}
              />
            </button>
            {detailsOpen && (
              <div className="space-y-2.5 border-t border-zinc-100 px-4 pb-4 pt-3">
                <DetailRow label="Plugin" value={site.plugin_connected ? "Connected" : "Not connected"} />
                {site.plugin_data?.wp_version && (
                  <DetailRow label="WP version" value={site.plugin_data.wp_version} />
                )}
                {site.plugin_data?.php_version && (
                  <DetailRow label="PHP version" value={site.plugin_data.php_version} />
                )}
                {site.scan_schedule && <DetailRow label="Scan schedule" value={site.scan_schedule} />}
                {site.last_audit_at && (
                  <DetailRow
                    label="Last audit"
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

        <div className="flex shrink-0 gap-2 border-t border-zinc-200 bg-white px-4 py-3">
          {isClientPortal ? (
            <Link href={`/sites/${site.id}`} className="flex-1">
              <Button className="w-full" size="sm">
                View site
              </Button>
            </Link>
          ) : (
            <>
              <Link href={`/sites/${site.id}`} className="flex-1">
                <Button className="w-full" size="sm">
                  Open site
                </Button>
              </Link>
              <Link href={`/reports/${site.id}`} className="flex-1">
                <Button variant="secondary" className="w-full" size="sm">
                  View reports
                </Button>
              </Link>
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
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-xs font-medium capitalize text-zinc-800">{value}</span>
    </div>
  );
}
