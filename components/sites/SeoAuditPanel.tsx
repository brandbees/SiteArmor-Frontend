"use client";

/**
 * SEO audit panel — crawl-based findings for one site.
 *
 * Distinct from the homepage audit score, which comes from a single-page external scan.
 * This renders a full site crawl: every issue traced to a named page, tiered by whether
 * it can be fixed automatically, and ordered by the traffic actually at stake.
 *
 * The three tiers are the whole safety model, and the UI says so out loud:
 *   A — deterministic, applied on one click
 *   B — publishes generated text or changes what already ranks, so a person approves it
 *   C — editorial or commercial judgement, never automated at all
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, RefreshCw, AlertTriangle, ShieldCheck, Bot, ExternalLink,
  Wand2, Eye, Lock, Undo2, CheckCircle2, ChevronDown, ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { scoreHex } from "@/lib/utils";

interface Issue {
  id: string;
  rule_id: string;
  page_url: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  fix_tier: "A" | "B" | "C";
  current_value: string | null;
  proposed_value: string | null;
  evidence: { label?: string; note?: string; impact?: string; [k: string]: unknown } | null;
  impressions: number | null;
  position: number | null;
}

/**
 * One finding, however many pages it hits.
 *
 * "40 pages are missing a meta description" is one problem with 40 instances, not 40
 * problems. Listing it 40 times buries everything else on the site.
 */
interface IssueGroup {
  rule_id: string;
  severity: Issue["severity"];
  fix_tier: "A" | "B" | "C";
  affected_pages: number;
  impressions_at_stake: number;
  evidence: { label?: string; note?: string; [k: string]: unknown } | null;
  /** Capped server-side — a rule hitting 3,000 pages must not ship 3,000 rows. */
  pages: Array<{ id: string; page_url: string; current_value: string | null; impressions: number | null }>;
}

interface Crawl {
  id: string;
  status: string;
  pages_crawled: number;
  pages_limit: number;
  stop_reason: string | null;
  blocked_kind: string | null;
  finished_at: string | null;
}

interface AiReadiness {
  score: number | null;
  crawlers_blocked: string[];
  has_llms_txt: boolean | null;
  has_robots_txt: boolean | null;
  sitemap_found: boolean | null;
}

interface Fix {
  id: string;
  rule_id: string | null;
  page_url: string | null;
  method: string;
  before_value: string | null;
  after_value: string | null;
  applied_by: string;
  rolled_back: boolean;
  applied_at: string;
  evidence: { label?: string } | null;
}

interface PreviewDiff {
  page?: string;
  field?: string;
  before?: string | null;
  after?: string | null;
  note?: string | null;
  json_to_add?: string;
  values_sourced_from?: Record<string, string>;
}

interface Preview {
  tier?: string;
  method?: string;
  /** True when nothing could be generated and a person must supply the wording. */
  needs_value?: boolean;
  diff?: PreviewDiff;
}

const TIER_META = {
  A: { label: "Auto-fixable", cls: "bg-green-50 text-green-700 border-green-200" },
  B: { label: "Needs approval", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  C: { label: "Review only", cls: "bg-gray-50 text-gray-600 border-gray-200" },
} as const;

const SEVERITY_CLS: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  high: "bg-orange-50 text-orange-700",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-blue-50 text-blue-700",
  info: "bg-gray-50 text-gray-600",
};

