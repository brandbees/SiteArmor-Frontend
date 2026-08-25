"use client";

import { useState, useRef, useEffect, Fragment, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, RefreshCw, ExternalLink, Trash2, Globe,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Shield, ShieldAlert, ShieldCheck, Package, ShoppingCart, Wifi, Key, Copy, Eye, EyeOff,
  Activity, TrendingUp, Clock, Zap, Server, Database, LayoutGrid,
  Bell, DollarSign, BarChart2, CalendarClock, HeartPulse, Search, AlertTriangle, Bot, Flame,
  Loader2, ToggleLeft, ToggleRight, Ban, ImageIcon, X, CalendarDays,
  HardDrive, RotateCcw, Download, ListTodo, MoreVertical,
} from "lucide-react";
import { useAuditStatus } from "@/hooks/useAuditStatus";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { UpgradeBanner } from "@/components/shared/UpgradeBanner";
import { McCard, McPill, McAlert, McSeverityChip, McSectionHeader, McTag, McIconBox } from "@/components/shared/MalCareUI";
import { SecurityTab } from "@/components/sites/tabs/SecurityTab";
import { PerformanceTab } from "@/components/sites/tabs/PerformanceTab";
import { SeoTab } from "@/components/sites/tabs/SeoTab";
import { UptimeTab } from "@/components/sites/tabs/UptimeTab";
import { MalwareTab } from "@/components/sites/tabs/MalwareTab";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { SSHSettingsPanel } from "@/components/sites/SSHSettingsPanel";
import { MalCareSiteOverview } from "@/components/sites/MalCareSiteOverview";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { AgentTab } from "@/components/sites/tabs/AgentTab";
import { useSiteContext } from "@/components/sites/SiteContext";
import { parseSiteTab, siteTabHref, SITE_TAB_LABELS, type SiteTab } from "@/components/sites/site-nav";
import { SiteLoadingOverlay } from "@/components/sites/SiteLoadingOverlay";
import { useSSHSettings } from "@/hooks/useSSHSettings";
import api from "@/lib/api";
import { timeAgo, scoreHex, cn } from "@/lib/utils";
import type { Site, Audit, ScanResult, Plugin as SitePlugin, CronEvent, SiteHealth, PluginVulnerability, WooFatalError, WooGateway } from "@/types";

// ── Tab type (site sidebar nav) ───────────────────────────────────────────────

type Tab = SiteTab;

// ── Shared helpers ────────────────────────────────────────────────────────────

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}



// ── Plugin data panel (collapsible) ──────────────────────────────────────────

