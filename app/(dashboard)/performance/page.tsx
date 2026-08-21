"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Zap, Search, ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw,
} from "lucide-react";
import { useSites } from "@/hooks/useSites";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  FilterRail, QuickPills, InsightTableShell, McPill,
} from "@/components/shared/MalCareUI";
import { Button } from "@/components/ui/Button";
import { scoreHex, truncateUrl } from "@/lib/utils";
import type { Site } from "@/types";

type SortKey = "name" | "performance" | "response" | "last_scan";
type SortDir = "asc" | "desc";
type FilterTab = "all" | "good" | "warning" | "poor";

const QUICK_PILLS: { value: FilterTab; label: string }[] = [
  { value: "good", label: "Fast (80+)" },
  { value: "warning", label: "Warning (50–79)" },
  { value: "poor", label: "Slow (<50)" },
];

function healthBucket(score: number | undefined | null): FilterTab {
  if (score == null) return "poor";
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

function SortIcon({ col, sortBy, dir }: { col: SortKey; sortBy: SortKey; dir: SortDir }) {
  if (sortBy !== col) return <ChevronsUpDown size={11} className="text-muted-foreground/40" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-accent" />
    : <ChevronDown size={11} className="text-accent" />;
}

function MetricTile({
  label, value, unit, sub,
}: {
  label: string; value: string | number | null; unit?: string; sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-end gap-1">
        <span className="font-portal-display text-2xl font-bold tabular-nums leading-none text-foreground">
          {value ?? "—"}
        </span>
        {unit && value != null && (
          <span className="mb-0.5 text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function YesNo({ on }: { on: boolean }) {
  return on ? <McPill tone="good">Yes</McPill> : <McPill tone="neutral">No</McPill>;
}

export default function PerformancePage() {
  const { sites, loading, error } = useSites();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortKey>("performance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");

  const audited = useMemo(
    () => sites.filter((s) => s.latest_scores?.performance != null),
    [sites]
  );

  const avgScore = useMemo(() => {
    if (!audited.length) return null;
    return Math.round(
      audited.reduce((sum, s) => sum + s.latest_scores!.performance, 0) / audited.length
    );
  }, [audited]);

  const avgLabel =
    avgScore == null ? "No data"
      : avgScore >= 80 ? "Excellent"
        : avgScore >= 60 ? "Good"
          : avgScore >= 40 ? "Needs work" : "Poor";

  const responseSites = useMemo(() => sites.filter((s) => s.avg_response_ms != null), [sites]);
  const avgResponse = responseSites.length > 0
    ? Math.round(responseSites.reduce((sum, s) => sum + (s.avg_response_ms ?? 0), 0) / responseSites.length)
    : null;
  const responseLabel =
    avgResponse == null ? "—"
      : avgResponse < 300 ? "Excellent"
        : avgResponse < 800 ? "Acceptable" : "Needs improvement";

  const cachingCount = useMemo(() => sites.filter((s) => s.caching_plugin).length, [sites]);
  const cdnCount = useMemo(() => sites.filter((s) => s.cdn_plugin).length, [sites]);
  const imgOptCount = useMemo(() => sites.filter((s) => s.image_optimization_plugin).length, [sites]);
  const objCacheCount = useMemo(
    () => sites.filter((s) => s.object_cache_enabled === true).length,
    [sites]
  );

  const total = sites.length;
  const techHealth = total > 0
    ? Math.round(
        ([cachingCount, cdnCount, imgOptCount, objCacheCount].reduce((a, b) => a + b, 0) / (4 * total)) * 100
      )
    : 0;

  const filtered = useMemo(() => {
    let base = filter === "all"
      ? sites
      : sites.filter((s) => healthBucket(s.latest_scores?.performance) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    return [...base].sort((a: Site, b: Site) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      if (sortBy === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortBy === "performance") {
        va = a.latest_scores?.performance ?? -1;
        vb = b.latest_scores?.performance ?? -1;
      } else if (sortBy === "response") {
        va = a.avg_response_ms ?? 99999;
        vb = b.avg_response_ms ?? 99999;
      } else {
        va = a.last_audit_at ?? "";
        vb = b.last_audit_at ?? "";
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [sites, filter, search, sortBy, sortDir]);

  function toggleSort(col: SortKey) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }

  function resetFilters() {
    setFilter("all");
    setSearch("");
  }

  const th =
    "px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap select-none cursor-pointer hover:text-foreground transition-colors";

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
      <div className="space-y-5">
        <PageHeader
          title="Performance"
          description="Speed, caching, and Core Web Vitals across your sites."
          icon={<Zap size={22} />}
        />
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={<Zap size={22} />}
            title="No sites yet"
            description="Add your first site to start tracking performance metrics."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Performance"
        description={`Speed, caching, and Core Web Vitals across all ${sites.length} site${sites.length !== 1 ? "s" : ""}.`}
        icon={<Zap size={22} />}
        action={
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search sites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-[4px] border border-border bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Avg Score" value={avgScore} unit="/100" sub={avgLabel} />
        <MetricTile label="Avg Response ms" value={avgResponse} unit="ms" sub={responseLabel} />
        <MetricTile
          label="Sites with Caching"
          value={cachingCount}
          unit={`/ ${total}`}
          sub={`${Math.round((cachingCount / Math.max(total, 1)) * 100)}% adoption`}
        />
        <MetricTile
          label="Tech Stack Health"
          value={techHealth}
          unit="%"
          sub="Caching · CDN · ImgOpt · ObjCache"
        />
      </div>

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
          <QuickPills
            items={QUICK_PILLS}
            value={filter}
            onChange={(v) => setFilter(v as FilterTab)}
          />
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Score bands
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Filter sites by performance score. Fast is 80+, warning is 50–79, slow is under 50.
            </p>
          </div>
        </FilterRail>

        <InsightTableShell
          footer={`${filtered.length} of ${sites.length} sites · ${audited.length} audited`}
        >
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
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className={th} onClick={() => toggleSort("name")}>
                    <span className="inline-flex items-center gap-1.5">
                      Site Name <SortIcon col="name" sortBy={sortBy} dir={sortDir} />
                    </span>
                  </th>
                  <th className={th} onClick={() => toggleSort("performance")}>
                    <span className="inline-flex items-center gap-1.5">
                      Score <SortIcon col="performance" sortBy={sortBy} dir={sortDir} />
                    </span>
                  </th>
                  <th className={th} onClick={() => toggleSort("response")}>
                    <span className="inline-flex items-center gap-1.5">
                      Response <SortIcon col="response" sortBy={sortBy} dir={sortDir} />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Caching
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    CDN
                  </th>
                  <th className={th} onClick={() => toggleSort("last_scan")}>
                    <span className="inline-flex items-center gap-1.5">
                      Last Scan <SortIcon col="last_scan" sortBy={sortBy} dir={sortDir} />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => {
                  const score = site.latest_scores?.performance;
                  const hex = score != null ? scoreHex(score) : undefined;
                  return (
                    <tr
                      key={site.id}
                      className="group border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground group-hover:text-accent">
                            {site.name}
                          </p>
                          <p className="truncate text-xs font-medium text-muted-foreground">
                            {truncateUrl(site.url)}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        {score != null ? (
                          <span className="text-sm font-bold tabular-nums" style={{ color: hex }}>
                            {score}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {site.avg_response_ms != null ? (
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              site.avg_response_ms < 300
                                ? "text-[var(--score-good)]"
                                : site.avg_response_ms < 800
                                  ? "text-[var(--score-warn)]"
                                  : "text-[var(--score-bad)]"
                            }`}
                          >
                            {site.avg_response_ms}ms
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5"><YesNo on={!!site.caching_plugin} /></td>
                      <td className="px-3 py-3.5"><YesNo on={!!site.cdn_plugin} /></td>
                      <td className="px-3 py-3.5">
                        {site.last_audit_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(site.last_audit_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <Link
                          href={`/sites/${site.id}?tab=performance`}
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light"
                        >
                          View <ExternalLink size={12} />
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
