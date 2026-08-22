"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Zap, Server, TrendingUp, CheckCircle2, AlertCircle,
  BarChart2, ExternalLink, Bot,
} from "lucide-react";
import { McCard, McPill, ScoreHistoryList } from "@/components/shared/MalCareUI";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import type { Site, Audit } from "@/types";

interface GA4Data {
  sessions_7d: number;
  pageviews_7d: number;
  bounce_rate: number;
  avg_session_sec: number;
  sessions_30d: number;
  pageviews_30d: number;
  top_pages: { path: string; pageviews: number; sessions: number }[];
}

function GoogleAnalyticsSection({ site, brandColor }: { site: Site; brandColor: string }) {
  const [status, setStatus] = useState<{
    connected: boolean;
    ga4_connected: boolean;
    ga4_property_id: string | null;
  } | null>(null);
  const [data, setData] = useState<GA4Data | null>(null);
  const [properties, setProps] = useState<
    { property_id: string; display_name: string; account_name: string }[] | null
  >(null);
  const [loadingData, setLoadingData] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectingProp, setSelectingProp] = useState(false);

  useEffect(() => {
    api
      .get<typeof status>(`/analytics/${site.id}/status`)
      .then(({ data: s }) => {
        setStatus(s);
        if (s?.ga4_connected) {
          setLoadingData(true);
          api
            .get<GA4Data>(`/analytics/${site.id}/ga4`)
            .then(({ data: d }) => setData(d))
            .catch(() => {})
            .finally(() => setLoadingData(false));
        }
      })
      .catch(() => {});
  }, [site.id]);

  async function connect() {
    setConnecting(true);
    try {
      const { data: r } = await api.get<{ url: string }>(`/analytics/${site.id}/google/auth-url`);
      window.location.href = r.url;
    } catch {
      setConnecting(false);
    }
  }

  async function openPropertySelector() {
    setSelectingProp(true);
    try {
      const { data: r } = await api.get<{ properties: typeof properties }>(
        `/analytics/${site.id}/ga4/properties`
      );
      setProps(r.properties);
    } catch {
      setSelectingProp(false);
    }
  }

  async function selectProperty(id: string) {
    await api.post(`/analytics/${site.id}/ga4/property`, { property_id: id });
    setProps(null);
    setSelectingProp(false);
    const { data: s } = await api.get<typeof status>(`/analytics/${site.id}/status`);
    setStatus(s);
    if (s?.ga4_connected) {
      setLoadingData(true);
      api
        .get<GA4Data>(`/analytics/${site.id}/ga4`)
        .then(({ data: d }) => setData(d))
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }

  const fmtSec = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`;

  return (
    <McCard
      title="Google Analytics"
      icon={<BarChart2 size={15} />}
      action={
        status?.connected && !status.ga4_connected ? (
          <button
            type="button"
            onClick={openPropertySelector}
            className="text-xs font-bold text-accent hover:underline"
          >
            Select property
          </button>
        ) : !status?.connected ? (
          <Button size="sm" onClick={connect} disabled={connecting} loading={connecting}>
            <ExternalLink size={11} />
            Connect Google
          </Button>
        ) : status.ga4_connected ? (
          <McPill tone="neutral">{status.ga4_property_id}</McPill>
        ) : null
      }
      bodyClassName={status?.ga4_connected && data ? "p-4" : "p-4"}
    >
      {properties !== null && (
        <div className="mb-4 space-y-1.5 border-b border-border pb-4">
          <p className="mb-2 text-xs font-semibold text-foreground">Select your GA4 property</p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {properties.map((p) => (
              <button
                key={p.property_id}
                type="button"
                onClick={() => selectProperty(p.property_id)}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
              >
                <span className="font-semibold text-foreground">{p.display_name}</span>
                <span className="ml-2 text-muted-foreground">— {p.account_name}</span>
                <span className="float-right font-mono text-muted-foreground">{p.property_id}</span>
              </button>
            ))}
            {properties.length === 0 && (
              <p className="py-2 text-xs text-muted-foreground">
                No GA4 properties found for this Google account.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setProps(null);
              setSelectingProp(false);
            }}
            className="mt-2 text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {!status?.connected && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BarChart2 size={24} className="text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Connect Google Analytics</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            See sessions, pageviews, bounce rate and top pages alongside your performance score.
          </p>
        </div>
      )}

      {status?.connected && !status.ga4_connected && properties === null && !selectingProp && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Google account connected</p>
          <p className="text-xs text-muted-foreground">
            Select your GA4 property to start viewing traffic data.
          </p>
        </div>
      )}

      {status?.ga4_connected &&
        (loadingData ? (
          <div className="flex items-center justify-center py-10">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: `${brandColor}30`, borderTopColor: brandColor }}
            />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Sessions (7d)", value: data.sessions_7d.toLocaleString() },
                { label: "Sessions (30d)", value: data.sessions_30d.toLocaleString() },
                { label: "Pageviews (7d)", value: data.pageviews_7d.toLocaleString() },
                { label: "Bounce Rate", value: `${(data.bounce_rate * 100).toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg. session duration (7d):{" "}
              <span className="font-semibold text-foreground">{fmtSec(data.avg_session_sec)}</span>
            </p>
            {data.top_pages.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border">
                <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
                  Top Pages (30d)
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Page</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Views</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground">
                        Sessions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_pages.map((p, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="max-w-[240px] truncate px-3 py-2 font-mono text-foreground">
                          {p.path}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {p.pageviews.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {p.sessions.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Could not load GA4 data. Check that this property has data.
            </p>
          </div>
        ))}
    </McCard>
  );
}

export function PerformanceTab({
  site,
  audits,
  brandColor,
  runAudit,
  canRunAudit,
}: {
  site: Site;
  audits: Audit[];
  brandColor: string;
  runAudit?: () => void;
  canRunAudit?: boolean;
}) {
  const router = useRouter();
  const score = site.latest_scores?.performance;
  const latestAudit = audits.find((a) => a.status === "completed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = latestAudit?.performance_data as any;

  const optimizePSIWithAgent = () => {
    const prompt = `Optimize PSI for ${site.name} using low risk fixes. Show me the improvements step by step.`;
    router.push(`/sites/${site.id}?tab=agent&prompt=${encodeURIComponent(prompt)}`);
  };

  const ttfb: number | null = perf?.ttfb_ms ?? null;
  const total: number | null = perf?.total_ms ?? null;
  const scripts: number | null = perf?.script_count ?? null;
  const htmlKb: number | null = perf?.html_kb ?? null;

  const completed = audits.filter((a) => a.status === "completed" && a.scores);
  const trendPts = completed.slice(-10).map((a) => ({
    date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: a.scores!.performance,
  }));

  type Rec = { title: string; detail: string; severity: "high" | "medium" | "low" };
  const recs: Rec[] = [];
  if (ttfb && ttfb > 800)
    recs.push({
      title: "Optimise server response time",
      detail: `TTFB ${ttfb}ms — target <400ms`,
      severity: "high",
    });
  if (!site.caching_plugin)
    recs.push({ title: "Install a caching plugin", detail: "No caching plugin detected", severity: "high" });
  if (!site.cdn_plugin)
    recs.push({ title: "Use a CDN for asset delivery", detail: "No CDN plugin active", severity: "medium" });
  if (!site.image_optimization_plugin)
    recs.push({
      title: "Add image optimisation",
      detail: "No image optimiser detected",
      severity: "medium",
    });
  if (scripts && scripts > 20)
    recs.push({
      title: "Reduce JavaScript files",
      detail: `${scripts} scripts found — aim for <20`,
      severity: "medium",
    });
  if (!site.object_cache_enabled)
    recs.push({ title: "Enable object caching", detail: "Object cache is disabled", severity: "medium" });
  if ((site.autoloaded_options_kb ?? 0) > 800)
    recs.push({
      title: "Reduce autoloaded options",
      detail: `${site.autoloaded_options_kb}KB — target <800KB`,
      severity: "high",
    });
  if ((site.transient_count ?? 0) > 100)
    recs.push({
      title: "Clean up expired transients",
      detail: `${site.transient_count} transients stored`,
      severity: "low",
    });
  if ((site.post_revisions_count ?? 0) > 500)
    recs.push({
      title: "Limit post revisions",
      detail: `${site.post_revisions_count} revisions stored`,
      severity: "low",
    });

  function mStatus(
    val: number | null,
    good: number,
    warn: number
  ): "good" | "needs-work" | "poor" | null {
    if (val === null) return null;
    return val <= good ? "good" : val <= warn ? "needs-work" : "poor";
  }

  const metricRows = [
    {
      title: "Time to First Byte",
      abbr: "TTFB",
      value: ttfb !== null ? `${ttfb.toLocaleString()}ms` : "—",
      st: mStatus(ttfb, 400, 800),
    },
    {
      title: "Page Load Time",
      abbr: "Load",
      value: total !== null ? `${total.toLocaleString()}ms` : "—",
      st: mStatus(total, 1500, 3000),
    },
    {
      title: "JavaScript Files",
      abbr: "JS",
      value: scripts !== null ? String(scripts) : "—",
      st: mStatus(scripts, 10, 20),
    },
    {
      title: "HTML Size",
      abbr: "HTML",
      value: htmlKb !== null ? `${htmlKb.toFixed(1)}KB` : "—",
      st: mStatus(htmlKb, 50, 100),
    },
  ];

  const toneFor = (st: ReturnType<typeof mStatus>) =>
    st === "good" ? "good" : st === "needs-work" ? "warn" : st === "poor" ? "bad" : "neutral";
  const labelFor = (st: ReturnType<typeof mStatus>) =>
    st === "good" ? "Good" : st === "needs-work" ? "Needs Work" : st === "poor" ? "Poor" : "No data";

  return (
    <div className="space-y-4">
      {/* MalCare Performance card — wheel left, trend/recs right */}
      <McCard
        title="Performance"
        icon={<BarChart2 size={15} />}
        action={
          <div className="flex items-center gap-3">
            {score != null && (
              <McPill
                tone={score >= 80 ? "good" : score >= 50 ? "warn" : "bad"}
                icon={<Zap size={11} />}
              >
                {score >= 80 ? "Good" : score >= 50 ? "Needs Improvement" : "Poor"}
              </McPill>
            )}
            <button
              type="button"
              onClick={optimizePSIWithAgent}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Optimize with AI?
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
          <SiteScoreWheel score={score} caption="Site Score" size={118} />
          <div className="min-w-0">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Performance Trend</p>
            {trendPts.length > 0 ? (
              <ScoreHistoryList points={trendPts} />
            ) : (
              <p className="py-6 text-sm italic text-muted-foreground">
                Trend data will appear after more audits
              </p>
            )}
          </div>
        </div>
      </McCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <McCard title="Core Metrics" icon={<Activity size={15} />}>
          <div className="divide-y divide-border">
            {metricRows.map(({ title, value, st }) => (
              <div key={title} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{value}</p>
                </div>
                <McPill tone={toneFor(st)}>{labelFor(st)}</McPill>
              </div>
            ))}
          </div>
        </McCard>

        <McCard
          title="Recommendations"
          icon={<Zap size={15} />}
          action={recs.length > 0 ? <McPill tone="neutral">{recs.length}</McPill> : null}
        >
          {recs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 size={20} className="text-[var(--score-good)]" />
              <p className="text-sm font-medium text-foreground">All good</p>
              <p className="text-xs text-muted-foreground">No performance issues found</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recs.slice(0, 7).map(({ title, detail, severity }) => (
                <li key={title} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <Zap
                    size={13}
                    className={`mt-0.5 shrink-0 ${
                      severity === "high"
                        ? "text-[var(--score-bad)]"
                        : severity === "medium"
                          ? "text-[var(--score-warn)]"
                          : "text-accent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
                  </div>
                  <McPill
                    tone={severity === "high" ? "bad" : severity === "medium" ? "warn" : "accent"}
                  >
                    {severity}
                  </McPill>
                </li>
              ))}
            </ul>
          )}
        </McCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <McCard title="Stack & Tech" icon={<Server size={15} />}>
          <div className="space-y-2.5">
            {(
              [
                { label: "Caching Plugin", value: site.caching_plugin },
                { label: "CDN Plugin", value: site.cdn_plugin },
                { label: "Image Optimisation", value: site.image_optimization_plugin },
                {
                  label: "Object Cache",
                  value: site.object_cache_enabled
                    ? "Enabled"
                    : site.object_cache_enabled === false
                      ? null
                      : undefined,
                },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-muted-foreground">
                    {typeof value === "string" ? value : value ? "Active" : "Not detected"}
                  </p>
                </div>
                {value ? (
                  <CheckCircle2 size={14} className="shrink-0 text-[var(--score-good)]" />
                ) : value === undefined ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <AlertCircle size={14} className="shrink-0 text-[var(--score-warn)]" />
                )}
              </div>
            ))}
          </div>
        </McCard>

        <McCard title="Database Health" icon={<Server size={15} />}>
        {(
          [
            { label: "Autoloaded Options", value: site.autoloaded_options_kb, unit: "KB", warnAt: 800 },
            { label: "Transients", value: site.transient_count, unit: "", warnAt: 100 },
            { label: "Post Revisions", value: site.post_revisions_count, unit: "", warnAt: 500 },
            { label: "Orphaned Post Meta", value: site.orphaned_post_meta_count, unit: "", warnAt: 0 },
          ] as const
        )
          .filter((r) => r.value != null)
          .map(({ label, value, unit, warnAt }) => {
            const v = value!;
            const isWarn = v > warnAt;
            return (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border py-2.5 text-xs last:border-0 first:pt-0 last:pb-0"
              >
                <span className="text-muted-foreground">{label}</span>
                <span
                  className={`font-bold tabular-nums ${
                    isWarn ? "text-[var(--score-warn)]" : "text-foreground"
                  }`}
                >
                  {v.toLocaleString()}
                  {unit ? ` ${unit}` : ""}
                  {isWarn && <AlertCircle size={11} className="ml-1 inline text-[var(--score-warn)]" />}
                </span>
              </div>
            );
          })}
        {[
          site.autoloaded_options_kb,
          site.transient_count,
          site.post_revisions_count,
          site.orphaned_post_meta_count,
        ].every((v) => v == null) && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Connect the plugin to view database health
          </p>
        )}
      </McCard>
      </div>

      <McCard
        title="AI-Powered PSI Optimization"
        icon={<Bot size={15} />}
        action={
          <Button size="sm" onClick={optimizePSIWithAgent}>
            Optimize with Agent
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Let our AI agent optimize your PageSpeed Insights score. You approve each fix before it&apos;s
          applied.
        </p>
      </McCard>

      <GoogleAnalyticsSection site={site} brandColor={brandColor} />
    </div>
  );
}
