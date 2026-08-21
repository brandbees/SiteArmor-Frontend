"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink,
  Search, Wrench, TrendingUp,
} from "lucide-react";
import { McCard, McPill, ScoreHistoryList } from "@/components/shared/MalCareUI";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { Button } from "@/components/ui/Button";
import { SeoAuditPanel } from "@/components/sites/SeoAuditPanel";
import api from "@/lib/api";
import type { Site, Audit } from "@/types";

function BrokenLinksSection({ siteId, brandColor }: { siteId: string; brandColor: string }) {
  const [links, setLinks] = useState<
    { url: string; status_code: number; found_on: string; checked_at: string }[]
  >([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api
      .get<{ broken_links: typeof links; checked_at: string | null }>(
        `/sites/${siteId}/broken-links`
      )
      .then(({ data }) => {
        setLinks(data.broken_links);
        setCheckedAt(data.checked_at);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  async function triggerRun() {
    setRunning(true);
    try {
      await api.post(`/sites/${siteId}/broken-links/run`);
    } catch {
      /* ignore */
    }
    setRunning(false);
  }

  return (
    <McCard
      title="Broken Links"
      icon={<ExternalLink size={15} />}
      action={
        <div className="flex items-center gap-2">
          {links.length > 0 && <McPill tone="bad">{links.length} broken</McPill>}
          <Button size="sm" variant="secondary" onClick={triggerRun} disabled={running} loading={running}>
            <RefreshCw size={11} />
            Run check
          </Button>
        </div>
      }
      bodyClassName={links.length > 0 && !loading ? "p-0" : "p-4"}
    >
      <p className="-mt-1 mb-3 px-0 text-xs text-muted-foreground">
        {checkedAt
          ? `Last checked ${new Date(checkedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`
          : "Not yet checked"}
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: `${brandColor}30`, borderTopColor: brandColor }}
          />
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CheckCircle2 size={22} className="text-[var(--score-good)]" />
          <p className="text-sm font-semibold text-foreground">
            {checkedAt ? "No broken links found" : "No data yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {checkedAt ? "All links are responding correctly" : "Run a check to scan up to 50 pages"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Broken URL", "Status", "Found On"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((link, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="max-w-[320px] px-4 py-2.5">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-xs text-foreground hover:underline"
                    >
                      {link.url}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <McPill tone={link.status_code === 404 ? "warn" : "bad"}>{link.status_code}</McPill>
                  </td>
                  <td className="max-w-[260px] px-4 py-2.5">
                    <a
                      href={link.found_on}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-full truncate text-xs text-muted-foreground hover:underline"
                    >
                      {link.found_on.replace(/^https?:\/\/[^/]+/, "") || "/"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </McCard>
  );
}

interface SCData {
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  top_queries: { query: string; clicks: number; impressions: number; position: number }[];
  top_pages: { page: string; clicks: number; impressions: number }[];
}

function SearchConsoleSection({ site, brandColor }: { site: Site; brandColor: string }) {
  const [status, setStatus] = useState<{
    connected: boolean;
    sc_connected: boolean;
    sc_property_url: string | null;
  } | null>(null);
  const [data, setData] = useState<SCData | null>(null);
  const [scProps, setScProps] = useState<{ site_url: string; permission_level: string }[] | null>(
    null
  );
  const [loadingData, setLoadingData] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    api
      .get<typeof status>(`/analytics/${site.id}/status`)
      .then(({ data: s }) => {
        setStatus(s);
        if (s?.sc_connected) {
          setLoadingData(true);
          api
            .get<SCData>(`/analytics/${site.id}/search-console`)
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

  async function openPropSelector() {
    const { data: r } = await api.get<{ properties: typeof scProps }>(
      `/analytics/${site.id}/sc/properties`
    );
    setScProps(r.properties);
  }

  async function selectSCProperty(url: string) {
    await api.post(`/analytics/${site.id}/sc/property`, { site_url: url });
    setScProps(null);
    const { data: s } = await api.get<typeof status>(`/analytics/${site.id}/status`);
    setStatus(s);
    if (s?.sc_connected) {
      setLoadingData(true);
      api
        .get<SCData>(`/analytics/${site.id}/search-console`)
        .then(({ data: d }) => setData(d))
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }

  return (
    <McCard
      title="Google Search Console"
      icon={<Search size={15} />}
      action={
        status?.connected && !status.sc_connected ? (
          <button
            type="button"
            onClick={openPropSelector}
            className="text-xs font-bold text-accent hover:underline"
          >
            Select property
          </button>
        ) : !status?.connected ? (
          <Button size="sm" onClick={connect} disabled={connecting} loading={connecting}>
            <ExternalLink size={11} />
            Connect Google
          </Button>
        ) : status.sc_connected ? (
          <McPill tone="neutral">
            <span className="max-w-[160px] truncate">{status.sc_property_url}</span>
          </McPill>
        ) : null
      }
    >
      {scProps !== null && (
        <div className="mb-4 space-y-1.5 border-b border-border pb-4">
          <p className="mb-2 text-xs font-semibold text-foreground">
            Select your Search Console property
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {scProps.map((p) => (
              <button
                key={p.site_url}
                type="button"
                onClick={() => selectSCProperty(p.site_url)}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
              >
                <span className="font-semibold text-foreground">{p.site_url}</span>
                <span className="ml-2 capitalize text-muted-foreground">
                  {p.permission_level?.replace("_", " ")}
                </span>
              </button>
            ))}
            {scProps.length === 0 && (
              <p className="py-2 text-xs text-muted-foreground">
                No Search Console properties found. Make sure this site is verified in Google Search
                Console.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScProps(null)}
            className="mt-2 text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {!status?.connected && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Search size={24} className="text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Connect Search Console</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            See clicks, impressions, CTR, average position, and top search queries alongside your SEO
            score.
          </p>
        </div>
      )}

      {status?.connected && !status.sc_connected && scProps === null && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Google account connected</p>
          <p className="text-xs text-muted-foreground">
            Select your Search Console property to start viewing search data.
          </p>
        </div>
      )}

      {status?.sc_connected &&
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
                { label: "Clicks (28d)", value: data.clicks.toLocaleString() },
                { label: "Impressions (28d)", value: data.impressions.toLocaleString() },
                { label: "CTR", value: `${(data.ctr * 100).toFixed(2)}%` },
                { label: "Avg. Position", value: data.avg_position.toFixed(1) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
                </div>
              ))}
            </div>
            {data.top_queries.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border">
                <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
                  Top Queries
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Query</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground">
                        Clicks
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Impr.</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_queries.map((q, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-foreground">{q.query}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {q.clicks.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {q.impressions.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {q.position.toFixed(1)}
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
              Could not load Search Console data. Ensure this property is verified and has data.
            </p>
          </div>
        ))}
    </McCard>
  );
}

export function SeoTab({
  site,
  audits,
  brandColor,
}: {
  site: Site;
  audits: Audit[];
  brandColor: string;
}) {
  const score = site.latest_scores?.seo ?? null;
  const latestAudit = audits.find((a) => a.status === "completed");
  const seoData = latestAudit?.seo_data;

  type SeoCheck = { id: string; label: string; status: "pass" | "fail" | "warn"; detail?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checksArray: SeoCheck[] = Array.isArray((seoData as any)?.checks)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (seoData as any).checks
    : [];

  const passCount = checksArray.filter((c) => c.status === "pass").length;
  const failCount = checksArray.filter((c) => c.status === "fail").length;
  const warnCount = checksArray.filter((c) => c.status === "warn").length;
  const totalChecks = checksArray.length || 10;
  const issueCount = failCount + warnCount;

  const scoreLabel =
    score === null
      ? "No Data"
      : score >= 80
        ? "Excellent"
        : score >= 60
          ? "Good"
          : score >= 40
            ? "Needs Work"
            : "Poor";

  const completed = audits.filter((a) => a.status === "completed" && a.scores);
  const trendPts = completed.slice(-8).map((a) => ({
    date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: a.scores!.seo,
  }));
  const scoreDelta =
    trendPts.length >= 2 ? trendPts[trendPts.length - 1].score - trendPts[0].score : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Site-wide SEO audit</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Crawls every page, finds issues with named pages attached, and applies the safe fixes for
          you.
        </p>
        <SeoAuditPanel siteId={site.id} />
      </div>

      <div className="border-t border-border pt-2">
        <h3 className="mb-1 mt-3 text-sm font-semibold text-foreground">Homepage audit</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          The single-page check that runs with every scheduled audit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <McCard
          title="SEO"
          icon={<TrendingUp size={15} />}
          action={<McPill tone={score == null ? "neutral" : score >= 60 ? "good" : score >= 40 ? "warn" : "bad"}>{scoreLabel}</McPill>}
        >
          <SiteScoreWheel score={score} caption="SEO Score" size={110} />
        </McCard>

        <McCard title="Issues" icon={<AlertCircle size={15} />}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Critical", value: failCount, tone: "bad" as const },
              { label: "Warning", value: warnCount, tone: "warn" as const },
              { label: "Info", value: 0, tone: "accent" as const },
            ].map(({ label, value, tone }) => (
              <div key={label} className="rounded-md border border-border px-2 py-3 text-center">
                <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
                <McPill tone={tone}>{label}</McPill>
              </div>
            ))}
          </div>
        </McCard>

        <McCard title="Checklist" icon={<CheckCircle2 size={15} />}>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {passCount}
            <span className="text-sm font-normal text-muted-foreground"> / {totalChecks} passed</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${totalChecks > 0 ? (passCount / totalChecks) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {issueCount > 0 ? `${issueCount} items need attention` : "All checks passed"}
          </p>
        </McCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {trendPts.length > 0 && (
          <McCard
            title="Recent Scores"
            icon={<TrendingUp size={15} />}
            action={
              scoreDelta !== null ? (
                <McPill tone={scoreDelta >= 0 ? "good" : "bad"}>
                  {scoreDelta >= 0 ? "+" : ""}
                  {scoreDelta} pts
                </McPill>
              ) : null
            }
          >
            <ScoreHistoryList points={trendPts} />
          </McCard>
        )}

        <McCard
          title="SEO Issues"
          icon={<AlertCircle size={15} />}
          action={
            checksArray.filter((c) => c.status !== "pass").length > 0 ? (
              <McPill tone="warn">
                {checksArray.filter((c) => c.status !== "pass").length} open
              </McPill>
            ) : null
          }
          bodyClassName={
            checksArray.filter((c) => c.status !== "pass").length > 0 ? "p-0" : "p-4"
          }
        >
          {checksArray.filter((c) => c.status !== "pass").length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <CheckCircle2 size={22} className="text-[var(--score-good)]" />
              <p className="text-xs text-muted-foreground text-center">
                {checksArray.length === 0 ? "Run an audit to see SEO issues" : "No issues found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Issue", "Severity", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checksArray
                    .filter((c) => c.status !== "pass")
                    .map(({ id, label, status, detail }) => (
                      <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-foreground">{label}</p>
                          {detail && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <McPill tone={status === "fail" ? "bad" : "warn"}>
                            {status === "fail" ? "Critical" : "Warning"}
                          </McPill>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-semibold text-[var(--score-warn)]">Open</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/40"
                          >
                            <Wrench size={10} /> Fix
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </McCard>
      </div>

      <BrokenLinksSection siteId={site.id} brandColor={brandColor} />
      <SearchConsoleSection site={site} brandColor={brandColor} />

      <McCard title="Homepage Checklist" icon={<CheckCircle2 size={15} />} bodyClassName="p-0">
        {checksArray.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            Run an audit to see SEO checklist
          </p>
        ) : (
          <div className="divide-y divide-border">
            {checksArray.map(({ id, label, status, detail }) => (
              <div key={id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-start gap-2">
                  {status === "pass" ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--score-good)]" />
                  ) : status === "warn" ? (
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--score-warn)]" />
                  ) : (
                    <XCircle size={14} className="mt-0.5 shrink-0 text-[var(--score-bad)]" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm text-foreground">{label}</span>
                    {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
                  </div>
                </div>
                <McPill
                  tone={status === "pass" ? "good" : status === "warn" ? "warn" : "bad"}
                >
                  {status === "pass" ? "Pass" : status === "warn" ? "Warn" : "Fail"}
                </McPill>
              </div>
            ))}
          </div>
        )}
      </McCard>
    </div>
  );
}
