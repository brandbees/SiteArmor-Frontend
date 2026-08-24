"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CloudUpload,
  FileText,
  Globe,
  Loader2,
  OctagonAlert,
  PlayCircle,
  ShieldX,
  FileChartColumnIncreasing,
  Plug,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "@/lib/api";
import { UpgradeBanner } from "@/components/shared/UpgradeBanner";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { cn, timeAgo } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Agency, Site } from "@/types";
import type { PortfolioStats } from "@/hooks/useSites";
import { mapReportRow, type RawReportRow, type ReportListItem } from "@/lib/reports";

export const DASHBOARD_GRADIENT =
  "linear-gradient(180deg, rgba(209, 250, 229, 0.15) 0%, rgba(236, 253, 245, 0.70) 0.98%, #F4F4F5 4.16%)";

function McWidgetCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col justify-stretch overflow-visible rounded-3xl border border-zinc-200 bg-[#FDFDFD] p-6 shadow-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

function McStatCard({
  label,
  icon,
  href,
  children,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  children: ReactNode;
}) {
  const inner = (
    <div className="flex h-[123px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-none transition-transform duration-150 hover:scale-[1.02]">
      <div className="flex w-full items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-center justify-center rounded bg-zinc-50 p-0.5 text-muted-foreground">
          {icon}
        </div>
      </div>
      <div className="min-h-0">{children}</div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function McMenu({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = options.find((o) => o.id === value)?.label ?? "All";

  return (
    <div ref={ref} className="relative z-20 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-8 min-w-[5.5rem] items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="truncate">{current}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] rounded-md border border-zinc-200 bg-white py-1 shadow-md">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50",
                opt.id === value && "bg-zinc-50 font-medium"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetHeader({
  icon,
  title,
  badge,
  action,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4">
      <header className="flex min-w-0 shrink items-end gap-2">
        {icon}
        <span className="text-lg font-medium leading-tight text-zinc-900">{title}</span>
        {badge}
      </header>
      {action}
    </div>
  );
}

function McBadge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "neutral" | "danger" | "success" | "warn";
}) {
  const styles = {
    neutral: "border-zinc-200 bg-zinc-100 text-muted-foreground",
    danger: "border-red-200 bg-red-50 text-destructive",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <div
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-normal",
        styles[variant]
      )}
    >
      {children}
    </div>
  );
}

function EmptyWidget({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-100/80">
        <CloudUpload size={40} strokeWidth={1} className="text-zinc-300" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h6 className="font-medium leading-normal text-muted-foreground">{title}</h6>
        <p className="max-w-sm text-xs leading-normal text-muted-foreground">{description}</p>
      </div>
      {bullets && bullets.length > 0 && (
        <div className="flex w-full max-w-sm flex-col items-start gap-2 rounded-xl bg-zinc-50 px-4 py-2">
          {bullets.map((b) => (
            <div key={b} className="flex w-full items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              <p className="text-left text-xs font-normal leading-normal text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function MonitoringBars({
  rows,
}: {
  rows: {
    label: string;
    count: number;
    barClass: string;
    barHoverClass: string;
    countClass: string;
    countHoverClass: string;
  }[];
}) {
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {rows.map(({ label, count, barClass, barHoverClass, countClass, countHoverClass }) => {
        const barPct = count > 0 ? (count / maxCount) * 100 : 0;
        return (
          <div
            key={label}
            className="group grid cursor-default items-center gap-x-3 rounded-lg py-0.5 transition-colors hover:bg-zinc-50/80"
            style={{ gridTemplateColumns: "4.5rem 1fr auto" }}
          >
            <span className="text-sm font-normal leading-none text-zinc-600 transition-colors group-hover:text-zinc-800">
              {label}
            </span>
            <div className="flex h-8 min-w-0 items-center">
              {count > 0 && (
                <div
                  className={cn(
                    "h-8 rounded-lg transition-colors duration-150",
                    barClass,
                    barHoverClass
                  )}
                  style={{ width: `${barPct}%`, minWidth: "1.125rem" }}
                />
              )}
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-normal leading-none whitespace-nowrap transition-colors duration-150",
                countClass,
                countHoverClass
              )}
            >
              {count} Sites
            </span>
          </div>
        );
      })}
    </div>
  );
}

type AlertFilter = "all" | "hacked" | "critical" | "warnings";
type IssueKind = "down" | "malware" | "ssl";

export function MalCareDashboard({
  sites,
  portfolio,
  agency,
  isIndividual,
  canAddSite,
  atLimit,
  onAddSite,
  avgScore,
  threatCount,
  connectedCount,
  needsAuditSites,
}: {
  sites: Site[];
  portfolio: PortfolioStats | null;
  agency: Agency | null;
  isIndividual: boolean;
  canAddSite: boolean;
  atLimit: boolean;
  onAddSite: () => void;
  avgScore: number | null;
  threatCount: number;
  connectedCount: number;
  displayTrendData: { month: string; score: number }[];
  needsAuditSites: Site[];
}) {
  const router = useRouter();
  const [auditLoading, setAuditLoading] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
  const [issueFilter, setIssueFilter] = useState<"all" | IssueKind>("all");
  const [reportsTab, setReportsTab] = useState<"all" | "sent" | "pending">("all");
  const [teamCount, setTeamCount] = useState(1);
  const [clientCount, setClientCount] = useState(0);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const sitesUp = sites.filter((s) => s.uptime_status !== "down").length;
  const sitesDown = sites.filter((s) => s.uptime_status === "down").length;
  const totalUpdates = sites.reduce((sum, s) => sum + (s.plugins_needing_updates ?? 0), 0);
  const sitesWithUpdates = sites.filter((s) => (s.plugins_needing_updates ?? 0) > 0);

  const planLimit = agency ? (PLAN_LIMITS[agency.plan] ?? 1) : 1;
  const sitesUsed = sites.length;
  const planAvailable = Math.max(0, planLimit - sitesUsed);
  const planPct = planLimit > 0 ? Math.min(100, (sitesUsed / planLimit) * 100) : 0;

  const hackedSites = sites.filter((s) => s.malware_status === "threat");
  const criticalSites = sites.filter(
    (s) =>
      s.uptime_status === "down" ||
      (s.overall_score != null && s.overall_score < 50)
  );
  const warningSites = sites.filter(
    (s) =>
      s.overall_score != null &&
      s.overall_score >= 50 &&
      s.overall_score < 80 &&
      s.malware_status !== "threat"
  );

  const alertCounts = {
    hacked: hackedSites.length,
    critical: criticalSites.length,
    warnings: warningSites.length,
  };

  const alertSitesWithIssues = sites.filter(
    (s) =>
      s.malware_status === "threat" ||
      s.uptime_status === "down" ||
      (s.overall_score != null && s.overall_score < 80) ||
      !s.plugin_connected
  );

  const filteredAlerts = useMemo(() => {
    if (alertFilter === "hacked") return hackedSites;
    if (alertFilter === "critical") return criticalSites;
    if (alertFilter === "warnings") return warningSites;
    const byId = new Map<string, Site>();
    for (const s of [...hackedSites, ...criticalSites, ...warningSites]) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()];
  }, [alertFilter, hackedSites, criticalSites, warningSites]);

  const monitoringStats = useMemo(() => {
    let disabled = 0;
    let warning = 0;
    let critical = 0;
    let healthy = 0;

    for (const s of sites) {
      if (!s.plugin_connected) {
        disabled += 1;
        continue;
      }
      const sslDays = sslDaysRemaining(s.ssl_expiry_date);
      const isCritical =
        s.malware_status === "threat" ||
        s.uptime_status === "down" ||
        (s.overall_score != null && s.overall_score < 50);
      const isWarning =
        !isCritical &&
        ((s.overall_score != null && s.overall_score >= 50 && s.overall_score < 80) ||
          (sslDays != null && sslDays <= 30) ||
          !s.ssl_expiry_date);

      if (isCritical) critical += 1;
      else if (isWarning) warning += 1;
      else healthy += 1;
    }

    return { disabled, warning, critical, healthy, monitored: sites.length - disabled };
  }, [sites]);

  const monitorIssues = useMemo(() => {
    const issues: { id: string; siteId: string; siteName: string; title: string; at: string; kind: IssueKind }[] = [];

    for (const s of sites) {
      if (s.uptime_status === "down") {
        issues.push({
          id: `${s.id}-down`,
          siteId: s.id,
          siteName: s.name,
          title: "Site is down",
          at: s.last_uptime_check_at ?? s.created_at,
          kind: "down",
        });
      }
      if (s.malware_status === "threat") {
        issues.push({
          id: `${s.id}-malware`,
          siteId: s.id,
          siteName: s.name,
          title: "Malware detected",
          at: s.last_audit_at ?? s.created_at,
          kind: "malware",
        });
      }
      const sslDays = sslDaysRemaining(s.ssl_expiry_date);
      if (sslDays != null && sslDays <= 30) {
        issues.push({
          id: `${s.id}-ssl`,
          siteId: s.id,
          siteName: s.name,
          title: sslDays <= 0 ? "SSL certificate expired" : "SSL expiring soon",
          at: s.ssl_expiry_date ?? s.last_audit_at ?? s.created_at,
          kind: "ssl",
        });
      } else if (s.plugin_connected && !s.ssl_expiry_date) {
        issues.push({
          id: `${s.id}-ssl-unknown`,
          siteId: s.id,
          siteName: s.name,
          title: "Domain expiry date unavailable",
          at: s.last_audit_at ?? s.created_at,
          kind: "ssl",
        });
      }
    }

    return issues.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [sites]);

  const filteredMonitorIssues = useMemo(() => {
    const list = issueFilter === "all" ? monitorIssues : monitorIssues.filter((i) => i.kind === issueFilter);
    return list.slice(0, 6);
  }, [monitorIssues, issueFilter]);

  const filteredReports = useMemo(() => {
    if (reportsTab === "sent") return reports.filter((r) => !!r.sent_to);
    if (reportsTab === "pending") return reports.filter((r) => r.status === "pending");
    return reports;
  }, [reports, reportsTab]);

  const reportCounts = useMemo(
    () => ({
      all: reports.length,
      sent: reports.filter((r) => !!r.sent_to).length,
      pending: reports.filter((r) => r.status === "pending").length,
    }),
    [reports]
  );

  const perfGood = sites.filter((s) => (s.latest_scores?.performance ?? 0) >= 90).length;
  const perfMid = sites.filter((s) => {
    const p = s.latest_scores?.performance ?? 0;
    return p >= 50 && p < 90;
  }).length;
  const perfPoor = sites.filter((s) => (s.latest_scores?.performance ?? 0) < 50 && s.latest_scores).length;
  const perfPie = [
    { name: "Good", value: perfGood || 0, color: "#04785773" },
    { name: "Mid", value: perfMid || 0, color: "#D9770673" },
    { name: "Poor", value: perfPoor || 0, color: "#DC262673" },
  ].filter((d) => d.value > 0);

  useEffect(() => {
    if (!agency || agency.is_client_portal || isIndividual) return;
    api
      .get<{ seats_used: number; members?: unknown[] }>("/team")
      .then(({ data }) => setTeamCount(data.seats_used ?? 1))
      .catch(() => {});
    api
      .get<{ clients?: unknown[]; total?: number }>("/clients?limit=1")
      .then(({ data }) => setClientCount(data.total ?? data.clients?.length ?? 0))
      .catch(() => {});
  }, [agency, isIndividual]);

  useEffect(() => {
    api
      .get<{ reports: RawReportRow[] }>("/reports")
      .then(({ data }) => setReports((data.reports ?? []).map(mapReportRow)))
      .catch(() => setReports([]))
      .finally(() => setReportsLoading(false));
  }, []);

  async function runAudit(siteId: string) {
    setAuditLoading(siteId);
    try {
      await api.post(`/audits/${siteId}/run`);
      router.push(`/sites/${siteId}`);
    } catch {
      setAuditLoading(null);
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-5rem)] overflow-auto p-4 pr-6 scrollbar-hide"
      style={{ background: DASHBOARD_GRADIENT }}
    >
      <div className="flex flex-col items-start gap-4" style={{ width: "min(107.125rem, 100%)" }}>
        {atLimit && canAddSite && !isIndividual && agency && (
          <UpgradeBanner message={`You've reached your site limit on the ${agency.plan} plan.`} />
        )}

        {agency && !agency.is_client_portal && (
          <OnboardingChecklist agency={agency} sites={sites} />
        )}

        {needsAuditSites.length > 0 && (
          <div className="w-full rounded-2xl border border-accent/20 bg-white px-5 py-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  {needsAuditSites.length === 1
                    ? `Run your first audit on ${needsAuditSites[0].name}`
                    : `${needsAuditSites.length} sites haven't been audited yet`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connect the plugin, then run an audit to unlock scores and monitoring.
                </p>
              </div>
              {needsAuditSites.length === 1 ? (
                <button
                  type="button"
                  onClick={() => runAudit(needsAuditSites[0].id)}
                  disabled={!!auditLoading}
                  className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                >
                  {auditLoading === needsAuditSites[0].id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <PlayCircle size={14} />
                  )}
                  Run audit
                </button>
              ) : (
                <Link
                  href="/sites"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  View sites →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Top stats row ── */}
        <div className="min-h-[123px] w-full">
          <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <McStatCard label="Sites" href="/sites" icon={<Globe size={24} strokeWidth={1.5} />}>
              <div className="flex gap-14">
                <div className="flex grow flex-col gap-1">
                  <p className="text-2xl font-medium text-emerald-700">{sitesUp}</p>
                  <p className="text-xs text-muted-foreground">Sites Up</p>
                </div>
                <div className="flex grow flex-col gap-1">
                  <p className="text-2xl font-medium text-destructive">{sitesDown}</p>
                  <p className="text-xs text-muted-foreground">Sites Down</p>
                </div>
              </div>
            </McStatCard>

            <McStatCard label="Plans" href="/settings?tab=billing" icon={<CircleDollarSign size={24} strokeWidth={1.5} />}>
              <div className="flex flex-col gap-1 rounded-lg">
                <div className="flex w-full items-end justify-between">
                  <div className="flex items-end gap-0">
                    <p className="text-2xl font-normal text-zinc-700">{sitesUsed}</p>
                    <p className="py-1 text-xs text-zinc-400">/ {planLimit >= 9999 ? "∞" : planLimit}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {planLimit >= 9999 ? "∞" : planAvailable}
                  </p>
                </div>
                <div className="py-0.5">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-emerald-700/40 transition-all"
                      style={{ width: `${planPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </McStatCard>

            <McStatCard
              label="Network"
              href={isIndividual ? undefined : "/settings?tab=team"}
              icon={<Users size={24} strokeWidth={1.5} />}
            >
              <div className="flex gap-14">
                <div className="flex grow flex-col gap-1">
                  <p className="text-2xl font-normal text-zinc-700">{isIndividual ? 1 : teamCount}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
                <div className="flex grow flex-col gap-1">
                  <p className="text-2xl font-normal text-zinc-700">{isIndividual ? 0 : clientCount}</p>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
              </div>
            </McStatCard>

            <McStatCard label="Updates" href="/sites" icon={<Plug size={24} strokeWidth={1.5} />}>
              <div className="flex min-w-0 gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-normal leading-none text-zinc-700">{totalUpdates}</p>
                  <p className="mt-1 truncate text-xs leading-tight text-muted-foreground">Plugin updates</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-normal leading-none text-zinc-700">{sitesWithUpdates.length}</p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">Sites with updates</p>
                </div>
              </div>
            </McStatCard>
          </div>
        </div>

        {/* ── Widget grid (MalCare flex-wrap masonry) ── */}
        <div className="flex w-full flex-nowrap items-start gap-4">
          <div className="flex max-w-full grow flex-wrap items-stretch gap-4">
            {/* Alerts */}
            <div className="w-full grow lg:w-[544px] lg:max-w-full">
              <McWidgetCard className="flex max-h-[560px] flex-col gap-6 overflow-visible">
                <WidgetHeader
                  icon={<AlertCircle size={20} strokeWidth={1} className="text-zinc-900" />}
                  title="Alerts"
                  badge={
                    alertSitesWithIssues.length > 0 ? (
                      <McBadge variant="neutral">
                        {alertSitesWithIssues.length} Site{alertSitesWithIssues.length === 1 ? "!" : "s!"}
                      </McBadge>
                    ) : undefined
                  }
                  action={
                    <McMenu
                      value={alertFilter}
                      options={[
                        { id: "all", label: "All" },
                        { id: "hacked", label: "Hacked" },
                        { id: "critical", label: "Critical" },
                        { id: "warnings", label: "Warnings" },
                      ]}
                      onChange={(id) => setAlertFilter(id as AlertFilter)}
                    />
                  }
                />

                <div className="grid shrink-0 grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: "hacked" as const,
                        label: "Hacked",
                        count: alertCounts.hacked,
                        icon: ShieldX,
                        activeBg: "bg-red-50",
                        activeBorder: "border-red-600",
                        iconColor: "text-red-600",
                        countColor: "text-red-600",
                      },
                      {
                        id: "critical" as const,
                        label: "Critical",
                        count: alertCounts.critical,
                        icon: OctagonAlert,
                        activeBg: "bg-red-50",
                        activeBorder: "border-zinc-600",
                        iconColor: "text-red-500",
                        countColor: "text-zinc-900",
                      },
                      {
                        id: "warnings" as const,
                        label: "Warnings",
                        count: alertCounts.warnings,
                        icon: TriangleAlert,
                        activeBg: "bg-amber-50",
                        activeBorder: "border-zinc-600",
                        iconColor: "text-amber-500",
                        countColor: "text-zinc-900",
                      },
                    ] as const
                  ).map(({ id, label, count, icon: Icon, activeBg, activeBorder, iconColor, countColor }) => {
                    const selected = alertFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAlertFilter(id)}
                        data-selected={selected}
                        className={cn(
                          "flex h-[33px] items-center gap-2 rounded-[10px] px-[8.625px] text-left",
                          selected ? cn(activeBg, "border", activeBorder) : "bg-zinc-100"
                        )}
                      >
                        <Icon size={20} strokeWidth={1.5} className={cn("shrink-0", iconColor)} />
                        <span className="flex min-w-0 flex-1 items-center justify-between">
                          <span className="truncate text-xs text-zinc-700">{label}</span>
                          <span className={cn("ml-2 text-xs font-medium", selected && id === "hacked" ? countColor : countColor)}>
                            {count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
                  {filteredAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertTriangle size={28} className="mb-2 text-zinc-300" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {alertFilter === "all" ? "No alerts" : "No alerts in this category"}
                      </p>
                    </div>
                  ) : (
                    filteredAlerts.slice(0, 8).map((s) => {
                      const isHacked = s.malware_status === "threat";
                      const isDown = s.uptime_status === "down";
                      const title = isHacked
                        ? "Site Hacked"
                        : isDown
                          ? "Site Down"
                          : "Needs Attention";
                      const desc = isHacked
                        ? `${s.name} · Malware detected. Review and clean your site.`
                        : isDown
                          ? `${s.name} · Site is unreachable. Check uptime monitor.`
                          : `${s.name} · Score below threshold. Review site health.`;
                      return (
                        <Link
                          key={s.id}
                          href={`/sites/${s.id}`}
                          className="flex h-[52px] min-h-[52px] w-full items-center gap-2.5 rounded-[10px] px-0 transition-colors hover:bg-zinc-50"
                        >
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-red-50">
                            <ShieldX size={16} strokeWidth={1} className="text-red-600" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                            <div className="flex items-center gap-1 overflow-hidden">
                              <div className="min-w-0 truncate text-sm font-medium leading-none text-zinc-500">
                                {title}
                              </div>
                              <span className="size-[5px] shrink-0 rounded-full bg-red-600" aria-hidden />
                            </div>
                            <div className="min-w-0 truncate text-xs font-normal leading-normal text-zinc-400">
                              {desc}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <ChevronRight size={20} strokeWidth={1} className="text-zinc-400" />
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </McWidgetCard>
            </div>

            {/* Backups */}
            <div className="w-full grow lg:w-[542px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <div className="flex shrink-0 items-center justify-between">
                  <WidgetHeader
                    icon={<CloudUpload size={20} strokeWidth={1} className="text-zinc-900" />}
                    title="Backups"
                    badge={<McBadge variant="danger">Disabled</McBadge>}
                  />
                  {sites[0] && (
                    <Link
                      href={`/sites/${sites[0].id}?tab=backups`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                      aria-label="Enable backups"
                    >
                      <ChevronRight size={16} className="rotate-[-45deg]" />
                    </Link>
                  )}
                </div>
                <EmptyWidget
                  title="Backups are turned off on all sites."
                  description="Your sites are not protected. Enable backups to secure your content."
                  bullets={[
                    "Never lose data during updates",
                    "Instant recovery from hacks or crashes",
                    "Set it once — and forget it",
                  ]}
                />
              </McWidgetCard>
            </div>

            {/* Manage Updates */}
            <div className="w-full grow lg:w-[1104px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
                  <WidgetHeader
                    icon={<SlidersHorizontal size={20} strokeWidth={1} className="text-zinc-900" />}
                    title="Manage Updates"
                    badge={
                      totalUpdates > 0 ? (
                        <McBadge variant="success">{totalUpdates} Updates</McBadge>
                      ) : (
                        <McBadge variant="success">Up to date</McBadge>
                      )
                    }
                  />
                </div>

                <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
                  {sitesWithUpdates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm font-medium text-muted-foreground">All plugins up to date</p>
                      <p className="mt-1 text-xs text-muted-foreground">No pending updates across your portfolio.</p>
                    </div>
                  ) : (
                    sitesWithUpdates.map((s) => (
                      <Link
                        key={s.id}
                        href={`/sites/${s.id}?tab=plugins`}
                        className="flex items-center justify-between gap-4 rounded-md px-0 py-2 transition-colors hover:bg-zinc-50"
                      >
                        <div className="flex min-w-0 grow items-center gap-4 overflow-hidden">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-50">
                            <SlidersHorizontal size={16} className="text-zinc-600" />
                          </div>
                          <div className="min-w-0 grow overflow-hidden">
                            <div className="truncate text-sm leading-tight text-zinc-900">{s.name}</div>
                            <span className="text-xs leading-tight text-muted-foreground">Site</span>
                          </div>
                        </div>
                        <p className="w-[8.625rem] shrink-0 px-4 text-xs font-medium leading-tight text-emerald-800">
                          {s.plugins_needing_updates} Update{(s.plugins_needing_updates ?? 0) === 1 ? "" : "s"}
                        </p>
                        <ChevronRight size={20} className="shrink-0 text-zinc-400" />
                      </Link>
                    ))
                  )}
                </div>
              </McWidgetCard>
            </div>

            {/* Performance */}
            <div className="w-full grow lg:w-[544px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <WidgetHeader
                  icon={<FileChartColumnIncreasing size={20} strokeWidth={1} className="text-zinc-900" />}
                  title="Performance"
                />
                <div className="flex w-full flex-col gap-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="relative flex h-[166px] w-full max-w-[164px] items-center justify-center">
                      {perfPie.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={perfPie}
                              cx="50%"
                              cy="50%"
                              innerRadius={43}
                              outerRadius={54}
                              dataKey="value"
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              {perfPie.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-zinc-200">
                          <span className="text-xs text-muted-foreground">No data</span>
                        </div>
                      )}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-center text-3xl font-medium leading-9 text-zinc-500">
                          {sites.length}
                        </span>
                        <span className="text-center text-xs leading-4 text-zinc-500">Total Sites</span>
                      </div>
                    </div>
                    <div className="flex w-full max-w-[308px] flex-col gap-2">
                      {[
                        { label: "Good (90-100)", sub: "Avg. loading time < 1.8s", count: perfGood, color: "text-emerald-700/45" },
                        { label: "Needs Improvement (50-89)", sub: "Avg. loading time 2.0 - 3.0s", count: perfMid, color: "text-amber-600/45" },
                        { label: "Poor (<50)", sub: "Avg. loading time > 3.0s", count: perfPoor, color: "text-red-600/45" },
                      ].map(({ label, sub, count, color }) => (
                        <div
                          key={label}
                          className="flex h-[50px] w-full cursor-pointer gap-3 rounded-lg bg-zinc-50/80 p-2 transition-colors hover:bg-zinc-100"
                        >
                          <div className="flex self-start pt-0.5">
                            <span className={cn("inline-block size-2.5 rounded-sm", color.replace("text-", "bg-"))} />
                          </div>
                          <div className="flex w-full justify-between gap-[14px]">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium leading-none text-zinc-700">{label}</p>
                              <p className="text-xs font-normal leading-none text-zinc-400">{sub}</p>
                            </div>
                            <span className="text-xs font-normal leading-4 text-zinc-700">{count} Sites</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </McWidgetCard>
            </div>

            {/* Advanced Monitoring */}
            <div className="w-full grow lg:w-[542px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <div className="flex shrink-0 items-center justify-between gap-4">
                  <WidgetHeader
                    icon={<Activity size={20} strokeWidth={1} className="text-zinc-900" />}
                    title="Advanced Monitoring"
                    badge={
                      sites.length > 0 ? (
                        <McBadge variant="success">
                          {sites.length} Site{sites.length === 1 ? "" : "s"} Monitored
                        </McBadge>
                      ) : undefined
                    }
                  />
                  <Link
                    href="/uptime"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                    aria-label="Open monitoring"
                  >
                    <ChevronRight size={16} className="rotate-[-45deg]" />
                  </Link>
                </div>

                <MonitoringBars
                  rows={[
                    {
                      label: "Disabled",
                      count: monitoringStats.disabled,
                      barClass: "bg-zinc-200",
                      barHoverClass: "group-hover:bg-zinc-300",
                      countClass: "text-zinc-500",
                      countHoverClass: "group-hover:text-zinc-700",
                    },
                    {
                      label: "Warning",
                      count: monitoringStats.warning,
                      barClass: "bg-[#fde8d8]",
                      barHoverClass: "group-hover:bg-[#fad4bc]",
                      countClass: "text-orange-600",
                      countHoverClass: "group-hover:text-orange-700",
                    },
                    {
                      label: "Critical",
                      count: monitoringStats.critical,
                      barClass: "bg-[#fce4e4]",
                      barHoverClass: "group-hover:bg-[#f8caca]",
                      countClass: "text-red-600",
                      countHoverClass: "group-hover:text-red-700",
                    },
                    {
                      label: "Healthy",
                      count: monitoringStats.healthy,
                      barClass: "bg-[#d9f2e6]",
                      barHoverClass: "group-hover:bg-[#c0e8d4]",
                      countClass: "text-emerald-700",
                      countHoverClass: "group-hover:text-emerald-800",
                    },
                  ]}
                />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-zinc-900">Recent Issues</p>
                    <McMenu
                      value={issueFilter}
                      options={[
                        { id: "all", label: "All" },
                        { id: "down", label: "Down" },
                        { id: "malware", label: "Malware" },
                        { id: "ssl", label: "SSL" },
                      ]}
                      onChange={(id) => setIssueFilter(id as "all" | IssueKind)}
                    />
                  </div>

                  <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto">
                    {filteredMonitorIssues.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">No recent monitoring issues</div>
                    ) : (
                      filteredMonitorIssues.map((issue) => (
                        <Link
                          key={issue.id}
                          href={`/sites/${issue.siteId}`}
                          className="flex items-center gap-2.5 rounded-[10px] py-2 transition-colors hover:bg-zinc-50"
                        >
                          <span className="size-[5px] shrink-0 rounded-full bg-red-500" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-none text-zinc-500">{issue.title}</p>
                            <p className="mt-1 truncate text-xs font-normal text-zinc-400">{issue.siteName}</p>
                          </div>
                          <span className="shrink-0 text-xs text-zinc-400">{timeAgo(issue.at)}</span>
                          <ChevronRight size={16} strokeWidth={1} className="shrink-0 text-zinc-400" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </McWidgetCard>
            </div>

            {/* Reports */}
            <div className="w-full grow lg:w-[544px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <div className="flex shrink-0 items-center justify-between gap-4">
                  <WidgetHeader
                    icon={<FileText size={20} strokeWidth={1} className="text-zinc-900" />}
                    title="Reports"
                  />
                  <Link
                    href="/reports"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                    aria-label="Open reports"
                  >
                    <ChevronRight size={16} className="rotate-[-45deg]" />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: "all" as const, label: "All", count: reportCounts.all },
                        { id: "sent" as const, label: "Sent", count: reportCounts.sent },
                        { id: "pending" as const, label: "Processing", count: reportCounts.pending },
                      ] as const
                    ).map(({ id, label, count }) => {
                      const selected = reportsTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setReportsTab(id)}
                          className={cn(
                            "h-8 rounded-md border px-3 text-xs font-normal transition-colors",
                            selected
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          )}
                        >
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {reportsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-zinc-400" />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-zinc-100/80">
                      <FileChartColumnIncreasing size={36} strokeWidth={1} className="text-zinc-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {reports.length === 0 ? "No reports yet" : "No reports in this filter"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generate a report from any site after an audit.
                      </p>
                    </div>
                    <Link
                      href="/reports"
                      className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-900 shadow-xs hover:bg-zinc-50"
                    >
                      View reports
                    </Link>
                  </div>
                ) : (
                  <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto">
                    {filteredReports.slice(0, 8).map((report) => (
                      <Link
                        key={report.id}
                        href={`/reports/${report.site_id}/${report.id}`}
                        className="flex items-center gap-2.5 rounded-[10px] py-2 transition-colors hover:bg-zinc-50"
                      >
                        <FileText size={16} strokeWidth={1.5} className="shrink-0 text-zinc-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-none text-zinc-800">
                            {report.site_name ?? "Site report"}
                          </p>
                          <p className="mt-1 truncate text-xs font-normal text-zinc-400">
                            {report.status === "pending"
                              ? "Generating…"
                              : report.sent_to
                                ? `Sent to ${report.sent_to}`
                                : report.overall_score != null
                                  ? `Score ${report.overall_score}`
                                  : "Completed"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-400">{timeAgo(report.created_at)}</span>
                        <ChevronRight size={16} strokeWidth={1} className="shrink-0 text-zinc-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </McWidgetCard>
            </div>

            {/* Site health overview */}
            <div className="w-full grow lg:w-[1104px] lg:max-w-full">
              <McWidgetCard className="flex flex-col gap-6">
                <WidgetHeader
                  icon={<ShieldX size={20} strokeWidth={1} className="text-zinc-900" />}
                  title="Site Health Overview"
                  badge={
                    threatCount > 0 ? (
                      <McBadge variant="danger">
                        {threatCount} site{threatCount === 1 ? "" : "s"} need attention
                      </McBadge>
                    ) : (
                      <McBadge variant="success">All healthy</McBadge>
                    )
                  }
                />
                {threatCount > 0 && (
                  <div className="inline-flex w-full items-center gap-2.5 rounded-lg bg-red-50 p-4 py-2">
                    <ShieldX size={24} strokeWidth={1.5} className="shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1 text-xs leading-tight text-destructive">
                      {threatCount} site{threatCount === 1 ? "" : "s"} with health issues. Review audits and fix
                      outstanding problems.
                    </div>
                    <Link
                      href="/sites?filter=hacked"
                      className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-white hover:opacity-90"
                    >
                      Review sites
                    </Link>
                  </div>
                )}
                <div className="flex items-end justify-between gap-6">
                  {[
                    { label: "Healthy sites", value: sites.length - threatCount, color: "text-emerald-700" },
                    { label: "At-risk sites", value: threatCount, color: "text-destructive" },
                    { label: "Needs review", value: portfolio?.warning ?? warningSites.length, color: "text-amber-600" },
                    { label: "Disconnected", value: sites.length - connectedCount, color: "text-zinc-900" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex max-w-[118px] flex-col gap-1">
                      <span className={cn("text-xl font-medium opacity-60", color)}>{value}</span>
                      <span className="text-xs leading-4 text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </McWidgetCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
