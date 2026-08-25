"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleMinus,
  ExternalLink,
  FileChartColumnIncreasing,
  Gauge,
  TriangleAlert,
} from "lucide-react";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { Button } from "@/components/ui/Button";
import { CubeLoader } from "@/components/sites/SiteLoadingOverlay";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
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

function AccordionBlock({
  title,
  count,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-2 overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-zinc-100 px-4 py-3 text-left text-xs font-medium text-zinc-900"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title} ({count})
        </span>
        <ChevronDown
          size={20}
          strokeWidth={2}
          className={cn("shrink-0 text-zinc-950 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="rounded-b-lg border border-zinc-200 bg-white">
          <div className="max-h-32 space-y-1 overflow-y-auto p-4">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function AuditLine({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 py-1 text-xs text-gray-600">
      <Circle size={8} strokeWidth={1} className="mt-1 shrink-0 text-zinc-950" />
      <span>{label}</span>
    </div>
  );
}

function GoogleAnalyticsSection({ site }: { site: Site }) {
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
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} strokeWidth={1.5} className="text-zinc-950" />
          <div>
            <p className="text-lg font-semibold text-zinc-900">Google Analytics</p>
            <p className="text-xs text-emerald-700">Traffic and engagement for this site</p>
          </div>
        </div>
        {status?.connected && !status.ga4_connected ? (
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
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
            {status.ga4_property_id}
          </span>
        ) : null}
      </div>

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
          <CubeLoader label="Loading Analytics" sublabel="Pulling GA4 metrics…" />
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
    </div>
  );
}

export function PerformanceTab({
  site,
  audits,
  brandColor: _brandColor,
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
  const score = site.latest_scores?.performance ?? null;
  const latestAudit = audits.find((a) => a.status === "completed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = latestAudit?.performance_data as any;

  const ttfb: number | null = perf?.ttfb_ms ?? perf?.ttfb ?? null;
  const total: number | null = perf?.total_ms ?? perf?.load_time ?? null;
  const scripts: number | null = perf?.script_count ?? perf?.js_count ?? null;
  const htmlKb: number | null = perf?.html_kb ?? perf?.html_size ?? null;
  const fcp: number | null = perf?.fcp_ms ?? perf?.fcp ?? null;
  const lcp: number | null = perf?.lcp_ms ?? perf?.lcp ?? null;
  const cls: number | null = perf?.cls ?? null;
  const si: number | null = perf?.speed_index_ms ?? perf?.si ?? null;
  const tbt: number | null = perf?.tbt_ms ?? perf?.tbt ?? null;
  const tti: number | null = perf?.tti_ms ?? perf?.tti ?? null;

  const fmtMs = (ms: number | null) =>
    ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(1)}\u00a0s` : `${Math.round(ms)}\u00a0ms`;

  const metricRows = [
    { label: "First Contentful Paint", value: fmtMs(fcp ?? ttfb) },
    { label: "Speed Index", value: fmtMs(si ?? total) },
    { label: "Largest Contentful Paint", value: fmtMs(lcp ?? total) },
    { label: "Time to Interactive", value: fmtMs(tti ?? total) },
    { label: "Total Blocking Time", value: fmtMs(tbt) },
    { label: "Cumulative Layout Shift", value: cls != null ? cls.toFixed(3) : "—" },
  ];

  type Rec = { title: string; detail: string; severity: "high" | "medium" | "low" };
  const diagnostics: Rec[] = [];
  if (ttfb && ttfb > 800)
    diagnostics.push({
      title: "Optimise server response time",
      detail: `TTFB ${ttfb}ms — target <400ms`,
      severity: "high",
    });
  if (!site.caching_plugin)
    diagnostics.push({
      title: "Install a caching plugin",
      detail: "No caching plugin detected",
      severity: "high",
    });
  if (!site.cdn_plugin)
    diagnostics.push({
      title: "Use a CDN for asset delivery",
      detail: "No CDN plugin active",
      severity: "medium",
    });
  if (!site.image_optimization_plugin)
    diagnostics.push({
      title: "Add image optimisation",
      detail: "No image optimiser detected",
      severity: "medium",
    });
  if (scripts && scripts > 20)
    diagnostics.push({
      title: "Reduce JavaScript files",
      detail: `${scripts} scripts found — aim for <20`,
      severity: "medium",
    });
  if (!site.object_cache_enabled)
    diagnostics.push({
      title: "Enable object caching",
      detail: "Object cache is disabled",
      severity: "medium",
    });
  if ((site.autoloaded_options_kb ?? 0) > 800)
    diagnostics.push({
      title: "Reduce autoloaded options",
      detail: `${site.autoloaded_options_kb}KB — target <800KB`,
      severity: "high",
    });
  if ((site.transient_count ?? 0) > 100)
    diagnostics.push({
      title: "Clean up expired transients",
      detail: `${site.transient_count} transients stored`,
      severity: "low",
    });
  if ((site.post_revisions_count ?? 0) > 500)
    diagnostics.push({
      title: "Limit post revisions",
      detail: `${site.post_revisions_count} revisions stored`,
      severity: "low",
    });
  if (htmlKb && htmlKb > 100)
    diagnostics.push({
      title: "Reduce HTML document size",
      detail: `${htmlKb.toFixed(1)}KB HTML payload`,
      severity: "low",
    });

  const passed: string[] = [];
  if (ttfb != null && ttfb <= 400) passed.push("Server response time is healthy");
  if (site.caching_plugin) passed.push(`Caching plugin active (${site.caching_plugin})`);
  if (site.cdn_plugin) passed.push(`CDN detected (${site.cdn_plugin})`);
  if (site.image_optimization_plugin)
    passed.push(`Image optimisation active (${site.image_optimization_plugin})`);
  if (site.object_cache_enabled) passed.push("Object cache enabled");
  if (scripts != null && scripts <= 20) passed.push("JavaScript file count is within range");
  if ((site.autoloaded_options_kb ?? 0) > 0 && (site.autoloaded_options_kb ?? 0) <= 800)
    passed.push("Autoloaded options within budget");
  if ((site.transient_count ?? 0) > 0 && (site.transient_count ?? 0) <= 100)
    passed.push("Transient count looks healthy");
  if (htmlKb != null && htmlKb <= 100) passed.push("HTML size is reasonable");
  if (score != null && score >= 80) passed.push("Overall performance score is good");

  const notApplicable = [
    "Performance budget",
    "Timing budget",
    "Preload key requests",
    "User Timing marks and measures",
    "Lazy load third-party resources with facades",
    "Minimize third-party usage",
  ];

  const scoreColor =
    score == null ? "#71717a" : score >= 80 ? "#059669" : score >= 50 ? "#f59e0b" : "#dc2626";

  return (
    <div className="mx-auto w-full max-w-[1323px] space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <FileChartColumnIncreasing
            size={24}
            strokeWidth={1}
            className="mt-1 shrink-0 rounded-full bg-zinc-300 p-1 text-zinc-950 shadow-[0_0_0_4px_rgb(244,244,245)]"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-normal text-black">Performance Details</h1>
            <p className="text-xs font-normal leading-normal text-emerald-600">
              View performance insights and enable optimization features
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canRunAudit && runAudit ? (
            <Button size="sm" onClick={runAudit}>
              Run audit
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              const prompt = `Optimize PSI for ${site.name} using low risk fixes. Show me the improvements step by step.`;
              router.push(`/sites/${site.id}?tab=agent&prompt=${encodeURIComponent(prompt)}`);
            }}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Optimize with AI?
          </button>
        </div>
      </header>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Gauge size={24} strokeWidth={1.5} className="text-zinc-950" />
            <p className="text-lg font-semibold text-zinc-900">Google Lighthouse Report</p>
          </div>
          <p className="mt-1 text-xs text-emerald-700">Performance metrics for your website</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex items-center justify-center lg:col-span-1">
            <SiteScoreWheel score={score} caption="Score" size={200} />
          </div>
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-semibold text-gray-700">Metrics</p>
            <div className="space-y-1">
              {metricRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0"
                >
                  <span className="text-xs font-medium text-gray-800">{row.label}</span>
                  <span className="text-xs font-medium tabular-nums text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
            {score != null && (
              <p className="mt-3 text-xs text-zinc-500">
                Score color:{" "}
                <span className="font-semibold" style={{ color: scoreColor }}>
                  {score >= 80 ? "Good" : score >= 50 ? "Needs improvement" : "Poor"}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <AccordionBlock
            title="Diagnostics"
            count={diagnostics.length}
            icon={<TriangleAlert size={16} strokeWidth={1} className="text-orange-500" />}
          >
            {diagnostics.length === 0 ? (
              <p className="py-2 text-xs text-zinc-500">No diagnostics flagged for this site.</p>
            ) : (
              diagnostics.map((d) => <AuditLine key={d.title} label={`${d.title} — ${d.detail}`} />)
            )}
          </AccordionBlock>

          <AccordionBlock
            title="Passed Audits"
            count={passed.length}
            icon={<CheckCircle2 size={16} strokeWidth={1} className="text-emerald-600" />}
          >
            {passed.length === 0 ? (
              <p className="py-2 text-xs text-zinc-500">Run an audit to populate passed checks.</p>
            ) : (
              passed.map((p) => <AuditLine key={p} label={p} />)
            )}
          </AccordionBlock>

          <AccordionBlock
            title="Not Applicable"
            count={notApplicable.length}
            icon={<CircleMinus size={16} strokeWidth={1} className="text-gray-500" />}
            defaultOpen={false}
          >
            {notApplicable.map((p) => (
              <AuditLine key={p} label={p} />
            ))}
          </AccordionBlock>
        </div>
      </div>

      <GoogleAnalyticsSection site={site} />
    </div>
  );
}
