"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
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
import { CrawlOverviewCard } from "@/components/seo/CrawlOverviewCard";
import { truncateUrl } from "@/lib/utils";
import type { Site } from "@/types";

function CompactScore({ score }: { score: number | null | undefined }) {
  const v = score ?? null;
  const color =
    v == null ? "#94a3b8" : v >= 80 ? "#16a34a" : v >= 50 ? "#d97706" : "#dc2626";
  if (v == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex min-w-[100px] items-center gap-2">
      <span className="w-7 text-sm font-bold tabular-nums" style={{ color }}>
        {v}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, v)}%`, background: color }}
        />
      </div>
    </div>
  );
}

type FilterKey = "all" | "good" | "warning" | "poor";

function healthBucket(score: number | undefined | null): Exclude<FilterKey, "all"> {
  if (score == null) return "poor";
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

function formatAuditDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

const QUICK_PILLS = [
  { value: "good", label: "Good (80+)" },
  { value: "warning", label: "Warning (50–79)" },
  { value: "poor", label: "Poor (<50)" },
];

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
}) {
  const color =
    tone === "good"
      ? "text-[var(--score-good)]"
      : tone === "warn"
        ? "text-[var(--score-warn)]"
        : tone === "bad"
          ? "text-[var(--score-bad)]"
          : tone === "accent"
            ? "text-accent"
            : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
    </div>
  );
}

export default function SeoPage() {
  const { sites, loading, error } = useSites();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const audited = useMemo(
    () => sites.filter((s) => s.latest_scores?.seo != null),
    [sites]
  );

  const avgScore = useMemo(() => {
    if (!audited.length) return null;
    return Math.round(
      audited.reduce((sum, s) => sum + s.latest_scores!.seo, 0) / audited.length
    );
  }, [audited]);

  const goodCount = useMemo(
    () => audited.filter((s) => s.latest_scores!.seo >= 80).length,
    [audited]
  );
  const warnCount = useMemo(
    () =>
      audited.filter((s) => {
        const sc = s.latest_scores!.seo;
        return sc >= 50 && sc < 80;
      }).length,
    [audited]
  );
  const poorCount = useMemo(
    () => audited.filter((s) => s.latest_scores!.seo < 50).length,
    [audited]
  );

  const filtered = useMemo(() => {
    let list = sites;
    if (filter !== "all") {
      list = list.filter((s) => healthBucket(s.latest_scores?.seo) === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const sa = a.latest_scores?.seo ?? -1;
      const sb = b.latest_scores?.seo ?? -1;
      return sa - sb;
    });
  }, [sites, filter, search]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] px-4 py-3 text-sm text-[var(--score-bad)]">
        {error}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={<Search size={22} />}
        title="No sites yet"
        description="Add your first site to start monitoring SEO health."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="SEO"
        description={`Search engine optimization health across all ${sites.length} site${sites.length !== 1 ? "s" : ""}.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Avg SEO score"
          value={avgScore ?? "—"}
          tone={
            avgScore == null
              ? "default"
              : avgScore >= 80
                ? "good"
                : avgScore >= 50
                  ? "warn"
                  : "bad"
          }
        />
        <MetricTile label="Good" value={goodCount} tone="good" />
        <MetricTile label="Warning" value={warnCount} tone="warn" />
        <MetricTile label="Poor" value={poorCount} tone="bad" />
      </div>

      <CrawlOverviewCard />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterRail
          footer={
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
              className="w-full rounded-[4px] py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Reset filters
            </button>
          }
        >
          <QuickPills
            items={QUICK_PILLS}
            value={filter}
            onChange={(v) => setFilter(v as FilterKey)}
          />
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Search
            </p>
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Site name or URL"
                className="h-9 w-full rounded-[4px] border border-border bg-muted/40 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-surface focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{audited.length}</span> of{" "}
              {sites.length} audited
            </p>
          </div>
        </FilterRail>

        <InsightTableShell
          footer={`${filtered.length} site${filtered.length !== 1 ? "s" : ""}`}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              No sites match your filter.
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Site
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    SEO Score
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Title / Meta
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Last Audit
                  </th>
                  <th className="w-12 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((site: Site) => {
                  const score = site.latest_scores?.seo;
                  const bucket = healthBucket(score);
                  return (
                    <tr
                      key={site.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/sites/${site.id}?tab=seo`}
                          className="block min-w-0"
                        >
                          <p className="truncate text-sm font-bold text-foreground hover:text-accent">
                            {site.name}
                          </p>
                          <p className="truncate text-xs font-medium text-accent/80">
                            {truncateUrl(site.url)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <CompactScore score={score} />
                          {score != null ? (
                            <McPill
                              tone={
                                bucket === "good"
                                  ? "good"
                                  : bucket === "warning"
                                    ? "warn"
                                    : "bad"
                              }
                            >
                              {bucket === "good"
                                ? "Good"
                                : bucket === "warning"
                                  ? "Warning"
                                  : "Poor"}
                            </McPill>
                          ) : (
                            <McPill tone="neutral">Not audited</McPill>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatAuditDate(site.last_audit_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/sites/${site.id}?tab=seo`}
                          className="inline-flex rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-accent"
                          title="Open SEO"
                        >
                          <ExternalLink size={14} strokeWidth={1.75} />
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
