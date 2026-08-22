"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bot,
  CheckCircle2,
  Cloud,
  Download,
  FileText,
  Globe,
  HardDrive,
  List,
  Loader2,
  Lock,
  Monitor,
  Package,
  Plug,
  Shield,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { McCard, McIconBox, McPill } from "@/components/shared/MalCareUI";
import { WordPressIcon } from "@/components/shared/WordPressIcon";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { scoreHex, timeAgo } from "@/lib/utils";
import type { Audit, Site } from "@/types";

export type SiteOverviewTab =
  | "issues"
  | "security"
  | "performance"
  | "seo"
  | "malware"
  | "uptime"
  | "plugins"
  | "backups"
  | "health";

const CARD = "rounded-xl border-zinc-200 shadow-sm";

function faviconSrc(url: string) {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function CardFooter({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
      <span className="text-xs text-zinc-500">{left}</span>
      {right}
    </div>
  );
}

function FooterLink({ onClick, href, children }: { onClick?: () => void; href?: string; children: ReactNode }) {
  const cls = "text-xs font-semibold text-accent hover:underline";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function UpdateCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SiteSummaryCard({
  site,
  updates,
  setTab,
}: {
  site: Site;
  updates: number;
  setTab: (tab: SiteOverviewTab) => void;
}) {
  const fav = faviconSrc(site.url);
  const online = site.uptime_status === "up";
  const down = site.uptime_status === "down";
  const wpVersion = site.plugin_data?.wp_version ?? "—";
  const phpVersion = site.plugin_data?.php_version ?? "—";
  const pluginCount =
    site.plugin_data?.active_plugins_count ??
    site.plugin_data?.plugins?.filter((p) => p.status === "active").length ??
    null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <Globe size={16} strokeWidth={1.5} />
          </div>
          <h2 className="text-sm font-semibold text-zinc-950">Site Summary</h2>
        </div>
        {site.plugin_connected ? (
          <McPill tone="good" dot>
            Connected
          </McPill>
        ) : (
          <McPill tone="neutral">Not connected</McPill>
        )}
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <div className="relative h-[88px] w-[140px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm">
              {fav ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fav} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Globe size={28} className="text-zinc-400" />
                </div>
              )}
              {online && (
                <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded bg-[var(--score-good)] text-white shadow-sm">
                  <Lock size={10} strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div className="mt-3">
              {online ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--score-good-border)] bg-[var(--score-good-bg)] px-2.5 py-1 text-xs font-medium text-[var(--score-good)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--score-good)]" />
                  Site is Online
                </span>
              ) : down ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Site is Down
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  Status unknown
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-800">
                <WordPressIcon size={18} className="text-zinc-700" />
                <span className="font-semibold tabular-nums">{wpVersion}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold tabular-nums text-zinc-600">{phpVersion}</span>
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold lowercase text-white">
                  php
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <Plug size={16} strokeWidth={1.5} className="shrink-0 text-zinc-700" />
              <UpdateCountBadge count={updates} />
              <span className="text-zinc-700">
                Active Plugins:{" "}
                <span className="font-semibold text-zinc-950">{pluginCount ?? "—"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {updates > 0 && (
        <div className="border-t border-zinc-200 bg-zinc-50">
          <button
            type="button"
            onClick={() => setTab("plugins")}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-100/80"
          >
            <Download size={18} strokeWidth={1.5} className="shrink-0 text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-950">
                {updates} Plugin Update{updates === 1 ? "" : "s"} Available
              </p>
              <p className="text-xs text-zinc-500">
                {updates} plugin{updates === 1 ? "" : "s"} need updates.
              </p>
            </div>
          </button>
          <div className="flex justify-end border-t border-zinc-200/80 px-5 py-3">
            <button
              type="button"
              onClick={() => setTab("plugins")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <List size={14} strokeWidth={1.5} />
              View All ({updates})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SiteOverviewGrid({
  site,
  audits,
  setTab,
  runAudit,
  auditLoading,
  canRunAudit,
}: {
  site: Site;
  audits: Audit[];
  setTab: (tab: SiteOverviewTab) => void;
  runAudit: () => void;
  auditLoading: boolean;
  canRunAudit: boolean;
}) {
  const router = useRouter();
  const scores = site.latest_scores;
  const updates = site.plugins_needing_updates ?? 0;
  const online = site.uptime_status === "up";
  const down = site.uptime_status === "down";
  const sslDays = sslDaysRemaining(site.ssl_expiry_date);
  const latestAudit = audits.find((a) => a.status === "completed");

  const [analyticsConnected, setAnalyticsConnected] = useState<boolean | null>(null);
  const [backupSchedule, setBackupSchedule] = useState("manual");
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [reports, setReports] = useState<{ id: string; status: string; overall_score: number | null; created_at: string }[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activity, setActivity] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [backups, setBackups] = useState<{ status: string; created_at: string; size_mb?: number }[]>([]);

  useEffect(() => {
    api
      .get<{ backups: typeof backups; backup_schedule?: string }>(`/backups/${site.id}`)
      .then(({ data }) => {
        setBackups(data.backups ?? []);
        setBackupSchedule(data.backup_schedule ?? "manual");
      })
      .catch(() => {})
      .finally(() => setBackupsLoading(false));
  }, [site.id]);

  useEffect(() => {
    api
      .get<{ reports: typeof reports }>(`/reports/${site.id}`)
      .then(({ data }) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [site.id]);

  useEffect(() => {
    api
      .get<{ logs: { id: string; site_id: string | null; action: string; created_at: string }[] }>(
        `/activity?limit=20&offset=0`
      )
      .then(({ data }) => {
        setActivity((data.logs ?? []).filter((l) => l.site_id === site.id).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [site.id]);

  useEffect(() => {
    api
      .get<{ ga4_connected?: boolean }>(`/analytics/${site.id}/status`)
      .then(({ data }) => setAnalyticsConnected(!!data?.ga4_connected))
      .catch(() => setAnalyticsConnected(false));
  }, [site.id]);

  const lastBackup = backups.find((b) => b.status === "completed");
  const latestReport = reports[0];
  const perfScore = scores?.performance ?? null;

  const securityIssues =
    (site.malware_status === "threat" ? 1 : 0) +
    (site.xml_rpc_enabled ? 1 : 0) +
    (site.file_editor_enabled ? 1 : 0) +
    (site.wp_debug_enabled ? 1 : 0) +
    (site.plugin_vuln_count ?? 0);

  return (
    <div className="space-y-5">
      {/* Row 1 — Site Summary */}
      <SiteSummaryCard site={site} updates={updates} setTab={setTab} />

      {/* Row 2 — Backups + Performance */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <McCard
          className={CARD}
          title="Backups"
          icon={<Cloud size={15} strokeWidth={1.5} />}
          action={
            <McPill tone={backupSchedule === "manual" ? "neutral" : "good"}>
              {backupSchedule === "manual" ? "Off" : backupSchedule}
            </McPill>
          }
          flush
        >
          {backupsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : lastBackup ? (
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <McIconBox icon={<HardDrive size={16} />} tone="good" size="md" />
                <div>
                  <p className="text-sm font-semibold text-zinc-950">Last backup</p>
                  <p className="text-xs text-zinc-500">
                    {timeAgo(lastBackup.created_at)}
                    {lastBackup.size_mb ? ` · ${lastBackup.size_mb} MB` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Cloud size={20} />}
              title="Backups are turned off"
              description="Enable scheduled backups or run a manual backup to protect this site."
              action={
                <Button size="sm" onClick={() => setTab("backups")}>
                  Manage backups
                </Button>
              }
            />
          )}
          <CardFooter
            left={`Schedule: ${backupSchedule}`}
            right={<FooterLink onClick={() => setTab("backups")}>View backups →</FooterLink>}
          />
        </McCard>

        <McCard
          className={CARD}
          title="Performance"
          icon={<Zap size={15} strokeWidth={1.5} />}
          action={
            perfScore != null ? (
              <McPill tone={perfScore >= 80 ? "good" : perfScore >= 50 ? "warn" : "bad"}>
                Score {perfScore}
              </McPill>
            ) : (
              <McPill tone="neutral">No data</McPill>
            )
          }
          flush
        >
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
            {perfScore != null ? (
              <SiteScoreWheel score={perfScore} caption="Site Score" size={72} className="shrink-0" />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-200 text-xs text-zinc-400">
                —
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Avg response</span>
                <span className="font-semibold text-zinc-950">
                  {site.avg_response_ms != null ? `${site.avg_response_ms} ms` : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Caching</span>
                <span className="font-semibold text-zinc-950">{site.caching_plugin ? "Active" : "None"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">CDN</span>
                <span className="font-semibold text-zinc-950">{site.cdn_plugin ? "Active" : "None"}</span>
              </div>
              {securityIssues > 0 && (
                <p className="text-xs font-medium text-amber-700">
                  Status: {securityIssues} issue{securityIssues === 1 ? "" : "s"} found
                </p>
              )}
            </div>
          </div>
          <CardFooter
            left={latestAudit?.completed_at ? `Last audit ${timeAgo(latestAudit.completed_at)}` : null}
            right={<FooterLink onClick={() => setTab("performance")}>View report →</FooterLink>}
          />
        </McCard>
      </div>

      {/* Row 3 — Security & Firewall (full width) */}
      <McCard
        className={CARD}
        title="Security & Firewall"
        icon={<Shield size={15} strokeWidth={1.5} />}
        action={
          site.malware_status === "threat" ? (
            <McPill tone="bad" icon={<AlertTriangle size={11} />}>
              Threat detected
            </McPill>
          ) : (
            <McPill tone="good" icon={<ShieldCheck size={11} />}>
              Protected
            </McPill>
          )
        }
        flush
      >
        <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 px-4 py-4 sm:grid-cols-4">
          {(
            [
              ["Malware", site.malware_status === "clean" || !site.malware_status ? "Clean" : "Threat"],
              ["Vulnerabilities", String(site.plugin_vuln_count ?? 0)],
              ["SSL", sslDays == null ? "—" : sslDays < 0 ? "Expired" : `${sslDays}d left`],
              ["Uptime", site.uptime_percentage != null ? `${site.uptime_percentage.toFixed(1)}%` : "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-950">Protection status</p>
            {(
              [
                ["Firewall", "Active"],
                ["Vulnerability scanner", (site.plugin_vuln_count ?? 0) > 0 ? "Issues found" : "Protected"],
                ["File editor", site.file_editor_enabled ? "Enabled" : "Disabled"],
                ["Debug mode", site.wp_debug_enabled ? "On" : "Off"],
                ["XML-RPC", site.xml_rpc_enabled ? "Enabled" : "Disabled"],
              ] as const
            ).map(([label, status]) => (
              <div key={label} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-zinc-600">{label}</span>
                <span className="font-semibold text-zinc-950">{status}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-950">Recent activity</p>
            {activityLoading ? (
              <Loader2 size={16} className="animate-spin text-zinc-400" />
            ) : activity.length === 0 ? (
              <p className="text-xs text-zinc-500">No recent activity for this site.</p>
            ) : (
              <ul className="space-y-2">
                {activity.slice(0, 4).map((log) => (
                  <li key={log.id} className="flex items-start justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-zinc-700">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="shrink-0 text-zinc-400">{timeAgo(log.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <CardFooter
          left={site.last_audit_at ? `Last sync ${timeAgo(site.last_audit_at)}` : null}
          right={
            <div className="flex items-center gap-3">
              {canRunAudit && (
                <button
                  type="button"
                  onClick={runAudit}
                  disabled={auditLoading}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 disabled:opacity-50"
                >
                  {auditLoading ? "Scanning…" : "Scan now"}
                </button>
              )}
              <FooterLink onClick={() => setTab("security")}>Security →</FooterLink>
            </div>
          }
        />
      </McCard>

      {/* Row 4 — Manage Updates */}
      <McCard
          className={CARD}
          title="Manage Updates"
          icon={<Package size={15} strokeWidth={1.5} />}
          action={
            updates > 0 ? (
              <McPill tone="warn">{updates} pending</McPill>
            ) : (
              <McPill tone="good" dot>
                All secure
              </McPill>
            )
          }
          flush
        >
          <div className="divide-y divide-zinc-100 px-4">
            {updates > 0 ? (
              <div className="flex items-center gap-3 py-3">
                <McIconBox icon={<Package size={14} />} tone="warn" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-950">Plugins</p>
                  <p className="text-xs text-zinc-500">{updates} update{updates === 1 ? "" : "s"} available</p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 size={20} className="text-[var(--score-good)]" />}
                title="All plugins up to date"
                description="No pending plugin, theme, or core updates."
              />
            )}
          </div>
          <CardFooter
            left={site.plugin_data?.last_sync ? `Last sync ${timeAgo(site.plugin_data.last_sync)}` : null}
            right={<FooterLink onClick={() => setTab("plugins")}>Manage updates →</FooterLink>}
          />
        </McCard>

      {/* Row 5 — Reports + Activity Log */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <McCard className={CARD} title="Scheduled Reports" icon={<FileText size={15} strokeWidth={1.5} />} flush>
          {reportsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : latestReport ? (
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">Latest report</p>
                  <p className="text-xs text-zinc-500">{timeAgo(latestReport.created_at)}</p>
                </div>
                {latestReport.overall_score != null && (
                  <span
                    className="rounded-md border px-2 py-1 text-xs font-bold"
                    style={{
                      color: scoreHex(latestReport.overall_score),
                      borderColor: `${scoreHex(latestReport.overall_score)}33`,
                      background: `${scoreHex(latestReport.overall_score)}14`,
                    }}
                  >
                    {latestReport.overall_score}/100
                  </span>
                )}
              </div>
              <McPill tone={latestReport.status === "completed" ? "good" : "neutral"}>
                {latestReport.status}
              </McPill>
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={20} />}
              title="No reports yet"
              description="Generate white-label client reports from audit data."
              action={
                <FooterLink href={`/reports/${site.id}`}>Setup scheduled reports →</FooterLink>
              }
            />
          )}
          <CardFooter
            right={<FooterLink href={`/reports/${site.id}`}>View reports →</FooterLink>}
          />
        </McCard>

        <McCard className={CARD} title="Activity Log" icon={<Activity size={15} strokeWidth={1.5} />} flush>
          {activityLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={<Activity size={20} />}
              title="No activity yet"
              description="Site actions and audit events will appear here."
            />
          ) : (
            <ul className="divide-y divide-zinc-100 px-4">
              {activity.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <span className="min-w-0 truncate font-medium capitalize text-zinc-800">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 text-zinc-400">{timeAgo(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <CardFooter
            right={<FooterLink href="/settings/activity">View activity log →</FooterLink>}
          />
        </McCard>
      </div>

      {/* Row 6 — Advanced Monitoring (full width) */}
      <McCard className={CARD} title="Advanced Monitoring" icon={<Monitor size={15} strokeWidth={1.5} />} flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Last checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(
                [
                  ["Uptime", online ? "Up" : down ? "Down" : "Unknown", site.last_uptime_check_at],
                  ["Speed", site.avg_response_ms != null ? `${site.avg_response_ms} ms` : "—", site.last_audit_at],
                  ["SSL Monitor", sslDays != null && sslDays < 30 ? "Expiring soon" : "Healthy", site.ssl_expiry_date],
                  ["Security", site.malware_status === "threat" ? "Issue" : "Healthy", site.last_audit_at],
                ] as const
              ).map(([feature, status, checked]) => (
                <tr key={feature} className="hover:bg-[#f4f4f5]">
                  <td className="px-4 py-3 font-medium text-zinc-950">{feature}</td>
                  <td className="px-4 py-3">
                    <McPill
                      tone={
                        status === "Up" || status === "Healthy"
                          ? "good"
                          : status === "Down" || status === "Issue" || status === "Expiring soon"
                            ? "bad"
                            : "neutral"
                      }
                    >
                      {status}
                    </McPill>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {checked ? timeAgo(String(checked)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardFooter
          right={<FooterLink onClick={() => setTab("uptime")}>Open monitoring →</FooterLink>}
        />
      </McCard>

      {/* Row 7 — Analytics + Optimization */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <McCard className={CARD} title="Google Analytics" icon={<BarChart2 size={15} strokeWidth={1.5} />} flush>
          {analyticsConnected === null ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : analyticsConnected ? (
            <div className="space-y-2 px-4 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--score-good)]" />
                <p className="text-sm font-semibold text-zinc-950">Google Analytics connected</p>
              </div>
              <p className="text-xs text-zinc-500">View traffic and engagement in the Performance tab.</p>
            </div>
          ) : (
            <EmptyState
              icon={<BarChart2 size={20} />}
              title="Connect Google Analytics"
              description="Get website traffic alerts and session insights for this site."
              action={
                <Button size="sm" onClick={() => setTab("performance")}>
                  Connect Google Analytics
                </Button>
              }
            />
          )}
          <CardFooter
            right={<FooterLink onClick={() => setTab("performance")}>Analytics →</FooterLink>}
          />
        </McCard>

        <McCard className={CARD} title="Optimization" icon={<TrendingUp size={15} strokeWidth={1.5} />} flush>
          <EmptyState
            icon={<Bot size={20} />}
            title="AI-powered optimization"
            description="Run performance audits and get AI recommendations to improve site speed."
            action={
              <Button size="sm" onClick={() => router.push(`/sites/${site.id}?tab=agent`)}>
                Optimize site
              </Button>
            }
          />
          <CardFooter
            right={
              <FooterLink onClick={() => router.push(`/sites/${site.id}?tab=agent`)}>
                Open agent →
              </FooterLink>
            }
          />
        </McCard>
      </div>
    </div>
  );
}