function PluginDataPanel({ site }: { site: Site }) {
  const [open, setOpen] = useState(true);
  const pd = site.plugin_data;

  const serverRows = [
    { label: "WordPress", value: pd?.wp_version },
    { label: "PHP",       value: pd?.php_version },
    { label: "MySQL",     value: site.mysql_version },
    { label: "Server",    value: pd?.server_software },
    { label: "Memory",    value: site.memory_limit },
  ].filter((r) => r.value) as { label: string; value: string }[];

  const dbRows = [
    { label: "DB Size",         value: site.database_size_mb != null       ? `${site.database_size_mb} MB`         : null, warn: false },
    { label: "DB Tables",       value: site.database_table_count != null   ? String(site.database_table_count)     : null, warn: false },
    { label: "Autoloaded",      value: site.autoloaded_options_kb != null  ? `${site.autoloaded_options_kb} KB`    : null, warn: (site.autoloaded_options_kb ?? 0) > 800 },
    { label: "Transients",      value: site.transient_count != null        ? String(site.transient_count)          : null, warn: (site.transient_count ?? 0) > 100 },
    { label: "Post Revisions",  value: site.post_revisions_count != null   ? String(site.post_revisions_count)     : null, warn: (site.post_revisions_count ?? 0) > 500 },
    { label: "Orphaned Meta",   value: site.orphaned_post_meta_count != null ? String(site.orphaned_post_meta_count) : null, warn: (site.orphaned_post_meta_count ?? 0) > 0 },
  ].filter((r) => r.value !== null) as { label: string; value: string; warn: boolean }[];

  const contentRows = [
    { label: "Posts",    value: site.total_posts != null    ? String(site.total_posts)    : null },
    { label: "Pages",    value: site.total_pages != null    ? String(site.total_pages)    : null },
    { label: "Media",    value: site.total_media != null    ? String(site.total_media)    : null },
    { label: "Comments", value: site.total_comments != null ? String(site.total_comments) : null },
  ].filter((r) => r.value !== null) as { label: string; value: string }[];

  const metaRows = [
    { label: "Last published", value: site.last_published_at ? timeAgo(site.last_published_at) : null },
    { label: "Last sync",      value: pd?.last_sync ? timeAgo(pd.last_sync) : null },
  ].filter((r) => r.value !== null) as { label: string; value: string }[];

  const totalCount = serverRows.length + dbRows.length + contentRows.length + metaRows.length;
  const hasData = totalCount > 0;

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Server size={15} className="text-blue-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Server & Environment</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasData ? `${totalCount} data points collected` : "Connect plugin to collect server data"}
          </p>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !hasData && (
        <div className="border-t border-border px-5 py-8 flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Server size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No environment data yet</p>
          <p className="text-xs text-muted-foreground">Install and connect the plugin to collect<br />server, database, and content stats.</p>
        </div>
      )}

      {open && hasData && (
        <div className="border-t border-border divide-y divide-border">

          {/* Server rows */}
          {serverRows.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Server size={12} className="text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Server</p>
              </div>
              <div>
                {serverRows.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                    <span className="text-xs font-semibold text-foreground text-right ml-4 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database rows */}
          {dbRows.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Database size={12} className="text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Database</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {dbRows.map(({ label, value, warn }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0 sm:last:border-0">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-xs font-semibold tabular-nums ${warn ? "text-amber-500" : "text-foreground"}`}>
                      {value}
                      {warn && <AlertCircle size={11} className="inline ml-1 text-amber-400" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content stats */}
          {contentRows.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid size={12} className="text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {contentRows.map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-3 text-center">
                    <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          {metaRows.length > 0 && (
            <div className="px-5 py-3 flex items-center gap-6 flex-wrap bg-gray-50/60">
              {metaRows.map(({ label, value }) => (
                <span key={label} className="text-xs text-muted-foreground">
                  {label}: <span className="font-semibold text-foreground">{value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Issues Tab ────────────────────────────────────────────────────────────────

interface FixItem {
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  component: "security" | "malware" | "performance" | "seo";
  resolved: boolean;
}

const PRIORITY_ORDER_LIST = ["critical", "high", "medium", "low"] as const;

const EFFORT_TAG: Record<string, { label: string; tone: "good" | "warn" | "bad" }> = {
  low: { label: "Quick fix", tone: "good" },
  medium: { label: "Moderate", tone: "warn" },
  high: { label: "Complex", tone: "bad" },
};

const COMPONENT_TAG: Record<string, "purple" | "cyan" | "accent" | "pink"> = {
  security: "cyan",
  malware: "purple",
  performance: "accent",
  seo: "pink",
};

const PRIORITY_ICON: Record<string, typeof ShieldAlert> = {
  critical: ShieldAlert,
  high: Flame,
  medium: AlertCircle,
  low: AlertTriangle,
};

const PRIORITY_TONE: Record<string, "bad" | "warn" | "accent"> = {
  critical: "bad",
  high: "warn",
  medium: "warn",
  low: "accent",
};

function IssuesTab({ site, brandColor }: { site: Site; brandColor: string }) {
  const [fixes, setFixes]         = useState<FixItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [confirmFix, setConfirmFix] = useState<FixItem | null>(null);
  const [resolved, setResolved]   = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<{ fixes: FixItem[] }>(`/sites/${site.id}/fix-queue`)
      .then(({ data }) => setFixes(data.fixes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [site.id]);

  async function resolveFix(fix: FixItem) {
    setResolving(fix.title);
    try {
      await api.post(`/sites/${site.id}/fix-queue/resolve`, { title: fix.title });
      setResolved((prev) => new Set([...prev, fix.title]));
      toast.success("Fix marked as resolved");
    } catch {
      toast.error("Failed to mark fix as resolved");
    } finally {
      setResolving(null);
      setConfirmFix(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${brandColor}30`, borderTopColor: brandColor }} />
      </div>
    );
  }

  const activeFixes = fixes.filter((f) => !f.resolved && !resolved.has(f.title));
  const resolvedFixes = fixes.filter((f) => f.resolved || resolved.has(f.title));

  if (activeFixes.length === 0 && resolvedFixes.length === 0) {
    return (
      <McCard bodyClassName="py-12">
        <div className="flex flex-col items-center text-center">
          <McIconBox icon={<CheckCircle2 size={18} />} tone="good" size="lg" />
          <p className="mt-3 text-sm font-bold text-foreground">No issues found</p>
          <p className="mt-1 text-xs text-muted-foreground">Run an audit to check for issues</p>
        </div>
      </McCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* Confirmation modal */}
      {confirmFix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-[4px] border border-border bg-white p-6 shadow-elevated-lg">
            <div className="flex items-start gap-3">
              <McIconBox icon={<AlertTriangle size={17} />} tone="warn" size="md" />
              <div>
                <p className="text-sm font-bold text-foreground">Mark as resolved?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirm you have applied this fix before marking it resolved.
                </p>
              </div>
            </div>
            <div className="rounded-[4px] border border-border bg-[#f7f9fc] p-3">
              <p className="text-xs font-semibold text-foreground">{confirmFix.title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmFix(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => resolveFix(confirmFix)}
                disabled={resolving === confirmFix.title}
                loading={resolving === confirmFix.title}
              >
                Mark resolved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        {PRIORITY_ORDER_LIST.map((p) => {
          const count = activeFixes.filter((f) => f.priority === p).length;
          if (!count) return null;
          return <McSeverityChip key={p} severity={p} count={count} />;
        })}
        {activeFixes.length === 0 && (
          <McPill tone="good" icon={<CheckCircle2 size={11} />}>
            All issues resolved
          </McPill>
        )}
      </div>

      {/* Groups */}
      {PRIORITY_ORDER_LIST.map((priority) => {
        const group = activeFixes.filter((f) => f.priority === priority);
        if (!group.length) return null;
        const PIcon = PRIORITY_ICON[priority];
        const tone = PRIORITY_TONE[priority];
        return (
          <div key={priority} className="space-y-3">
            <McSectionHeader severity={priority} count={group.length} />
            <div className="space-y-2">
              {group.map((fix) => {
                const effort = EFFORT_TAG[fix.effort] ?? EFFORT_TAG.medium;
                const compTone = COMPONENT_TAG[fix.component] ?? "accent";
                return (
                  <div
                    key={fix.title}
                    className="rounded-[4px] border border-border bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)]"
                  >
                    <div className="flex items-start gap-3">
                      <McIconBox
                        icon={<PIcon size={16} strokeWidth={2.25} />}
                        tone={tone}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{fix.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {fix.description}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <McTag tone={effort.tone}>{effort.label}</McTag>
                          <McTag tone={compTone}>{fix.component}</McTag>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmFix(fix)}
                        disabled={!!resolving}
                      >
                        <CheckCircle2 size={12} />
                        Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Resolved section */}
      {resolvedFixes.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Resolved ({resolvedFixes.length})
          </p>
          <div className="space-y-2">
            {resolvedFixes.map((fix) => (
              <div
                key={fix.title}
                className="flex items-center gap-3 rounded-[4px] border border-border bg-white px-4 py-3 opacity-60"
              >
                <McIconBox icon={<CheckCircle2 size={14} />} tone="good" size="sm" />
                <p className="flex-1 text-sm text-foreground">{fix.title}</p>
                <McPill tone="good">Resolved</McPill>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plugins Tab ───────────────────────────────────────────────────────────────

// ── Plugin update button ──────────────────────────────────────────────────────

function PluginUpdateButton({ plugin, siteId, updatesEnabled, alreadyUpdated, onComplete, onSuccess }: {
  plugin: SitePlugin; siteId: string; updatesEnabled: boolean;
  alreadyUpdated?: boolean; onComplete?: () => void; onSuccess?: (slug: string) => void;
}) {
  const [state, setState] = useState<"idle" | "running" | "done" | "failed" | "rolled_back">("idle");

  // Show "Updated" if this session already updated this plugin
  if (alreadyUpdated || state === "done") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700"><CheckCircle2 size={9} />Updated</span>;
  }

  if (!plugin.update_available || !updatesEnabled) {
    return plugin.update_available ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
        <RefreshCw size={9} />Update → v{plugin.new_version || "?"}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
        <CheckCircle2 size={9} />Up to date
      </span>
    );
  }

  const actualSlug = plugin.slug ?? plugin.name.toLowerCase().replace(/\s+/g, "-");

  async function handleUpdate() {
    if (state === "running") return;
    setState("running");
    try {
      const { data: job } = await api.post(`/updates/${siteId}/run`, {
        slug: actualSlug,
        update_type: "plugin",
        new_version: plugin.new_version,
      });

      // Poll for result (plugin runs synchronously, backend updates DB when done — up to ~120s)
      let attempts = 0;
      while (attempts < 50) {
        await new Promise((r) => setTimeout(r, 3000));
        const { data: status } = await api.get(`/updates/${siteId}/${job.update_id}/status`);
        if (status.status === "success") { setState("done"); toast.success(`${plugin.name} updated successfully`); onSuccess?.(actualSlug); onComplete?.(); return; }
        if (status.status === "rolled_back") { setState("rolled_back"); toast.warning(`${plugin.name}: update rolled back — site health check failed`); onComplete?.(); return; }
        if (status.status === "failed") { setState("failed"); toast.error(`${plugin.name} update failed: ${status.health_error ?? "unknown error"}`); onComplete?.(); return; }
        attempts++;
      }
      setState("failed");
      toast.error("Update timed out");
      onComplete?.();
    } catch {
      setState("failed");
      toast.error("Failed to trigger update");
      onComplete?.();
    }
  }

  if (state === "rolled_back") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700"><AlertTriangle size={9} />Rolled back</span>;
  if (state === "failed") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600"><XCircle size={9} />Failed</span>;

  return (
    <button
      onClick={handleUpdate}
      disabled={state === "running"}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
    >
      {state === "running" ? <><Loader2 size={9} className="animate-spin" />Updating…</> : <><RefreshCw size={9} />Update → v{plugin.new_version || "?"}</>}
    </button>
  );
}

// ── Update history panel ──────────────────────────────────────────────────────

type HistoryRow = {
  id: string; slug: string; update_type: string; old_version: string | null;
  new_version: string | null; status: string; health_error: string | null;
  rolled_back_at: string | null; created_at: string; completed_at: string | null;
  screenshot_before_url: string | null; screenshot_after_url: string | null;
  diff_percentage: number | null;
};

function UpdateHistoryPanel({ siteId, externalRefreshKey }: { siteId: string; externalRefreshKey?: number }) {
  const [history, setHistory]     = useState<HistoryRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [screenshotRow, setScreenshotRow] = useState<HistoryRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function fetchHistory() {
      try {
        const { data } = await api.get(`/updates/${siteId}`);
        if (cancelled) return;
        const rows = data.history ?? [];
        setHistory(rows);
        setLoading(false);
        setRefreshing(false);
        const hasActive = rows.some((r: HistoryRow) =>
          r.status === "pending" || r.status === "running" || r.status === "pending_review"
        );
        if (hasActive) timer = setTimeout(fetchHistory, 4000);
      } catch {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }

    fetchHistory();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [siteId, refreshKey, externalRefreshKey]);

  const statusBadge = (s: string) => {
    if (s === "success")        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700"><CheckCircle2 size={9} />Success</span>;
    if (s === "rolled_back")    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700"><AlertTriangle size={9} />Rolled back</span>;
    if (s === "failed")         return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600"><XCircle size={9} />Failed</span>;
    if (s === "pending_review") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"><Eye size={9} />Pending Review</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"><Loader2 size={9} className="animate-spin" />Running</span>;
  };

  async function handleApprove(row: HistoryRow) {
    setActioning(row.id);
    try {
      await api.post(`/updates/${siteId}/${row.id}/approve`);
      toast.success(`${row.slug} update approved`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to approve update");
    } finally {
      setActioning(null);
    }
  }

  async function handleReject(row: HistoryRow) {
    setActioning(row.id);
    try {
      await api.post(`/updates/${siteId}/${row.id}/reject`);
      toast.success(`${row.slug} update rejected — rolling back`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to reject update");
    } finally {
      setActioning(null);
    }
  }

  if (loading) return <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      {/* Screenshot comparison modal */}
      {screenshotRow && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setScreenshotRow(null)}>
          <div className="bg-surface rounded-xl border border-border shadow-elevated-lg max-w-5xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Visual Comparison — {screenshotRow.slug}</p>
                {screenshotRow.diff_percentage != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pixel difference: <span className={`font-semibold ${screenshotRow.diff_percentage > 5 ? "text-amber-600" : "text-green-600"}`}>{screenshotRow.diff_percentage}%</span>
                  </p>
                )}
              </div>
              <button onClick={() => setScreenshotRow(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Before</p>
                {screenshotRow.screenshot_before_url
                  ? <img src={screenshotRow.screenshot_before_url} alt="Before" className="w-full rounded-lg border border-border object-top" />
                  : <div className="w-full h-48 rounded-lg border border-border bg-gray-50 flex items-center justify-center text-xs text-muted-foreground">No screenshot</div>
                }
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">After</p>
                {screenshotRow.screenshot_after_url
                  ? <img src={screenshotRow.screenshot_after_url} alt="After" className="w-full rounded-lg border border-border object-top" />
                  : <div className="w-full h-48 rounded-lg border border-border bg-gray-50 flex items-center justify-center text-xs text-muted-foreground">No screenshot</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button
          onClick={() => { setRefreshing(true); setRefreshKey((k) => k + 1); }}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No updates have been run yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                {["Plugin", "From → To", "Status", "Diff", "Date", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{u.slug}</td>
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{u.old_version ?? "?"} → {u.new_version ?? "?"}</td>
                  <td className="px-5 py-3">
                    {statusBadge(u.status)}
                    {u.health_error && <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={u.health_error}>{u.health_error}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {u.diff_percentage != null ? (
                      <button
                        onClick={() => setScreenshotRow(u)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors hover:opacity-80 ${u.diff_percentage > 5 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}
                      >
                        <ImageIcon size={9} />{u.diff_percentage}%
                      </button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    {u.status === "pending_review" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(u)}
                          disabled={actioning === u.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {actioning === u.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(u)}
                          disabled={actioning === u.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={10} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PluginTable({
  plugins, brandColor, showUpdateStatus, vulnMap, siteId, updatesEnabled, updatedSlugs,
  excluded, onUpdateComplete, onUpdateSuccess, onExclude, onUnexclude,
}: {
  plugins: SitePlugin[];
  brandColor: string;
  showUpdateStatus: boolean;
  vulnMap?: Map<string, PluginVulnerability>;
  siteId?: string;
  updatesEnabled?: boolean;
  updatedSlugs?: Set<string>;
  excluded?: string[];
  onUpdateComplete?: () => void;
  onUpdateSuccess?: (slug: string) => void;
  onExclude?: (slug: string) => void;
  onUnexclude?: (slug: string) => void;
}) {
  const sevColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-700";
      case "high":     return "bg-red-50 text-red-600";
      case "medium":   return "bg-amber-50 text-amber-700";
      default:         return "bg-yellow-50 text-yellow-700";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Plugin</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Version</th>
            {vulnMap && (
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Security</th>
            )}
            {showUpdateStatus && (
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Update</th>
            )}
            {updatesEnabled && (
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Exclude</th>
            )}
          </tr>
        </thead>
        <tbody>
          {plugins.map((plugin) => {
            const vuln = vulnMap ? vulnMap.get(plugin.name.toLowerCase()) : undefined;
            return (
              <tr key={plugin.name} className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: brandColor + "18", color: brandColor }}>
                      {plugin.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-mono text-muted-foreground">{plugin.version || "—"}</span>
                </td>
                {vulnMap && (
                  <td className="px-5 py-3">
                    {vuln ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${sevColor(vuln.severity)}`}>
                          <ShieldAlert size={9} />
                          {vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1)}
                        </span>
                        {vuln.cve_id && (
                          <span className="text-xs text-muted-foreground font-mono">{vuln.cve_id}</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        <ShieldCheck size={9} />
                        Clean
                      </span>
                    )}
                  </td>
                )}
                {showUpdateStatus && (
                  <td className="px-5 py-3">
                    {siteId
                      ? (() => {
                          const slug = plugin.slug ?? plugin.name.toLowerCase().replace(/\s+/g, "-");
                          return <PluginUpdateButton
                            plugin={plugin} siteId={siteId} updatesEnabled={updatesEnabled ?? false}
                            alreadyUpdated={updatedSlugs?.has(slug)}
                            onComplete={onUpdateComplete}
                            onSuccess={onUpdateSuccess}
                          />;
                        })()
                      : plugin.update_available
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"><RefreshCw size={9} />Update → v{plugin.new_version || "?"}</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700"><CheckCircle2 size={9} />Up to date</span>
                    }
                  </td>
                )}
                {updatesEnabled && (() => {
                  const slug = plugin.slug ?? plugin.name.toLowerCase().replace(/\s+/g, "-");
                  const isExcluded = excluded?.includes(slug);
                  return (
                    <td className="px-5 py-3">
                      {isExcluded ? (
                        <button
                          onClick={() => onUnexclude?.(slug)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Remove from exclusion list"
                        >
                          <Ban size={10} />Excluded
                        </button>
                      ) : (
                        <button
                          onClick={() => onExclude?.(slug)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                          title="Exclude from updates"
                        >
                          <Ban size={10} />Exclude
                        </button>
                      )}
                    </td>
                  );
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── BackupsTab ────────────────────────────────────────────────────────────────

type BackupRecord = {
  id: string;
  type: "db" | "files" | "full";
  status: "pending" | "running" | "completed" | "failed";
  size_mb: number | null;
  health_error: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
};

function BackupsTab({ site, brandColor, canUseAdvancedFeatures }: { site: Site; brandColor: string; canUseAdvancedFeatures?: boolean }) {
  const [backups, setBackups]           = useState<BackupRecord[]>([]);
  const [schedule, setSchedule]         = useState<string>("manual");
  const [loading, setLoading]           = useState(true);
  const [running, setRunning]           = useState(false);
  const [type, setType]                 = useState<"db" | "files" | "full">("full");
  const [savingSched, setSavingSched]   = useState(false);
  const [confirmRestore,   setConfirmRestore]   = useState<string | null>(null);
  const [confirmDelete,    setConfirmDelete]    = useState<string | null>(null);
  const [downloadLoading,  setDownloadLoading]  = useState<string | null>(null);
  const [restoreProgress, setRestoreProgress]  = useState<Record<string, {
    stage: string; progress: number; status: string;
  }>>({});
  const [preflight, setPreflight] = useState<{
    storage: { used_mb: number; limit_mb: number; remaining_mb: number; pct_used: number };
    last_backup: { size_mb: number; type: string; created_at: string } | null;
    warning: "low_storage" | "insufficient_storage" | null;
  } | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevBackupsRef = useRef<BackupRecord[]>([]);

  const fetchBackups = async () => {
    try {
      const { data } = await api.get(`/backups/${site.id}`);
      setBackups(data.backups ?? []);
      setSchedule(data.backup_schedule ?? "manual");
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBackups();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [site.id]);

  // Poll while any backup is pending/running
  useEffect(() => {
    const hasActive = backups.some(b => b.status === "pending" || b.status === "running");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchBackups, 4000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [backups]);

  // Toast on backup completion / failure
  useEffect(() => {
    const prev = prevBackupsRef.current;
    if (prev.length > 0) {
      for (const b of backups) {
        const p = prev.find(x => x.id === b.id);
        if (p && (p.status === "pending" || p.status === "running")) {
          if (b.status === "completed") {
            toast.success(`Backup completed${b.size_mb ? ` — ${b.size_mb} MB` : ""}`);
          } else if (b.status === "failed") {
            toast.error(`Backup failed${b.health_error ? `: ${b.health_error.slice(0, 120)}` : ""}`);
          }
        }
      }
    }
    prevBackupsRef.current = backups;
  }, [backups]);

  // Poll restore progress for any active restores
  useEffect(() => {
    const activeIds = Object.keys(restoreProgress).filter(
      id => !['completed', 'failed'].includes(restoreProgress[id].status)
    );
    if (activeIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const id of activeIds) {
        try {
          const { data } = await api.get<{
            restore_status: string; restore_progress: number; health_error: string | null;
          }>(`/backups/${site.id}/${id}/restore-status`);

          const s = data.restore_status ?? 'queued';
          setRestoreProgress(prev => ({ ...prev, [id]: { stage: s, progress: data.restore_progress ?? 0, status: s } }));

          if (s === 'completed') toast.success('Restore completed — site is back online');
          else if (s === 'failed') toast.error(`Restore failed${data.health_error ? `: ${data.health_error.slice(0, 120)}` : ''}`);
        } catch { /* silent — keep polling */ }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [restoreProgress, site.id]);

  const doRunBackup = async () => {
    setRunning(true);
    try {
      await api.post(`/backups/${site.id}/run`, { type });
      toast.success("Backup started");
      await fetchBackups();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to start backup");
    } finally {
      setRunning(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const { data } = await api.get(`/backups/${site.id}/preflight`);
      if (data.warning) {
        setPreflight(data);
        setRunning(false);
        return;
      }
    } catch {
      // preflight failed — proceed without blocking the user
    }
    await doRunBackup();
  };

  const handleSchedule = async (val: string) => {
    setSchedule(val);
    setSavingSched(true);
    try {
      await api.patch(`/backups/${site.id}/schedule`, { backup_schedule: val });
      toast.success("Backup schedule saved");
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSavingSched(false);
    }
  };

  const handleRestore = async (backup: BackupRecord) => {
    if (confirmRestore !== backup.id) { setConfirmRestore(backup.id); setConfirmDelete(null); return; }
    setConfirmRestore(null);
    try {
      await api.post(`/backups/${backup.id}/restore`);
      setRestoreProgress(prev => ({ ...prev, [backup.id]: { stage: 'queued', progress: 0, status: 'queued' } }));
      toast.success("Restore queued — progress shown below");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Restore failed");
    }
  };

  const handleDownload = async (backup: BackupRecord) => {
    setDownloadLoading(backup.id);
    try {
      const { data } = await api.get<{ url: string }>(`/backups/${backup.id}/download`);
      window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to generate download link");
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleDelete = async (backup: BackupRecord) => {
    if (confirmDelete !== backup.id) { setConfirmDelete(backup.id); setConfirmRestore(null); return; }
    setConfirmDelete(null);
    try {
      await api.delete(`/backups/${backup.id}`);
      toast.success("Backup deleted");
      setBackups(prev => prev.filter(b => b.id !== backup.id));
    } catch {
      toast.error("Failed to delete backup");
    }
  };

  const statusBadge = (status: BackupRecord["status"]) => {
    const map: Record<string, string> = {
      pending:   "bg-yellow-100 text-yellow-700",
      running:   "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed:    "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
        {status === "running" && <Loader2 size={10} className="animate-spin" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = { db: "bg-purple-100 text-purple-700", files: "bg-[var(--accent-light)] text-[var(--accent-hover)]", full: "bg-teal-100 text-teal-700" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[t] ?? ""}`}>{t.toUpperCase()}</span>;
  };

  if (!canUseAdvancedFeatures) {
    return (
      <div className="bg-surface rounded-xl border border-border flex flex-col items-center justify-center py-16 gap-4 text-center px-8 transition-all duration-base">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <HardDrive size={22} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Backups &amp; Restores</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] mx-auto">
            Automated backups, one-click restores, and retention management are available on the Growth plan and above.
          </p>
        </div>
        <UpgradeBanner message="Upgrade to Growth or Agency+ to unlock Backups & Restores." compact />
      </div>
    );
  }

  if (!site.plugin_connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
        <HardDrive size={40} strokeWidth={1} />
        <p className="text-sm">Plugin not connected — backups require the Site Armor plugin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Storage pre-flight warning modal */}
      {preflight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl border border-border shadow-elevated-lg w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${preflight.warning === "insufficient_storage" ? "bg-red-50" : "bg-amber-50"}`}>
                <HardDrive size={18} className={preflight.warning === "insufficient_storage" ? "text-red-500" : "text-amber-500"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {preflight.warning === "insufficient_storage" ? "Insufficient Backup Storage" : "Low Backup Storage"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {preflight.warning === "insufficient_storage"
                    ? "This backup may exceed your remaining storage quota."
                    : "You're running low on backup storage — this backup may not complete."}
                </p>
              </div>
            </div>

            {/* Storage bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: <strong className="text-gray-700">{preflight.storage.used_mb.toFixed(0)} MB</strong></span>
                <span>Limit: <strong className="text-gray-700">{(preflight.storage.limit_mb / 1024).toFixed(0)} GB</strong></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${preflight.storage.pct_used >= 90 ? "bg-red-500" : "bg-amber-400"}`}
                  style={{ width: `${preflight.storage.pct_used}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {preflight.storage.remaining_mb.toFixed(0)} MB remaining ({preflight.storage.pct_used}% used)
              </p>
            </div>

            {preflight.last_backup && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                Last backup was <strong>{preflight.last_backup.size_mb} MB</strong> — estimated size for this run.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPreflight(null)}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              {preflight.warning === "low_storage" && (
                <button
                  onClick={() => { setPreflight(null); doRunBackup(); }}
                  className="flex-1 text-sm px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: brandColor }}
                >
                  Proceed Anyway
                </button>
              )}
            </div>
            {preflight.warning === "insufficient_storage" && (
              <p className="text-xs text-center text-gray-400">
                Delete old backups to free space, or upgrade your plan to continue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Schedule */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Backup Schedule</label>
          <div className="flex items-center gap-2">
            <select
              value={schedule}
              onChange={e => handleSchedule(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
            >
              <option value="manual">Manual only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {savingSched && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
        </div>

        {/* Type selector + run */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Backup Type</label>
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value as "db" | "files" | "full")}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
            >
              <option value="full">Full (DB + Files)</option>
              <option value="db">Database only</option>
              <option value="files">Files only</option>
            </select>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={running}
              style={{ backgroundColor: brandColor }}
              className="text-white"
            >
              {running ? <Loader2 size={13} className="animate-spin mr-1" /> : <HardDrive size={13} className="mr-1" />}
              Run Backup
            </Button>
          </div>
        </div>
      </div>

      {/* Backup history table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <HardDrive size={14} style={{ color: brandColor }} />
            Backup History
          </h3>
          <span className="text-xs text-gray-400">{backups.length} backup{backups.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
            <HardDrive size={36} strokeWidth={1} />
            <p className="text-sm">No backups yet — run your first backup above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Expires</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {backups.map(backup => (
                <tr key={backup.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">{typeBadge(backup.type)}</td>
                  <td className="px-4 py-3">
                    {statusBadge(backup.status)}
                    {backup.health_error && backup.status === "failed" && (
                      <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate" title={backup.health_error}>
                        {backup.health_error}
                      </p>
                    )}
                    {/* Live restore progress */}
                    {(() => {
                      const rp = restoreProgress[backup.id];
                      if (!rp) return null;
                      const stageLabel: Record<string, string> = {
                        queued: "Queued…", downloading: "Downloading backup",
                        extracting_db: "Restoring database", extracting_files: "Extracting files",
                        completed: "Restored", failed: "Restore failed",
                      };
                      const label = stageLabel[rp.stage] ?? rp.stage;
                      if (rp.status === 'completed') {
                        return <p className="text-xs text-green-600 font-medium mt-1">Restore complete</p>;
                      }
                      if (rp.status === 'failed') {
                        return <p className="text-xs text-red-500 mt-1">Restore failed</p>;
                      }
                      return (
                        <div className="mt-1.5 w-36">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                            <span className="truncate">{label}</span>
                            <span className="ml-1 shrink-0">{rp.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${rp.progress}%`, backgroundColor: brandColor }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {backup.size_mb != null ? `${backup.size_mb} MB` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(backup.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {backup.expires_at ? new Date(backup.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {backup.status === "completed" && (
                        <>
                          {/* Normal restore — via WP plugin (requires WordPress to be working) */}
                          <button
                            onClick={() => handleRestore(backup)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              confirmRestore === backup.id
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "text-orange-500 hover:bg-orange-50"
                            }`}
                          >
                            <RotateCcw size={11} />
                            {confirmRestore === backup.id ? "Confirm?" : "Restore"}
                          </button>

                          {/* Download — get the zip directly from R2 for manual restore */}
                          <button
                            onClick={() => handleDownload(backup)}
                            disabled={downloadLoading === backup.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                          >
                            {downloadLoading === backup.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Download size={11} />}
                            Download
                          </button>
                        </>
                      )}
                      {(backup.status === "completed" || backup.status === "failed") && (
                        <button
                          onClick={() => handleDelete(backup)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            confirmDelete === backup.id
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "text-red-400 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 size={11} />
                          {confirmDelete === backup.id ? "Confirm?" : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PluginsTab({ site, audits, brandColor, onSiteRefetch, canUseAdvancedFeatures }: { site: Site; audits: Audit[]; brandColor: string; onSiteRefetch?: () => void; canUseAdvancedFeatures?: boolean }) {
  const allPlugins        = site.plugin_data?.plugins ?? [];
  const activePlugins     = allPlugins.filter((p) => p.status === "active");
  const inactPlugins      = allPlugins.filter((p) => p.status === "inactive");
  const activeNeedsUpdate = activePlugins.filter((p) => p.update_available).length;
  const inactNeedsUpdate  = inactPlugins.filter((p) => p.update_available).length;
  const outdated12m       = site.plugins_outdated_12m ?? [];

  const latestAudit    = audits.find((a) => a.status === "completed");
  const pluginVulns    = latestAudit?.security_data?.plugin_vulnerabilities ?? [];
  const vulnMap        = new Map<string, PluginVulnerability>(
    pluginVulns.map((v) => [v.plugin_name.toLowerCase(), v])
  );

  const [updatesEnabled, setUpdatesEnabled] = useState<boolean>(site.updates_enabled ?? false);
  const [togglingUpdates, setTogglingUpdates] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [updatingAll, setUpdatingAll] = useState<"active" | "inactive" | null>(null);
  const [updatedSlugs, setUpdatedSlugs] = useState<Set<string>>(new Set());

  // Agency-level update settings
  const [visualReview,  setVisualReview]  = useState(false);
  const [updatesPaused, setUpdatesPaused] = useState(false);
  const [togglingReview, setTogglingReview] = useState(false);
  const [resumingKillSwitch, setResumingKillSwitch] = useState(false);

  // Scheduled window
  const [windowDay,    setWindowDay]    = useState<number | null>(site.update_window_day  ?? null);
  const [windowHour,   setWindowHour]   = useState<number | null>(site.update_window_hour ?? null);
  const [savingWindow, setSavingWindow] = useState(false);

  // Exclusions
  const [excluded,       setExcluded]       = useState<string[]>(site.excluded_from_updates ?? []);
  const [excludingSlug,  setExcludingSlug]  = useState<string | null>(null);

  // Load agency update settings on mount
  useEffect(() => {
    api.get("/settings/updates").then(({ data }) => {
      setVisualReview(data.visual_review ?? false);
      setUpdatesPaused(data.updates_paused ?? false);
    }).catch(() => {});
  }, []);

  const bumpHistory = () => setHistoryVersion((v) => v + 1);
  const markUpdated = (slug: string) => {
    setUpdatedSlugs((prev) => new Set([...prev, slug]));
    onSiteRefetch?.();
  };

  async function toggleUpdates() {
    setTogglingUpdates(true);
    try {
      await api.patch(`/updates/${site.id}/toggle`, { enabled: !updatesEnabled });
      setUpdatesEnabled((v) => !v);
      toast.success(updatesEnabled ? "Safe updates disabled" : "Safe updates enabled");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setTogglingUpdates(false);
    }
  }

  async function toggleVisualReview() {
    setTogglingReview(true);
    try {
      await api.put("/settings/updates", { visual_review: !visualReview });
      setVisualReview((v) => !v);
      toast.success(!visualReview ? "Manual review enabled — updates with >5% visual diff will require approval" : "Manual review disabled");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setTogglingReview(false);
    }
  }

  async function resumeUpdates() {
    setResumingKillSwitch(true);
    try {
      await api.put("/settings/updates", { updates_paused: false });
      setUpdatesPaused(false);
      toast.success("Scheduled updates resumed");
    } catch {
      toast.error("Failed to resume updates");
    } finally {
      setResumingKillSwitch(false);
    }
  }

  async function saveUpdateWindow() {
    setSavingWindow(true);
    try {
      await api.patch(`/settings/sites/${site.id}/update-window`, {
        update_window_day:  windowDay,
        update_window_hour: windowHour,
      });
      toast.success(windowDay !== null ? "Update window saved" : "Update window cleared");
    } catch {
      toast.error("Failed to save update window");
    } finally {
      setSavingWindow(false);
    }
  }

  async function handleExclude(slug: string) {
    setExcludingSlug(slug);
    try {
      await api.post(`/updates/${site.id}/exclude`, { slug });
      setExcluded((prev) => [...prev, slug]);
      toast.success(`${slug} excluded from updates`);
    } catch {
      toast.error("Failed to exclude plugin");
    } finally {
      setExcludingSlug(null);
    }
  }

  async function handleUnexclude(slug: string) {
    setExcludingSlug(slug);
    try {
      await api.delete(`/updates/${site.id}/exclude/${encodeURIComponent(slug)}`);
      setExcluded((prev) => prev.filter((s) => s !== slug));
      toast.success(`${slug} removed from exclusion list`);
    } catch {
      toast.error("Failed to remove exclusion");
    } finally {
      setExcludingSlug(null);
    }
  }

  async function handleUpdateAll(group: "active" | "inactive") {
    const plugins = group === "active" ? activePlugins : inactPlugins;
    const toUpdate = plugins.filter((p) => p.update_available && (p.slug || p.name));
    if (!toUpdate.length || updatingAll) return;
    setUpdatingAll(group);
    let succeeded = 0, failed = 0;
    for (const plugin of toUpdate) {
      try {
        const { data: job } = await api.post(`/updates/${site.id}/run`, {
          slug: plugin.slug ?? plugin.name.toLowerCase().replace(/\s+/g, "-"),
          update_type: "plugin",
          new_version: plugin.new_version,
        });
        let done = false;
        for (let i = 0; i < 50 && !done; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const { data: st } = await api.get(`/updates/${site.id}/${job.update_id}/status`);
          if (["success", "failed", "rolled_back"].includes(st.status)) {
            done = true;
            if (st.status === "success") {
              succeeded++;
              markUpdated(plugin.slug ?? plugin.name.toLowerCase().replace(/\s+/g, "-"));
            } else { failed++; }
          }
        }
        if (!done) failed++;
      } catch { failed++; }
    }
    setUpdatingAll(null);
    bumpHistory();
    if (failed === 0) toast.success(`All ${succeeded} plugin${succeeded !== 1 ? "s" : ""} updated successfully`);
    else toast.warning(`${succeeded} succeeded, ${failed} failed`);
  }

  if (allPlugins.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border flex flex-col items-center justify-center py-16 gap-3 transition-all duration-base">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Package size={24} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">No plugin data</p>
          <p className="text-xs text-muted-foreground mt-1">
            {site.plugin_connected
              ? "Data will appear after the next plugin sync"
              : "Connect the WordPress plugin to view installed plugins"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Manage Updates — MalCare dense header */}
      <McCard
        title="Manage Updates"
        icon={<Package size={15} />}
        action={
          <div className="flex items-center gap-2">
            {(activeNeedsUpdate + inactNeedsUpdate) > 0 && (
              <McPill tone="accent">
                {activeNeedsUpdate + inactNeedsUpdate} Update
                {activeNeedsUpdate + inactNeedsUpdate === 1 ? "" : "s"}
              </McPill>
            )}
          </div>
        }
      >
        <p className="text-xs text-muted-foreground">
          Review plugin updates, risk signals, and safe one-click updates for this site.
        </p>
      </McCard>

      {/* ── Kill switch paused banner ── */}
      {updatesPaused && (
        <McAlert variant="error" title="Scheduled updates paused">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <span>
              The portfolio kill switch fired because the update failure rate exceeded 5% in the
              last 24 hours. Review recent update history before resuming.
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={resumeUpdates}
              disabled={resumingKillSwitch}
              loading={resumingKillSwitch}
              className="shrink-0"
            >
              Resume Updates
            </Button>
          </div>
        </McAlert>
      )}

      {/* ── Safe Updates settings card ── */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-5 transition-all duration-base">
        {!canUseAdvancedFeatures ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Safe Updates</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                One-click plugin updates with automatic rollback protection.
              </p>
            </div>
            <UpgradeBanner message="Safe plugin updates with auto-rollback require the Growth plan or above." compact />
          </div>
        ) : (
        <>
        {/* Enable / disable toggle row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Safe Updates</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {updatesEnabled
                ? "Updates are enabled — one-click plugin updates with auto-rollback protection."
                : "Enable to allow one-click plugin updates with automatic rollback if the health check fails."}
            </p>
          </div>
          <button
            onClick={toggleUpdates}
            disabled={togglingUpdates}
            className="flex items-center gap-2 text-sm font-semibold shrink-0 disabled:opacity-50 transition-colors"
            style={{ color: updatesEnabled ? "#10b981" : "#9ca3af" }}
          >
            {togglingUpdates ? <Loader2 size={22} className="animate-spin" /> : updatesEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            {updatesEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {updatesEnabled && (
          <>
            <div className="border-t border-border" />

            {/* Visual review toggle row */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Manual Review Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hold updates for approval when the before/after screenshot diff exceeds 5%.
                </p>
              </div>
              <button
                onClick={toggleVisualReview}
                disabled={togglingReview}
                className="flex items-center gap-2 text-sm font-semibold shrink-0 disabled:opacity-50 transition-colors"
                style={{ color: visualReview ? "#1f5fb8" : "#9ca3af" }}
              >
                {togglingReview ? <Loader2 size={22} className="animate-spin" /> : visualReview ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                {visualReview ? "On" : "Off"}
              </button>
            </div>

            <div className="border-t border-border" />

            {/* Scheduled update window */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Scheduled Update Window</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Automatically run pending updates at a specific day and hour (UTC). Leave blank to disable scheduling.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={windowDay ?? ""}
                  onChange={(e) => setWindowDay(e.target.value === "" ? null : Number(e.target.value))}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No schedule</option>
                  {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
                <select
                  value={windowHour ?? ""}
                  onChange={(e) => setWindowHour(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={windowDay === null}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                >
                  <option value="">Select hour (UTC)</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00 UTC</option>
                  ))}
                </select>
                <button
                  onClick={saveUpdateWindow}
                  disabled={savingWindow}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {savingWindow ? <Loader2 size={11} className="animate-spin" /> : null}
                  Save
                </button>
                {(windowDay !== null) && (
                  <button
                    onClick={() => { setWindowDay(null); setWindowHour(null); }}
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        </>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { label: "Total Plugins",  value: allPlugins.length,                      color: brandColor,  icon: <Package size={15} /> },
          { label: "Active",         value: activePlugins.length,                   color: "#10b981",   icon: <CheckCircle2 size={15} /> },
          { label: "Inactive",       value: inactPlugins.length,                    color: "#1f5fb8",   icon: <Package size={15} /> },
          { label: "Need Updates",   value: activeNeedsUpdate + inactNeedsUpdate,   color: "#f59e0b",   icon: <RefreshCw size={15} /> },
          { label: "Abandoned",      value: outdated12m.length,                     color: "#f97316",   icon: <AlertTriangle size={15} /> },
          { label: "Vulnerable",     value: pluginVulns.length,                     color: "#ef4444",   icon: <ShieldAlert size={15} /> },
        ] as { label: string; value: number; color: string; icon: React.ReactNode }[]).map(({ label, value, color, icon }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3 transition-all duration-base">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color + "18", color }}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Plugins ── */}
      {activePlugins.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Active Plugins</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{activePlugins.length} plugins running</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeNeedsUpdate > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {activeNeedsUpdate} update{activeNeedsUpdate !== 1 ? "s" : ""} available
                </span>
              )}
              {activeNeedsUpdate > 0 && updatesEnabled && (
                <button
                  onClick={() => handleUpdateAll("active")}
                  disabled={updatingAll !== null}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {updatingAll === "active" ? <><Loader2 size={11} className="animate-spin" />Updating…</> : <><RefreshCw size={11} />Update All</>}
                </button>
              )}
            </div>
          </div>
          <PluginTable plugins={activePlugins} brandColor={brandColor} showUpdateStatus vulnMap={vulnMap} siteId={site.id} updatesEnabled={updatesEnabled} updatedSlugs={updatedSlugs} excluded={excluded} onUpdateComplete={bumpHistory} onUpdateSuccess={markUpdated} onExclude={handleExclude} onUnexclude={handleUnexclude} />
        </div>
      )}

      {/* ── Inactive Plugins ── */}
      {inactPlugins.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Inactive Plugins</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{inactPlugins.length} installed but not active</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {inactNeedsUpdate > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {inactNeedsUpdate} update{inactNeedsUpdate !== 1 ? "s" : ""} available
                </span>
              )}
              {inactNeedsUpdate > 0 && updatesEnabled && (
                <button
                  onClick={() => handleUpdateAll("inactive")}
                  disabled={updatingAll !== null}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {updatingAll === "inactive" ? <><Loader2 size={11} className="animate-spin" />Updating…</> : <><RefreshCw size={11} />Update All</>}
                </button>
              )}
            </div>
          </div>
          <PluginTable plugins={inactPlugins} brandColor="#1f5fb8" showUpdateStatus={true} vulnMap={vulnMap} siteId={site.id} updatesEnabled={updatesEnabled} updatedSlugs={updatedSlugs} excluded={excluded} onUpdateComplete={bumpHistory} onUpdateSuccess={markUpdated} onExclude={handleExclude} onUnexclude={handleUnexclude} />
        </div>
      )}

      {/* ── Abandoned Plugins ── */}
      {outdated12m.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Abandoned Plugins</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Not updated in 12+ months — potential security risk</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              {outdated12m.length} plugin{outdated12m.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  {["Plugin", "Version", "Last Updated"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outdated12m.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-red-50 text-red-500">
                          {p.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono text-muted-foreground">{p.version || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold text-red-600">{p.last_updated || "Unknown"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Update History ── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Update History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All plugin updates run from this dashboard</p>
        </div>
        <div className="p-5">
          <UpdateHistoryPanel siteId={site.id} externalRefreshKey={historyVersion} />
        </div>
      </div>

    </div>
  );
}

// ── WooCommerce Tab ───────────────────────────────────────────────────────────

function WooCommerceTab({ site, audits, brandColor }: { site: Site; audits: Audit[]; brandColor: string }) {
  void brandColor;
  const hasWoo       = site.woocommerce_active ?? false;
  const orderCount   = site.woo_order_count;
  const revenue      = site.woo_revenue;
  const fatalErrors: WooFatalError[] = site.woo_fatal_errors ?? [];
  const gateways: WooGateway[]       = site.woo_active_gateways ?? [];

  const fmt = (v: number | null | undefined) =>
    v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const revenueStr = fmt(revenue);

  const hasExtended = site.woo_orders_7d != null || site.woo_orders_30d != null;

  const wooNarrative = audits?.find(a => a.status === "completed")?.ai_narrative?.woocommerce;

  return (
    <div className="space-y-4">
      <McCard
        title={hasWoo ? "WooCommerce is active" : "WooCommerce not detected"}
        icon={<ShoppingCart size={15} />}
        action={hasWoo ? <McPill tone="accent">Active</McPill> : <McPill tone="neutral">Inactive</McPill>}
      >
        <p className="text-xs text-muted-foreground">
          {hasWoo
            ? "Store data is being collected from your WooCommerce installation."
            : "No WooCommerce installation found. Connect the plugin to enable store tracking."}
        </p>
      </McCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            {
              label: "Total Orders",
              value: orderCount != null ? orderCount.toLocaleString() : "—",
              sub: "All time",
              icon: <ShoppingCart size={14} className="text-accent" />,
            },
            {
              label: "Total Revenue",
              value: revenueStr,
              sub: "All time",
              icon: <DollarSign size={14} className="text-[var(--score-good)]" />,
            },
            {
              label: "Avg Order Value",
              value:
                orderCount && revenue
                  ? `$${(Number(revenue) / orderCount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "—",
              sub: "Per order",
              icon: <TrendingUp size={14} className="text-[var(--score-warn)]" />,
            },
            {
              label: "Store Status",
              value: hasWoo ? "Running" : "Inactive",
              sub: hasWoo ? "WooCommerce detected" : "No store found",
              icon: <Package size={14} className={hasWoo ? "text-accent" : "text-muted-foreground"} />,
            },
          ] as const
        ).map(({ label, value, sub, icon }) => (
          <div key={label} className="rounded-[4px] border border-border bg-white p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#f0f2f5]">
                {icon}
              </span>
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── WooCommerce Fatal Errors ── */}
      {hasWoo && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fatal Errors (last 24h)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">PHP fatal errors from WooCommerce logs</p>
            </div>
            {fatalErrors.length > 0 ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                {fatalErrors.length} error{fatalErrors.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">Clean</span>
            )}
          </div>
          {fatalErrors.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">No fatal errors detected in the last 24 hours.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {fatalErrors.map((err: WooFatalError, i: number) => (
                <div key={i} className="px-5 py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-red-600 truncate">{err.error_type || "Fatal Error"}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(err.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-mono break-all leading-relaxed">{err.message}</p>
                  {err.file && (
                    <p className="text-[10px] text-muted-foreground truncate">{err.file}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Store Insight ── */}
      {hasWoo && wooNarrative && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: brandColor + "18" }}>
              <Bot size={14} style={{ color: brandColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Store Insight</p>
              <p className="text-[11px] text-muted-foreground">Generated after last audit</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-foreground leading-relaxed">{wooNarrative}</p>
          </div>
        </div>
      )}

      {/* ── Extended analytics ── */}
      {hasWoo && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Extended Analytics</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Windowed order and revenue metrics</p>
            </div>
            {!hasExtended && (
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: brandColor + "18", color: brandColor }}>
                Awaiting data
              </span>
            )}
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Orders 7d */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: brandColor + "18" }}>
                  <ShoppingCart size={15} style={{ color: brandColor }} />
                </div>
                <p className="text-xs font-semibold text-foreground">Orders (7 days)</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {site.woo_orders_7d != null ? site.woo_orders_7d.toLocaleString() : "—"}
              </p>
            </div>

            {/* Orders 30d */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                  <BarChart2 size={15} className="text-[var(--accent)]" />
                </div>
                <p className="text-xs font-semibold text-foreground">Orders (30 days)</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {site.woo_orders_30d != null ? site.woo_orders_30d.toLocaleString() : "—"}
              </p>
            </div>

            {/* Revenue 7d */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <TrendingUp size={15} className="text-green-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">Revenue (7 days)</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(site.woo_revenue_7d)}</p>
            </div>

            {/* Revenue 30d */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <DollarSign size={15} className="text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">Revenue (30 days)</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(site.woo_revenue_30d)}</p>
            </div>

            {/* Failed / Cancelled */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle size={15} className="text-red-500" />
                </div>
                <p className="text-xs font-semibold text-foreground">Failed / Cancelled (30d)</p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${(site.woo_failed_orders ?? 0) > 0 ? "text-red-600" : "text-foreground"}`}>
                {site.woo_failed_orders != null ? site.woo_failed_orders.toLocaleString() : "—"}
              </p>
            </div>

            {/* Active Gateways */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-gray-50/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} className="text-cyan-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">Payment Gateways</p>
              </div>
              {gateways.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {gateways.map((gw) => (
                    <span key={gw.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                      {gw.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold tabular-nums text-foreground">—</p>
              )}
            </div>

          </div>
          {!hasExtended && (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-dashed border-border bg-gray-50/60 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Update the Site Armor plugin to the latest version to start sending windowed order and revenue metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cron Tab ──────────────────────────────────────────────────────────────────

type CronFilter = "all" | "wp-cron" | "action-scheduler" | "pending" | "running" | "complete" | "failed" | "canceled";

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  running:   "bg-blue-50 text-blue-700 border-blue-200",
  complete:  "bg-green-50 text-green-700 border-green-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  canceled:  "bg-gray-100 text-gray-500 border-gray-200",
  due:       "bg-purple-50 text-purple-700 border-purple-200",
};

function cronStatusBadge(status: string) {
  const cls = STATUS_COLOR[status.toLowerCase()] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

function CronTab({ site, brandColor }: { site: Site; brandColor: string }) {
  const events: CronEvent[] = site.cron_events ?? [];
  const [filter, setFilter] = useState<CronFilter>("all");
  const [search, setSearch] = useState("");

  const wpCount   = events.filter((e) => e.source === "wp-cron").length;
  const asCount   = events.filter((e) => e.source === "action-scheduler").length;
  const failedCnt = events.filter((e) => e.status.toLowerCase() === "failed").length;

  const now = Date.now();
  const dueCnt = events.filter((e) => {
    if (e.source !== "wp-cron" || !e.next_run) return false;
    return new Date(e.next_run).getTime() <= now;
  }).length;

  const FILTER_TABS: { key: CronFilter; label: string; count?: number }[] = [
    { key: "all",              label: "All",              count: events.length },
    { key: "wp-cron",          label: "WP Cron",          count: wpCount },
    { key: "action-scheduler", label: "Action Scheduler", count: asCount },
    { key: "pending",          label: "Pending",          count: events.filter((e) => e.status.toLowerCase() === "pending").length },
    { key: "running",          label: "Running",          count: events.filter((e) => e.status.toLowerCase() === "running").length },
    { key: "complete",         label: "Complete",         count: events.filter((e) => ["complete","completed"].includes(e.status.toLowerCase())).length },
    { key: "failed",           label: "Failed",           count: failedCnt },
    { key: "canceled",         label: "Canceled",         count: events.filter((e) => e.status.toLowerCase() === "canceled").length },
  ];

  const filtered = events.filter((e) => {
    if (filter === "wp-cron")          return e.source === "wp-cron";
    if (filter === "action-scheduler") return e.source === "action-scheduler";
    if (filter === "pending")          return e.status.toLowerCase() === "pending";
    if (filter === "running")          return e.status.toLowerCase() === "running";
    if (filter === "complete")         return ["complete","completed"].includes(e.status.toLowerCase());
    if (filter === "failed")           return e.status.toLowerCase() === "failed";
    if (filter === "canceled")         return e.status.toLowerCase() === "canceled";
    return true;
  }).filter((e) =>
    !search || e.hook.toLowerCase().includes(search.toLowerCase())
  );

  if (!site.plugin_connected || events.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center gap-3 text-center transition-all duration-base">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <CalendarClock size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No cron data yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {site.plugin_connected
            ? "No scheduled events found on this site."
            : "Install and connect the plugin to collect WP Cron and Action Scheduler events."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: events.length, color: brandColor },
          { label: "WP Cron",      value: wpCount,       color: "#1f5fb8" },
          { label: "Action Sched", value: asCount,       color: "#3b82f6" },
          { label: "Failed",       value: failedCnt,     color: failedCnt > 0 ? "#ef4444" : "#10b981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1.5 transition-all duration-base">
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {dueCnt > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-800">
            {dueCnt} WP Cron event{dueCnt !== 1 ? "s are" : " is"} overdue (past scheduled run time).
          </p>
        </div>
      )}

      {/* Table card */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
        {/* Filter + search */}
        <div className="px-5 pt-4 pb-0 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">Scheduled Events</h3>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hook…"
                className="text-xs pl-7 pr-3 py-1.5 rounded-lg border border-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 w-44"
                style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
              />
            </div>
          </div>
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain -mb-px scrollbar-none">
            <div className="inline-flex w-max gap-0">
            {FILTER_TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  filter === key
                    ? "border-b-2"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                ].join(" ")}
                style={filter === key ? { borderBottomColor: brandColor, color: brandColor } : undefined}
              >
                {label}
                {count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === key ? "bg-opacity-20" : "bg-gray-100 text-muted-foreground"}`}
                    style={filter === key ? { background: brandColor + "20", color: brandColor } : undefined}>
                    {count}
                  </span>
                )}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/60">
                <th className="text-left px-5 py-2.5 font-semibold text-muted-foreground">Hook</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Next Run</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Schedule</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No events match this filter.</td>
                </tr>
              ) : (
                filtered.map((ev, i) => {
                  const nextRun = ev.next_run ? new Date(ev.next_run) : null;
                  const isOverdue = nextRun && ev.source === "wp-cron" && nextRun.getTime() <= now;
                  return (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-foreground max-w-[260px] truncate" title={ev.hook}>
                        {ev.hook}
                      </td>
                      <td className="px-4 py-3">{cronStatusBadge(ev.status)}</td>
                      <td className={`px-4 py-3 tabular-nums ${isOverdue ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                        {nextRun
                          ? nextRun.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                        {isOverdue && <AlertCircle size={11} className="inline ml-1 text-amber-400" />}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ev.schedule ?? ev.recurrence ?? (ev.interval ? `Every ${ev.interval}s` : "One-off")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ev.source === "action-scheduler"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {ev.source === "action-scheduler" ? "AS" : "WP"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-gray-50/40 text-[10px] text-muted-foreground">
          Showing {filtered.length} of {events.length} events · Last synced with plugin data push
        </div>
      </div>
    </div>
  );
}

// ── Site Health Tab ────────────────────────────────────────────────────────────

function BoolRow({ label, value, good, bad }: { label: string; value: boolean | null | undefined; good: boolean; bad: boolean }) {
  if (value === null || value === undefined) return null;
  const isGood = value === good;
  const isBad  = value === bad;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isGood ? "text-green-600" : isBad ? "text-red-500" : "text-amber-500"}`}>
        {isGood ? <CheckCircle2 size={12} /> : isBad ? <XCircle size={12} /> : <AlertCircle size={12} />}
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

function SiteHealthTab({ site }: { site: Site }) {
  const h: SiteHealth | null = site.site_health ?? null;

  if (!site.plugin_connected || !h) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center gap-3 text-center transition-all duration-base">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <HeartPulse size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No health data yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {site.plugin_connected
            ? "Site health data will be available on the next plugin sync."
            : "Install and connect the plugin to collect WordPress site health indicators."}
        </p>
      </div>
    );
  }

  const ext = h.php_extensions ?? {};
  const extKeys = Object.keys(ext);
  const extMissing = extKeys.filter((k) => !ext[k]);

  const wpChecks = [
    { label: "HTTPS enabled",         value: h.is_https,            good: true,  bad: false },
    { label: "WP update available",   value: h.wp_update_available, good: false, bad: true  },
    { label: "Auto-updates enabled",  value: h.auto_updates_enabled,good: true,  bad: false },
    { label: "WP_DEBUG_LOG on",       value: h.wp_debug_log,        good: false, bad: true  },
    { label: "WP_DEBUG_DISPLAY on",   value: h.wp_debug_display,    good: false, bad: true  },
    { label: "File mods disabled",    value: h.disallow_file_mods,  good: true,  bad: false },
    { label: "WP Cron disabled",      value: h.wp_cron_disabled,    good: false, bad: false },
    { label: "User registration open",value: h.users_can_register,  good: false, bad: true  },
  ] as { label: string; value: boolean | null | undefined; good: boolean; bad: boolean }[];

  const fsChecks = [
    { label: "Uploads writable",  value: h.uploads_writable,  good: true, bad: false },
    { label: "Plugins writable",  value: h.plugins_writable,  good: true, bad: false },
    { label: "Themes writable",   value: h.themes_writable,   good: true, bad: false },
  ] as { label: string; value: boolean | null | undefined; good: boolean; bad: boolean }[];

  const issues = [
    h.wp_update_available && "WordPress update available",
    h.wp_debug_log && "WP_DEBUG_LOG is enabled (logs may leak sensitive data)",
    h.wp_debug_display && "WP_DEBUG_DISPLAY is enabled (errors shown to visitors)",
    h.users_can_register && "User registration is open",
    extMissing.length > 0 && `Missing PHP extensions: ${extMissing.join(", ")}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-5">
      {/* Issues banner */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">{issues.length} issue{issues.length !== 1 ? "s" : ""} detected</p>
          </div>
          <ul className="list-disc list-inside space-y-0.5 ml-4">
            {issues.map((iss) => (
              <li key={iss} className="text-xs text-amber-700">{iss}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WordPress Checks */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">WordPress Checks</p>
              {h.wp_latest_version && (
                <p className="text-xs text-muted-foreground">Latest WP: {h.wp_latest_version}</p>
              )}
            </div>
          </div>
          <div className="px-5 py-1">
            {wpChecks.map(({ label, value, good, bad }) => (
              <BoolRow key={label} label={label} value={value} good={good} bad={bad} />
            ))}
            {h.permalink_structure && (
              <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">Permalink structure</span>
                <span className="text-xs font-semibold text-foreground font-mono">{h.permalink_structure}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filesystem Checks */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Database size={14} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Filesystem Access</p>
          </div>
          <div className="px-5 py-1">
            {fsChecks.map(({ label, value, good, bad }) => (
              <BoolRow key={label} label={label} value={value} good={good} bad={bad} />
            ))}
          </div>
        </div>
      </div>

      {/* PHP Extensions */}
      {extKeys.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all duration-base">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Server size={14} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">PHP Extensions</p>
              <p className="text-xs text-muted-foreground">
                {extKeys.filter((k) => ext[k]).length} of {extKeys.length} loaded
                {extMissing.length > 0 && ` · ${extMissing.length} missing`}
              </p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {extKeys.map((name) => {
              const loaded = ext[name];
              return (
                <div
                  key={name}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                    loaded
                      ? "bg-green-50/60 border-green-100"
                      : "bg-red-50/60 border-red-100"
                  }`}
                >
                  {loaded
                    ? <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                    : <XCircle size={12} className="text-red-400 shrink-0" />}
                  <span className={`text-xs font-medium font-mono truncate ${loaded ? "text-green-700" : "text-red-600"}`}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SiteDetailPage() {
  return (
    <Suspense>
      <SiteDetailContent />
    </Suspense>
  );
}

function SiteDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { site, loading, error, refetch } = useSiteContext();
  const { agency } = useAuth();
  const brandColor = agency?.accent_color ?? "#1f5fb8";
  const canUseAdvancedFeatures = agency?.plan === "premium" || agency?.plan === "agency_plus";
  const { roleCanDo } = useRole();
  const canRunAudit = roleCanDo("run_audit");
  const canDeleteSite = roleCanDo("delete_site");
  const [pendingAuditId, setPendingAuditId] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSSHModal, setShowSSHModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanInFlightRef = useRef(false); // prevents double-trigger on fast double-click
  const narrativeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanPollRef.current) clearInterval(scanPollRef.current);
      if (narrativeTimerRef.current) clearTimeout(narrativeTimerRef.current);
    };
  }, []);

  const activeTab = parseSiteTab(searchParams.get("tab"));
  const { status: sshStatus, refreshStatus: refreshSSHStatus } = useSSHSettings(id);
  const [tabLoading, setTabLoading] = useState(false);
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (prevTab.current === activeTab) return;
    prevTab.current = activeTab;
    setTabLoading(true);
    const t = window.setTimeout(() => setTabLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    if (!showActions) return;
    function onDocClick(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showActions]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    if (connected === "google") toast.success("Google account connected successfully.");
    if (oauthError === "oauth_failed") toast.error("Google OAuth failed. Please try again.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { done: auditDone } = useAuditStatus(pendingAuditId);
  useEffect(() => {
    if (!auditDone) return;
    setPendingAuditId(null);
    refetch();
    // Narrative is written async ~2-5s after audit completes — refetch again to pick it up.
    // Use a ref so the timer survives the auditDone→false flip that runs effect cleanup.
    if (narrativeTimerRef.current) clearTimeout(narrativeTimerRef.current);
    narrativeTimerRef.current = setTimeout(() => refetch(), 8000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditDone]);

  function handleTabChange(tab: Tab) {
    router.push(siteTabHref(id, tab), { scroll: false });
  }

  async function runAudit() {
    setAuditLoading(true);
    try {
      const { data } = await api.post<{ audit_id: string }>(`/audits/${id}/run`);
      setPendingAuditId(data.audit_id);
    } catch {
      // silent
    } finally {
      setAuditLoading(false);
    }
  }

  async function runScan() {
    if (scanInFlightRef.current || scanLoading) return;
    scanInFlightRef.current = true;
    setScanLoading(true);
    setScanError(null);
    try {
      const { data: triggerData } = await api.post<{ scan_id: string; mode?: string }>(`/scan/sites/${id}/trigger`);
      const newScanId = triggerData.scan_id;
      const isPollingMode = triggerData.mode === "polling";

      // Hard stop after 8 minutes — prevents infinite loop when scan is queued
      // but the WP plugin hasn't run yet (e.g. pending cron or polling mode)
      const deadlineMs = Date.now() + 8 * 60 * 1000;
      let pendingTicks = 0;

      scanPollRef.current = setInterval(async () => {
        // Bail out past the deadline
        if (Date.now() > deadlineMs) {
          clearInterval(scanPollRef.current!);
          scanPollRef.current = null;
          setScanLoading(false);
          setScanError(
            isPollingMode
              ? "Scan scheduled — the site's security scanner will run it automatically within 2 minutes. Refresh the page to see results."
              : "Scan is taking longer than expected. It will complete in the background — check back shortly."
          );
          return;
        }

        try {
          const { data } = await api.get<{ status: string; threats_found?: number }>(`/scan/sites/${id}/status?scan_id=${newScanId}`);

          // pending/claimed = still waiting for WP to pick it up; don't count as failure
          if (data.status === "pending" || data.status === "claimed") {
            pendingTicks++;
            // After 30 ticks (~2 min) in pending, show a softer "waiting" message
            if (pendingTicks === 30 && isPollingMode) {
              setScanError("Waiting for site scanner to respond… (this can take up to 2 minutes)");
            }
            return;
          }

          // Clear any interim message once the scan actually starts
          if (data.status === "queued" || data.status === "running") {
            setScanError(null);
          }

          if (data.status === "completed" || data.status === "failed") {
            clearInterval(scanPollRef.current!);
            scanPollRef.current = null;
            setScanLoading(false);
            if (data.status === "completed") {
              window.dispatchEvent(new Event("bb:refresh"));
              toast.success("Malware scan complete — review findings in the Malware tab.");
            }
            if (data.status === "failed") {
              setScanError("Scan failed. Please try again.");
              toast.error("Malware scan failed. Please try again.");
            }
          }
        } catch {
          clearInterval(scanPollRef.current!);
          scanPollRef.current = null;
          setScanLoading(false);
          setScanError("Failed to check scan status.");
        }
      }, 4000);
    } catch (err: unknown) {
      setScanLoading(false);
      scanInFlightRef.current = false;
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setScanError(msg || "Failed to start scan.");
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleteLoading(true);
    try {
      await api.delete(`/sites/${id}`);
      await api.post('/sites/cache/clear').catch(() => {});
      window.dispatchEvent(new Event('bb:refresh'));
      toast.success("Site deleted successfully.");
      router.replace("/sites");
    } catch {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  if (loading && !site) return null;
  if (error || !site) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error || "Site not found."}</p>
      </div>
    );
  }

  const wpAdminHref = site.url.replace(/\/$/, "") + "/wp-admin";

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
      {tabLoading && (
        <SiteLoadingOverlay
          siteName={site.name}
          message={`Opening ${SITE_TAB_LABELS[activeTab]}…`}
        />
      )}
      {activeTab !== "agent" && (
      <SiteHeader
        site={site}
        wpAdminHref={wpAdminHref}
        onSync={canRunAudit ? runAudit : undefined}
        syncLoading={auditLoading || !!pendingAuditId}
        menu={
          <div className="relative" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setShowActions((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-xs transition-colors hover:bg-zinc-50"
              aria-label="More actions"
            >
              <MoreVertical size={18} strokeWidth={1.5} />
            </button>
            {showActions && (
              <div className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowSSHModal(true);
                    setShowActions(false);
                  }}
                  className="flex w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  SSH settings
                </button>
                {canDeleteSite && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    {deleteConfirm ? "Confirm delete" : "Delete site"}
                  </button>
                )}
              </div>
            )}
          </div>
        }
      />
      )}

      {activeTab !== "agent" && pendingAuditId && (
        <div className="border-b border-accent/20 bg-accent-light px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <RefreshCw size={13} className="shrink-0 animate-spin text-accent" />
            <p className="text-xs font-medium text-accent">
              Audit running — results will update automatically
            </p>
          </div>
        </div>
      )}

      <div
        className={cn(
          "min-h-0 w-full flex-1",
          activeTab === "overview" || activeTab === "agent"
            ? "flex flex-col overflow-hidden p-0"
            : "overflow-y-auto bg-[#f4f4f5] p-4 sm:p-5"
        )}
      >
        {activeTab === "overview" && (
          <MalCareSiteOverview
            site={site}
            audits={site.audits}
            runAudit={runAudit}
            auditLoading={auditLoading}
            canRunAudit={canRunAudit}
            setTab={handleTabChange}
          />
        )}
        {activeTab === "issues"      && <IssuesTab site={site} brandColor={brandColor} />}
        {activeTab === "seo"         && <SeoTab site={site} audits={site.audits} brandColor={brandColor} />}
        {activeTab === "security"    && <SecurityTab site={site} audits={site.audits} brandColor={brandColor} runAudit={runAudit} canRunAudit={canRunAudit} />}
        {activeTab === "performance" && <PerformanceTab site={site} audits={site.audits} brandColor={brandColor} runAudit={runAudit} canRunAudit={canRunAudit} />}
        {activeTab === "malware"     && (
          <MalwareTab
            site={site}
            onRunScan={runScan}
            scanning={scanLoading}
            canRunScan={canRunAudit}
            scanError={scanError}
            brandColor={brandColor}
          />
        )}
        {activeTab === "uptime"      && <UptimeTab site={site} brandColor={brandColor} />}
        {activeTab === "plugins"     && <PluginsTab site={site} audits={site.audits} brandColor={brandColor} onSiteRefetch={refetch} canUseAdvancedFeatures={canUseAdvancedFeatures} />}
        {activeTab === "woocommerce" && <WooCommerceTab site={site} audits={site.audits} brandColor={brandColor} />}
        {activeTab === "cron"        && <CronTab site={site} brandColor={brandColor} />}
        {activeTab === "health"      && <SiteHealthTab site={site} />}
        {activeTab === "backups"     && <BackupsTab site={site} brandColor={brandColor} canUseAdvancedFeatures={canUseAdvancedFeatures} />}
        {activeTab === "agent"       && <AgentTab site={site} />}
      </div>

      {/* SSH Modal */}
      <Modal
        open={showSSHModal}
        onClose={() => {
          setShowSSHModal(false);
          refreshSSHStatus();
        }}
        title="SSH Access"
        icon={<Key size={18} />}
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
      >
        <SSHSettingsPanel site={site} onCredentialsSaved={() => refreshSSHStatus()} />
      </Modal>
    </div>
  );
}