export function SeoAuditPanel({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [groups, setGroups] = useState<IssueGroup[]>([]);
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [crawl, setCrawl] = useState<Crawl | null>(null);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [ai, setAi] = useState<AiReadiness | null>(null);
  const [pagesCrawled, setPagesCrawled] = useState(0);
  const [autoCrawl, setAutoCrawl] = useState(true);
  const [tierFilter, setTierFilter] = useState<"" | "A" | "B" | "C">("");

  const load = useCallback(async () => {
    try {
      const q = tierFilter ? `?tier=${tierFilter}` : "";
      const [issuesRes, groupedRes, crawlsRes, fixesRes] = await Promise.all([
        // /issues still carries the scores and AI readiness; /issues/grouped is the queue.
        api.get(`/seo/${siteId}/issues${q}`),
        api.get(`/seo/${siteId}/issues/grouped${q}`),
        api.get(`/seo/${siteId}/crawls`),
        api.get(`/seo/${siteId}/fixes`).catch(() => ({ data: { fixes: [] } })),
      ]);
      setGroups(groupedRes.data.groups ?? []);
      setSeoScore(issuesRes.data.seo_score ?? null);
      setAi(issuesRes.data.ai_readiness ?? null);
      setPagesCrawled(issuesRes.data.pages_crawled ?? 0);
      setAutoCrawl(issuesRes.data.auto_crawl !== false);
      setCrawl(crawlsRes.data.crawls?.[0] ?? null);
      setFixes(fixesRes.data.fixes ?? []);
    } catch {
      // A site that has never been crawled is the normal empty state, not an error.
      setCrawl(null);
    } finally {
      setLoading(false);
    }
  }, [siteId, tierFilter]);

  useEffect(() => { load(); }, [load]);

  async function startCrawl() {
    setCrawling(true);
    try {
      const { data } = await api.post(`/seo/${siteId}/crawl`);
      toast.success(`SEO crawl queued — up to ${data.page_limit} pages. This takes a few minutes.`);

      // Poll while it runs rather than making the user refresh to find out.
      const poll = setInterval(async () => {
        try {
          const res = await api.get(`/seo/${siteId}/crawls`);
          const latest = res.data.crawls?.[0];
          if (latest && latest.status !== "running") {
            clearInterval(poll);
            setCrawling(false);
            load();
            toast.success(`Crawl finished — ${latest.pages_crawled} pages.`);
          }
        } catch { /* transient; the next tick retries */ }
      }, 5000);
      setTimeout(() => { clearInterval(poll); setCrawling(false); }, 20 * 60 * 1000);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      toast.error(e?.response?.data?.error ?? "Could not start the crawl.");
      setCrawling(false);
    }
  }

  if (loading) return <div className="py-12"><LoadingSpinner /></div>;

  // ── Never crawled ─────────────────────────────────────────────────────────
  if (!crawl) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <Search size={20} className="text-blue-600" />
        </div>
        <p className="font-semibold text-foreground">No SEO crawl yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Crawl the site to find issues across every page — missing descriptions, broken
          pages, duplicate titles, missing structured data, and whether AI search engines
          can read it at all.
        </p>
        <button
          onClick={startCrawl}
          disabled={crawling}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {crawling ? "Crawling…" : "Run SEO crawl"}
        </button>
      </div>
    );
  }

  const blocked = crawl.stop_reason === "blocked";
  const truncated = crawl.stop_reason === "page_limit" || crawl.stop_reason === "time_limit";
  const activeFixes = fixes.filter(f => !f.rolled_back);
  const totalAffected = groups.reduce((n, g) => n + g.affected_pages, 0);

  return (
    <div className="space-y-4">
      {/* A blocked or truncated crawl must never read as a clean audit. */}
      {blocked && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">This site blocked our crawler</p>
            <p className="text-xs text-red-700 mt-1">
              Stopped after {crawl.pages_crawled} page{crawl.pages_crawled === 1 ? "" : "s"}
              {crawl.blocked_kind ? ` (${crawl.blocked_kind})` : ""}. These findings cover only
              what we reached — treat them as partial, not as a clean bill of health. Ask the
              host to allowlist our crawler for a complete audit.
            </p>
          </div>
        </div>
      )}
      {truncated && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Crawl stopped at the {crawl.stop_reason === "page_limit" ? "page limit" : "time limit"} —
          {" "}{crawl.pages_crawled} of {crawl.pages_limit} pages. Findings are partial; anything
          beyond that limit was not checked.
        </div>
      )}

      {/* Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard label="SEO score" value={seoScore} icon={<ShieldCheck size={12} />} />
        <ScoreCard label="AI readiness" value={ai?.score ?? null} icon={<Bot size={12} />} />
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pages crawled</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{pagesCrawled}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <button
              onClick={startCrawl}
              disabled={crawling}
              className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw size={11} className={crawling ? "animate-spin" : ""} />
              {crawling ? "Crawling…" : "Re-crawl"}
            </button>
            <AutoCrawlToggle siteId={siteId} value={autoCrawl} onChange={setAutoCrawl} />
          </div>
        </div>
      </div>

      {/* AI readiness detail — reported separately from the SEO score on purpose: a site
          can rank well and still be invisible to AI answer engines, and merging the two
          numbers would hide exactly that gap. */}
      {ai && (ai.crawlers_blocked?.length > 0 || ai.has_llms_txt === false || ai.sitemap_found === false) && (
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <Bot size={14} className="text-purple-600" /> AI search readiness
          </p>
          {ai.crawlers_blocked?.length > 0 && (
            <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-2">
              <strong>{ai.crawlers_blocked.join(", ")}</strong> {ai.crawlers_blocked.length === 1 ? "is" : "are"} blocked
              in robots.txt — these systems cannot read or cite this site at all. Often
              unintentional, inherited from a security plugin&apos;s defaults.
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Flag ok={ai.sitemap_found} label="XML sitemap" />
            <Flag ok={ai.has_robots_txt} label="robots.txt" />
            <Flag ok={ai.has_llms_txt} label="llms.txt" />
          </div>
        </div>
      )}

      {/* Issues */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            Issues{" "}
            <span className="text-muted-foreground font-normal">
              ({groups.length} finding{groups.length === 1 ? "" : "s"}
              {totalAffected > groups.length && ` · ${totalAffected} pages`})
            </span>
          </p>
          <div className="flex gap-1">
            {(["", "A", "B", "C"] as const).map(t => (
              <button
                key={t || "all"}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  tierFilter === t ? "bg-[var(--accent)] text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t === "" ? "All" : TIER_META[t].label}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {tierFilter ? "No issues in this tier." : "No open issues found in the last crawl."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {groups.map(g => <GroupRow key={g.rule_id} group={g} siteId={siteId} onChange={load} />)}
          </div>
        )}
      </div>

      {/* Applied fixes — the audit trail, and the only place rollback lives */}
      {activeFixes.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <p className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
            Applied fixes <span className="text-muted-foreground font-normal">({activeFixes.length})</span>
          </p>
          <div className="divide-y divide-border">
            {activeFixes.map(fix => <FixRow key={fix.id} fix={fix} onChange={load} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Scheduled re-crawls, on or off.
 *
 * Turning this off stops the weekly crawl only — the findings already collected stay, and
 * "Re-crawl" still works. A crawl is real load on a server the agency's client owns, so
 * the answer to "please stop hitting my site every week" has to be a switch, not a
 * support ticket.
 */
function AutoCrawlToggle({ siteId, value, onChange }: {
  siteId: string; value: boolean; onChange: (v: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !value;
    setBusy(true);
    try {
      await api.patch(`/seo/${siteId}/settings`, { auto_crawl: next });
      onChange(next);
      toast.success(next ? "Weekly crawls on." : "Weekly crawls off — manual crawls still work.");
    } catch {
      toast.error("Could not change the crawl schedule.");
    } finally { setBusy(false); }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={value
        ? "Crawled automatically once a week. Click to stop."
        : "Only crawled when you ask. Click to run weekly."}
      className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <span className={`w-7 h-4 rounded-full transition-colors relative shrink-0 ${value ? "bg-[var(--accent)]" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-3.5" : "left-0.5"}`} />
      </span>
      Weekly
    </button>
  );
}

function Flag({ ok, label }: { ok: boolean | null; label: string }) {
  if (ok == null) return <span>{label}: unknown</span>;
  return <span className={ok ? "text-green-700" : "text-amber-700"}>{ok ? "✓" : "✗"} {label}</span>;
}

function ScoreCard({ label, value, icon }: { label: string; value: number | null; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: value != null ? scoreHex(value) : "#9ca3af" }}>
        {value != null ? value : "—"}
      </p>
    </div>
  );
}

/**
 * One finding, collapsed. Expands to the pages it affects.
 *
 * Tier A gets a single "Fix all N pages" action — that is the point of grouping. Tier B
 * deliberately does not: approving forty pages of generated copy in one click is not
 * review, so each page is opened and approved on its own.
 */
function GroupRow({ group, siteId, onChange }: {
  group: IssueGroup; siteId: string; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const tier  = TIER_META[group.fix_tier];
  const label = group.evidence?.label ?? group.rule_id.replace(/_/g, " ");
  const many  = group.affected_pages > 1;
  const truncated = group.affected_pages > group.pages.length;

  async function fixAll() {
    setBusy(true);
    try {
      const { data } = await api.post(`/seo/${siteId}/apply-group`, { rule_id: group.rule_id });
      if (data.applied > 0) {
        toast.success(
          `Fixed ${data.applied} page${data.applied === 1 ? "" : "s"}` +
          (data.failed > 0 ? ` · ${data.failed} failed` : "")
        );
      } else {
        toast.error(data.details?.failed?.[0]?.detail ?? "Nothing could be applied.");
      }
      if (data.stopped_early) {
        toast.error("Stopped after repeated failures — check the SSH connection before retrying.");
      }
      onChange();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string; error?: string } } };
      toast.error(e?.response?.data?.detail ?? e?.response?.data?.error ?? "Could not apply these fixes.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
        <button onClick={() => setOpen(o => !o)} className="min-w-0 flex-1 text-left group">
          <div className="flex items-center gap-2 flex-wrap">
            {open ? <ChevronDown size={13} className="text-muted-foreground shrink-0" />
                  : <ChevronRight size={13} className="text-muted-foreground shrink-0" />}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_CLS[group.severity]}`}>
              {group.severity}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tier.cls}`}>
              {tier.label}
            </span>
            <span className="text-sm font-medium text-foreground group-hover:underline">{label}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1 ml-5 text-[11px] text-muted-foreground">
            <span className="tabular-nums font-medium">
              {group.affected_pages} page{many ? "s" : ""}
            </span>
            {group.impressions_at_stake > 0 && (
              <span className="tabular-nums">
                · {group.impressions_at_stake.toLocaleString()} impressions at stake
              </span>
            )}
          </div>
          {group.evidence?.note && (
            <p className="text-[11px] text-muted-foreground mt-1 ml-5">{group.evidence.note}</p>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {group.fix_tier === "C" ? (
            <span
              className="text-[11px] text-muted-foreground flex items-center gap-1 px-2 py-1"
              title="Needs editorial or commercial judgement — never applied automatically."
            >
              <Lock size={11} /> Manual
            </span>
          ) : group.fix_tier === "A" ? (
            <button
              onClick={fixAll}
              disabled={busy}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50 inline-flex items-center gap-1"
              style={{ background: "#16a34a" }}
            >
              <Wand2 size={11} /> {busy ? "Fixing…" : many ? `Fix all ${group.affected_pages}` : "Fix"}
            </button>
          ) : (
            <span className="text-[11px] text-amber-700 px-2 py-1">
              Approve each page
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="bg-muted/30 border-t border-border divide-y divide-border/60">
          {group.pages.map(p => (
            <IssueRow
              key={p.id}
              // Reconstructed from the group: severity, tier and rule are properties of
              // the finding, so every page in it shares them.
              issue={{
                id: p.id,
                rule_id: group.rule_id,
                page_url: p.page_url,
                severity: group.severity,
                fix_tier: group.fix_tier,
                current_value: p.current_value,
                proposed_value: null,
                evidence: group.evidence,
                impressions: p.impressions,
                position: null,
              }}
              onChange={onChange}
            />
          ))}
          {truncated && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground">
              Showing {group.pages.length} of {group.affected_pages} affected pages
              {group.fix_tier === "A" && " — “Fix all” covers the rest too."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, onChange }: { issue: Issue; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState("");
  const [notFixable, setNotFixable] = useState<string | null>(null);

  const tier = TIER_META[issue.fix_tier];
  const label = issue.evidence?.label ?? issue.rule_id.replace(/_/g, " ");

  async function showPreview() {
    setBusy(true);
    try {
      const { data } = await api.get(`/seo/issue/${issue.id}/preview`);
      if (data.ok === false) {
        setNotFixable(data.detail ?? "This finding has no automatic fix.");
        setPreview(null);
      } else {
        setPreview(data);
        setDraft(data.diff?.after ?? "");
        setNotFixable(null);
      }
      return data as Preview;
    } catch {
      toast.error("Could not build a preview for this issue.");
      return null;
    } finally { setBusy(false); }
  }

  /**
   * Tier B opens the preview first rather than applying straight away. Nothing generates
   * the wording for a meta description or a title — a rule can see that one is missing
   * without being able to write it — so a person has to type it before anything is
   * published under the client's domain.
   */
  async function onFixClick() {
    if (issue.fix_tier === "B") {
      const p = preview ?? await showPreview();
      if (p?.needs_value || !p?.diff?.after) return;   // wait for the text
    }
    apply(issue.fix_tier === "B", null);
  }

  async function apply(approved: boolean, value: string | null) {
    setBusy(true);
    try {
      await api.post(`/seo/issue/${issue.id}/apply`, { approved, ...(value ? { value } : {}) });
      toast.success("Fix applied to the site.");
      onChange();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string; error?: string; reason?: string } } };
      const d = e?.response?.data;
      // 412 means SSH is not usable — say what to do about it, not just that it failed.
      if (e?.response?.status === 412) {
        toast.error(d?.detail ?? "SSH is required to apply SEO fixes. Connect it in the SSH tab first.");
      } else {
        toast.error(d?.detail ?? d?.error ?? "Could not apply this fix.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_CLS[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tier.cls}`}>
              {tier.label}
            </span>
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>
          <a
            href={issue.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground truncate block mt-1 max-w-xl"
          >
            {issue.page_url} <ExternalLink size={9} className="inline" />
          </a>
          {issue.evidence?.note && (
            <p className="text-[11px] text-muted-foreground mt-1">{issue.evidence.note}</p>
          )}
          {issue.impressions != null && issue.impressions > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
              {issue.impressions.toLocaleString()} impressions
              {issue.position != null && ` · avg position ${Number(issue.position).toFixed(1)}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {issue.fix_tier === "C" ? (
            <span
              className="text-[11px] text-muted-foreground flex items-center gap-1 px-2 py-1"
              title="Needs editorial or commercial judgement — never applied automatically."
            >
              <Lock size={11} /> Manual
            </span>
          ) : (
            <>
              <button
                onClick={showPreview}
                disabled={busy}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Eye size={11} /> Preview
              </button>
              <button
                onClick={onFixClick}
                disabled={busy}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50 inline-flex items-center gap-1"
                style={{ background: issue.fix_tier === "A" ? "#16a34a" : "#d97706" }}
              >
                <Wand2 size={11} /> {issue.fix_tier === "A" ? "Fix" : "Review & fix"}
              </button>
            </>
          )}
        </div>
      </div>

      {notFixable && (
        <p className="mt-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{notFixable}</p>
      )}

      {preview?.diff && (
        <div className="mt-3 rounded-xl bg-muted/40 border border-border p-3 space-y-2">
          {preview.diff.json_to_add ? (
            <>
              <p className="text-[11px] font-semibold text-foreground">Structured data to add</p>
              <pre className="text-[11px] text-foreground whitespace-pre-wrap break-all max-h-56 overflow-auto bg-white rounded-lg p-2 border border-border">
                {preview.diff.json_to_add}
              </pre>
              {preview.diff.values_sourced_from && (
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold">Every value came from the page:</span>
                  <ul className="mt-0.5 space-y-0.5">
                    {Object.entries(preview.diff.values_sourced_from).map(([k, v]) => (
                      <li key={k}>· <code className="text-foreground">{k}</code> — {v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <DiffLine label="Now" value={preview.diff.before} empty="(empty)" />

              {issue.fix_tier === "B" ? (
                <>
                  {/* Editable, because nothing generates this text. The rule can see the
                      description is missing; it cannot write one. Publishing invented
                      copy under a client's domain is the user's call, in their words. */}
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Replacement text
                  </label>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder={preview.needs_value
                      ? "Type what should be published on this page…"
                      : undefined}
                    className="w-full text-[11px] rounded-lg border border-border bg-white p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {draft.trim().length} characters
                      {issue.rule_id.includes("description") && " · 70–160 recommended"}
                      {issue.rule_id.includes("title") && " · under 60 recommended"}
                    </span>
                    <button
                      onClick={() => apply(true, draft.trim())}
                      disabled={busy || draft.trim() === ""}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40"
                      style={{ background: "#d97706" }}
                    >
                      Publish this
                    </button>
                  </div>
                </>
              ) : (
                <DiffLine label="After" value={preview.diff.after} empty="(nothing to write — see below)" />
              )}

              {preview.diff.note && <p className="text-[11px] text-amber-700">{preview.diff.note}</p>}
            </>
          )}
          <button onClick={() => setPreview(null)} className="text-[11px] text-muted-foreground hover:underline">
            Hide preview
          </button>
        </div>
      )}
    </div>
  );
}

function DiffLine({ label, value, empty }: { label: string; value?: string | null; empty: string }) {
  // Generated files (llms.txt, robots.txt) come back as whole documents. Squeezing one
  // into an inline span would hide exactly what the user is being asked to approve.
  if (value && value.includes("\n")) {
    return (
      <div className="text-[11px]">
        <p className="font-semibold text-muted-foreground mb-1">{label}</p>
        <pre className="whitespace-pre-wrap break-all max-h-56 overflow-auto bg-white rounded-lg p-2 border border-border text-foreground">
          {value}
        </pre>
      </div>
    );
  }
  return (
    <div className="text-[11px]">
      <span className="font-semibold text-muted-foreground w-12 inline-block">{label}</span>
      <span className={value ? "text-foreground" : "text-muted-foreground italic"}>{value || empty}</span>
    </div>
  );
}

function FixRow({ fix, onChange }: { fix: Fix; onChange: () => void }) {
  const [busy, setBusy] = useState(false);

  async function rollback() {
    setBusy(true);
    try {
      await api.post(`/seo/fix/${fix.id}/rollback`);
      toast.success("Reverted on the site.");
      onChange();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; error?: string } } };
      toast.error(e?.response?.data?.detail ?? e?.response?.data?.error ?? "Could not roll this back.");
    } finally { setBusy(false); }
  }

  return (
    <div className="px-4 py-2.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-600 shrink-0" />
          {fix.evidence?.label ?? fix.rule_id?.replace(/_/g, " ") ?? fix.method}
          <span className="text-muted-foreground font-normal">
            · {fix.applied_by === "agent" ? "by agent" : "by you"}
          </span>
        </p>
        {fix.page_url && (
          <p className="text-[11px] text-muted-foreground truncate max-w-lg mt-0.5">{fix.page_url}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(fix.applied_at).toLocaleString()}
        </p>
      </div>
      <button
        onClick={rollback}
        disabled={busy}
        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
      >
        <Undo2 size={11} /> Undo
      </button>
    </div>
  );
}