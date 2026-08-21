"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, Shield } from "lucide-react";
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
import { truncateUrl } from "@/lib/utils";
import type { Site } from "@/types";

function CompactScore({ score }: { score: number | null | undefined }) {
  const v = score ?? null;
  const color =
    v == null ? "#94a3b8" : v >= 80 ? "#16a34a" : v >= 50 ? "#d97706" : "#dc2626";
  if (v == null) return <span className="text-xs text-muted-foreground">Not audited</span>;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function countRiskFlags(site: Site): number {
  let n = 0;
  if (site.xml_rpc_enabled === true) n++;
  if (site.file_editor_enabled === true) n++;
  if (site.wp_debug_enabled === true) n++;
  if (site.login_url_default === true) n++;
  if (site.wp_config_writable === true) n++;
  if (site.htaccess_writable === true) n++;
  if (site.uploads_php_enabled === true) n++;
  return n;
}

function siteSeverity(site: Site): "critical" | "warning" | "healthy" {
  const score = site.latest_scores?.security ?? null;
  const isThreat = site.malware_status === "threat";
  const sslDays = sslDaysRemaining(site.ssl_expiry_date);
  if (isThreat || score === null || score < 50 || (sslDays !== null && sslDays <= 7))
    return "critical";
  if (score < 80 || (sslDays !== null && sslDays <= 30)) return "warning";
  return "healthy";
}

function scoreBucket(score: number | undefined | null): "critical" | "warning" | "healthy" {
  if (score == null || score < 50) return "critical";
  if (score < 80) return "warning";
  return "healthy";
}

function formatScanDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function SslBadge({ date }: { date: string | null | undefined }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const days = sslDaysRemaining(date);
  if (days === null) return <span className="text-xs text-muted-foreground">—</span>;
  const tone = days <= 7 ? "bad" : days <= 30 ? "warn" : "good";
  return (
    <McPill tone={tone}>{days <= 0 ? "Expired" : `${days}d left`}</McPill>
  );
}

function MalwareBadge({ status }: { status: Site["malware_status"] }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const clean = status === "clean";
  return <McPill tone={clean ? "good" : "bad"}>{clean ? "Clean" : "Threat"}</McPill>;
}

type FilterKey = "all" | "critical" | "warning" | "healthy" | "threats";

const QUICK_PILLS = [
  { value: "critical", label: "Critical (<50)" },
  { value: "warning", label: "Warning (50–79)" },
  { value: "healthy", label: "Healthy (80+)" },
  { value: "threats", label: "Threats" },
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

function matchesFilter(site: Site, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "threats") return site.malware_status === "threat";
  return scoreBucket(site.latest_scores?.security) === filter;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { sites, loading, error } = useSites();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const audited = useMemo(
    () => sites.filter((s) => s.latest_scores?.security != null),
    [sites]
  );

  const avgScore = useMemo(() => {
    if (!audited.length) return null;
    return Math.round(
      audited.reduce((sum, s) => sum + s.latest_scores!.security, 0) / audited.length
    );
  }, [audited]);

  const criticalCount = useMemo(
    () => sites.filter((s) => siteSeverity(s) === "critical").length,
    [sites]
  );
  const malwareCount = useMemo(
    () => sites.filter((s) => s.malware_status === "threat").length,
    [sites]
  );
  const sslIssues = useMemo(
    () =>
      sites.filter((s) => {
        const d = sslDaysRemaining(s.ssl_expiry_date);
        return d !== null && d <= 30;
      }).length,
    [sites]
  );

  const filtered = useMemo(() => {
    let list = sites.filter((s) => matchesFilter(s, filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const sa = a.latest_scores?.security ?? -1;
      const sb = b.latest_scores?.security ?? -1;
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
        icon={<Shield size={22} />}
        title="No sites yet"
        description="Add your first site to start monitoring security signals."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Security"
        description={`Threat exposure, vulnerability signals, and SSL health across all ${sites.length} site${sites.length !== 1 ? "s" : ""}.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Avg security score"
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
        <MetricTile
          label="Critical sites"
          value={criticalCount}
          tone={criticalCount > 0 ? "bad" : "good"}
        />
        <MetricTile
          label="SSL issues"
          value={sslIssues}
          tone={sslIssues > 0 ? "warn" : "good"}
        />
        <MetricTile
          label="Malware threats"
          value={malwareCount}
          tone={malwareCount > 0 ? "bad" : "good"}
        />
      </div>

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
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Site
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Security Score
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Malware
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    SSL
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Risk Flags
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Last Scan
                  </th>
                  <th className="w-12 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => {
                  const score = site.latest_scores?.security;
                  const flags = countRiskFlags(site);
                  const severity = siteSeverity(site);
                  return (
                    <tr
                      key={site.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/sites/${site.id}?tab=security`}
                          className="block min-w-0"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-foreground hover:text-accent">
                              {site.name}
                            </p>
                            {severity === "critical" && (
                              <McPill tone="bad">Critical</McPill>
                            )}
                            {severity === "warning" && (
                              <McPill tone="warn">Warning</McPill>
                            )}
                          </div>
                          <p className="truncate text-xs font-medium text-accent/80">
                            {truncateUrl(site.url)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <CompactScore score={score} />
                      </td>
                      <td className="px-4 py-3">
                        <MalwareBadge status={site.malware_status} />
                      </td>
                      <td className="px-4 py-3">
                        <SslBadge date={site.ssl_expiry_date} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            flags > 0
                              ? "text-[var(--score-bad)]"
                              : "text-[var(--score-good)]"
                          }`}
                        >
                          {flags}
                          <span className="font-medium text-muted-foreground">/7</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatScanDate(site.last_audit_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/sites/${site.id}?tab=security`}
                          className="inline-flex rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-accent"
                          title="Open security"
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
