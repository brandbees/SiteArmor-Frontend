"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Activity, Search, RotateCcw, ExternalLink, WifiOff } from "lucide-react";
import { useSites } from "@/hooks/useSites";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  FilterRail,
  QuickPills,
  InsightTableShell,
  McPill,
} from "@/components/shared/MalCareUI";
import { Button } from "@/components/ui/Button";
import { cn, truncateUrl } from "@/lib/utils";
import type { Site } from "@/types";

type FilterTab = "all" | "down" | "up" | "unknown";

const QUICK_PILLS = [
  { value: "down", label: "Down" },
  { value: "up", label: "Online" },
  { value: "unknown", label: "Unknown" },
];

function responseTone(ms: number | undefined | null): "good" | "warn" | "bad" | "neutral" {
  if (ms == null) return "neutral";
  if (ms < 300) return "good";
  if (ms < 700) return "warn";
  return "bad";
}

function uptimeTone(pct: number | undefined | null): "good" | "warn" | "bad" | "neutral" {
  if (pct == null) return "neutral";
  if (pct >= 99.5) return "good";
  if (pct >= 98) return "warn";
  return "bad";
}

function statusTone(status: Site["uptime_status"]): "good" | "bad" | "neutral" {
  if (status === "up") return "good";
  if (status === "down") return "bad";
  return "neutral";
}

function statusLabel(status: Site["uptime_status"]) {
  if (status === "up") return "Online";
  if (status === "down") return "Down";
  return "Unknown";
}

function MetricTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "bad" | "good" | "warn" | "neutral";
}) {
  const color =
    tone === "bad"
      ? "var(--score-bad)"
      : tone === "good"
        ? "var(--score-good)"
        : tone === "warn"
          ? "var(--score-warn)"
          : "var(--foreground)";
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-portal-display text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs font-medium text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export default function UptimePage() {
  const { sites, loading, error } = useSites();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const upSites = useMemo(() => sites.filter((s) => s.uptime_status === "up"), [sites]);
  const downSites = useMemo(() => sites.filter((s) => s.uptime_status === "down"), [sites]);
  const unknownSites = useMemo(
    () => sites.filter((s) => s.uptime_status === "unknown" || !s.uptime_status),
    [sites]
  );

  const withUptime = useMemo(() => sites.filter((s) => s.uptime_percentage != null), [sites]);
  const withResponse = useMemo(() => sites.filter((s) => s.avg_response_ms != null), [sites]);

  const avgUptime = useMemo(() => {
    if (!withUptime.length) return null;
    return withUptime.reduce((sum, s) => sum + (s.uptime_percentage ?? 0), 0) / withUptime.length;
  }, [withUptime]);

  const avgResponse = useMemo(() => {
    if (!withResponse.length) return null;
    return Math.round(withResponse.reduce((sum, s) => sum + (s.avg_response_ms ?? 0), 0) / withResponse.length);
  }, [withResponse]);

  const filtered = useMemo(() => {
    let base: Site[] =
      filter === "up"
        ? upSites
        : filter === "down"
          ? downSites
          : filter === "unknown"
            ? unknownSites
            : sites;

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
    }

    return [...base].sort((a, b) => {
      const rank = (s: Site) => (s.uptime_status === "down" ? 0 : s.uptime_status === "up" ? 1 : 2);
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (a.uptime_percentage ?? -1) - (b.uptime_percentage ?? -1);
    });
  }, [sites, upSites, downSites, unknownSites, filter, search]);

  function resetFilters() {
    setFilter("all");
    setSearch("");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }
  if (sites.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={22} />}
        title="No sites yet"
        description="Add your first site to start monitoring uptime."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Uptime"
        description={`Availability and response time across all ${sites.length} site${sites.length !== 1 ? "s" : ""}.`}
        icon={<Activity size={22} />}
        action={
          <div className="relative min-w-[200px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-[4px] border border-border bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Avg uptime %"
          value={avgUptime != null ? `${avgUptime.toFixed(2)}%` : "—"}
          sub={withUptime.length > 0 ? `${withUptime.length} monitored` : "No data"}
          tone={uptimeTone(avgUptime)}
        />
        <MetricTile
          label="Sites down"
          value={downSites.length}
          sub={downSites.length > 0 ? "Immediate action" : "All clear"}
          tone={downSites.length > 0 ? "bad" : "good"}
        />
        <MetricTile
          label="Avg response"
          value={avgResponse != null ? `${avgResponse}ms` : "—"}
          tone={responseTone(avgResponse)}
        />
        <MetricTile label="Online" value={upSites.length} sub={`of ${sites.length} sites`} tone="good" />
      </div>

      {downSites.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] px-4 py-3">
          <WifiOff size={14} className="text-[var(--score-bad)]" />
          <p className="text-sm font-semibold text-[var(--score-bad)]">
            {downSites.length} site{downSites.length !== 1 ? "s" : ""} currently down
          </p>
          <div className="flex flex-wrap gap-1.5">
            {downSites.map((s) => (
              <Link
                key={s.id}
                href={`/sites/${s.id}?tab=uptime`}
                className="rounded-md border border-[var(--score-bad-border)] bg-surface px-2 py-0.5 text-xs font-semibold text-[var(--score-bad)] hover:bg-muted"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterRail
          footer={
            <>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <Button size="sm" className="flex-1" onClick={() => {}}>
                Apply
              </Button>
            </>
          }
        >
          <QuickPills items={QUICK_PILLS} value={filter} onChange={(v) => setFilter(v as FilterTab)} />
        </FilterRail>

        <InsightTableShell footer={`${filtered.length} of ${sites.length} sites`}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search size={20} />}
              title="No sites match"
              description="Try resetting filters or clearing your search."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3">Site</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Uptime %</th>
                  <th className="px-3 py-3">Response ms</th>
                  <th className="px-3 py-3">Last check</th>
                  <th className="px-3 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => {
                  const isDown = site.uptime_status === "down";
                  const uptime = site.uptime_percentage;
                  const resp = site.avg_response_ms;
                  return (
                    <tr
                      key={site.id}
                      className={cn(
                        "border-b border-border last:border-0 hover:bg-muted/40",
                        isDown && "bg-[var(--score-bad-bg)]/40"
                      )}
                    >
                      <td className="px-3 py-3.5">
                        <Link href={`/sites/${site.id}?tab=uptime`} className="block min-w-0 text-left">
                          <p className="truncate text-sm font-bold text-foreground hover:text-accent">{site.name}</p>
                          <p className="truncate text-xs font-medium text-accent/80">{truncateUrl(site.url)}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <McPill tone={statusTone(site.uptime_status)}>{statusLabel(site.uptime_status)}</McPill>
                      </td>
                      <td className="px-3 py-3.5">
                        {uptime != null ? (
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color:
                                uptimeTone(uptime) === "good"
                                  ? "var(--score-good)"
                                  : uptimeTone(uptime) === "warn"
                                    ? "var(--score-warn)"
                                    : "var(--score-bad)",
                            }}
                          >
                            {uptime.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {resp != null ? (
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color:
                                responseTone(resp) === "good"
                                  ? "var(--score-good)"
                                  : responseTone(resp) === "warn"
                                    ? "var(--score-warn)"
                                    : "var(--score-bad)",
                            }}
                          >
                            {resp}ms
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {site.last_uptime_check_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(site.last_uptime_check_at).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <Link
                          href={`/sites/${site.id}?tab=uptime`}
                          className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light"
                        >
                          Open
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </InsightTableShell>
      </div>
    </div>
  );
}
