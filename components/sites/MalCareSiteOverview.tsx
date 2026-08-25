"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  BookUp,
  ChevronRight,
  CloudUpload,
  Download,
  EarthLock,
  FileChartColumnIncreasing,
  FileChartLine,
  FileClock,
  Globe,
  Info,
  LayoutList,
  List,
  Loader2,
  Lock,
  LockOpen,
  Palette,
  Plug,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersVertical,
  SquareActivity,
  Bug,
  FileCode2,
} from "lucide-react";
import { DASHBOARD_GRADIENT } from "@/components/dashboard/MalCareDashboard";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { WordPressIcon } from "@/components/shared/WordPressIcon";
import { SiteScreenshot } from "@/components/sites/SiteScreenshot";
import type { SiteTab } from "@/components/sites/site-nav";
import api from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import type { Audit, Plugin, Site } from "@/types";
import { toast } from "sonner";
import { CubeLoader } from "@/components/sites/SiteLoadingOverlay";

export type SiteOverviewTab = Exclude<SiteTab, "overview">;

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
        "flex h-full min-h-0 w-full flex-col justify-stretch gap-8 overflow-hidden rounded-3xl border border-zinc-200 bg-[#FDFDFD] p-6 shadow-xs",
        className
      )}
    >
      {children}
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
    <div className="flex w-full shrink-0 items-center justify-between gap-4">
      <header className="flex min-w-0 flex-1 items-end gap-2 overflow-hidden">
        {icon}
        <span className="truncate text-lg font-medium leading-none text-zinc-900">{title}</span>
        {badge}
      </header>
      {action ? <div className="shrink-0">{action}</div> : null}
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
        "ml-1 inline-flex h-5 items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-normal",
        styles[variant]
      )}
    >
      {children}
    </div>
  );
}

function McSwitch({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-colors",
        checked ? "bg-accent" : "bg-zinc-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
          checked ? "translate-x-[1.125rem]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function EmptyWidget({
  icon,
  title,
  description,
  bullets,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-100/80">
        {icon ?? <CloudUpload size={40} strokeWidth={1} className="text-zinc-300" />}
      </div>
      <div className="flex flex-col items-center gap-2">
        <h6 className="font-medium leading-normal text-muted-foreground">{title}</h6>
        <p className="text-xs leading-normal text-muted-foreground">{description}</p>
      </div>
      {bullets && bullets.length > 0 && (
        <div className="flex w-full flex-col gap-2 rounded-xl bg-zinc-50 px-4 py-2">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              <span className="text-left text-xs font-normal text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>
      )}
      {action}
    </div>
  );
}

function WidgetSlot({
  width,
  children,
}: {
  width: 648 | 544 | 1104;
  children: ReactNode;
}) {
  const widthClass =
    width === 648 ? "lg:w-[648px]" : width === 544 ? "lg:w-[544px]" : "lg:w-[1104px]";
  return (
    <div className={cn("flex h-auto grow overflow-hidden [&>*]:h-full [&>*]:w-full", widthClass)}>
      {children}
    </div>
  );
}

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function MonitorStatusBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex h-6 items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-normal leading-none text-zinc-700">
      <span className="h-2 w-2 rounded-full bg-zinc-400" />
      {label}
    </div>
  );
}

function formatLastChecked(iso?: string | null): string {
  if (!iso) return "Last checked: —";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms) || ms > Date.now()) return "Last checked: —";
  return `Last checked: ${timeAgo(iso)}`;
}

function MonitorRow({
  href,
  icon,
  title,
  subtitle,
  status,
  metric,
  insight,
  onClick,
}: {
  href?: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: string;
  metric: string;
  insight?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 p-0.5">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 pr-2 sm:min-w-[180px]">
          <p className="text-sm font-medium leading-5 text-muted-foreground">{title}</p>
          <p className="truncate text-xs font-normal text-accent">{subtitle}</p>
        </div>
        <div className="flex w-[186px] min-w-[186px] max-w-[186px] shrink-0 items-center px-2">
          <MonitorStatusBadge label={status} />
        </div>
        <div className="flex w-[208px] min-w-[208px] max-w-[208px] shrink-0 items-center px-2">
          <p className="truncate text-xs font-normal text-zinc-700">{metric}</p>
        </div>
        <div className="flex min-w-[200px] max-w-[322px] flex-1 items-center px-2">
          <p className="truncate text-xs font-normal text-zinc-500">
            {insight ?? "Enable monitor to get insights"}
          </p>
        </div>
        <div className="flex w-10 min-w-[40px] max-w-[40px] shrink-0 items-center justify-end pl-2">
          <ChevronRight size={20} strokeWidth={1} className="text-zinc-700" aria-hidden />
        </div>
      </div>
    </>
  );

  const className =
    "flex h-16 w-full min-w-[960px] cursor-pointer items-center gap-4 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function UpdateListItem({ plugin }: { plugin: Plugin }) {
  return (
    <div className="flex max-w-full items-center gap-3 py-2">
      <input
        type="checkbox"
        readOnly
        className="h-4 w-4 shrink-0 rounded-sm border border-zinc-300"
        aria-label={`Select ${plugin.name}`}
      />
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-50">
          <Plug size={16} strokeWidth={1} className="text-zinc-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-tight text-zinc-900">{plugin.name}</p>
          <p className="text-xs text-muted-foreground">Plugin</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 px-2">
        <span className="text-xs text-muted-foreground">{plugin.version}</span>
        {plugin.new_version && (
          <span className="flex max-w-fit items-center gap-1 rounded-2xl bg-zinc-100 px-2 py-1">
            <ArrowRight size={12} strokeWidth={1.5} />
            <span className="text-xs">{plugin.new_version}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md hover:bg-zinc-50"
        aria-label={`Update ${plugin.name}`}
      >
        <BookUp size={16} strokeWidth={1} />
      </button>
    </div>
  );
}

export function MalCareSiteOverview({
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
  const wpVersion = site.plugin_data?.wp_version ?? "—";
  const phpVersion = site.plugin_data?.php_version ?? "—";
  const pluginCount =
    site.plugin_data?.active_plugins_count ??
    site.plugin_data?.plugins?.filter((p) => p.status === "active").length ??
    null;

  const [backupSchedule, setBackupSchedule] = useState("manual");
  const [analyticsConnected, setAnalyticsConnected] = useState<boolean | null>(null);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [reports, setReports] = useState<
    { id: string; status: string; overall_score: number | null; created_at: string }[]
  >([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activity, setActivity] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [backups, setBackups] = useState<{ status: string; created_at: string; size_mb?: number }[]>([]);
  const [updateSearch, setUpdateSearch] = useState("");
  const [advMonitors, setAdvMonitors] = useState<
    {
      monitor_type: string;
      enabled: boolean;
      status: string;
      last_checked_at?: string | null;
      last_result?: { summary?: string; days_remaining?: number | null } | null;
    }[]
  >([]);
  const [advMonitorsLoading, setAdvMonitorsLoading] = useState(true);
  const [monitorBusy, setMonitorBusy] = useState<string | null>(null);
  const [backupToggling, setBackupToggling] = useState(false);
  const [gaConnecting, setGaConnecting] = useState(false);

  const refreshAdvMonitors = () =>
    api
      .get<{ monitors: typeof advMonitors }>(`/sites/${site.id}/monitors`)
      .then(({ data }) => setAdvMonitors(data.monitors ?? []))
      .catch(() => setAdvMonitors([]));

  useEffect(() => {
    setAdvMonitorsLoading(true);
    refreshAdvMonitors().finally(() => setAdvMonitorsLoading(false));
  }, [site.id]);

  const toggleMonitor = async (type: string, enabled: boolean) => {
    setMonitorBusy(type);
    try {
      await api.patch(`/sites/${site.id}/monitors/${type}`, { enabled });
      await refreshAdvMonitors();
    } catch {
      /* toast optional */
    } finally {
      setMonitorBusy(null);
    }
  };

  const runMonitor = async (type: string) => {
    setMonitorBusy(type);
    try {
      await api.post(`/sites/${site.id}/monitors/${type}/run`);
      await refreshAdvMonitors();
    } catch {
      /* ignore */
    } finally {
      setMonitorBusy(null);
    }
  };

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
  const backupsEnabled = backupSchedule !== "manual";
  const perfScore = scores?.performance ?? site.overall_score ?? null;

  const toggleBackups = async () => {
    if (backupToggling) return;
    const next = backupsEnabled ? "manual" : "daily";
    setBackupToggling(true);
    try {
      await api.patch(`/backups/${site.id}/schedule`, { backup_schedule: next });
      setBackupSchedule(next);
      toast.success(next === "manual" ? "Scheduled backups turned off" : "Daily backups enabled");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; upgrade?: boolean } } })?.response
        ?.data;
      if (data?.upgrade) {
        toast.error(data.error || "Upgrade required for scheduled backups");
      } else {
        toast.error(data?.error || "Could not update backup schedule");
      }
    } finally {
      setBackupToggling(false);
    }
  };

  const connectGoogleAnalytics = async () => {
    if (gaConnecting) return;
    setGaConnecting(true);
    try {
      const { data } = await api.get<{ url: string }>(`/analytics/${site.id}/google/auth-url`);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Could not start Google Analytics connection");
    } catch {
      toast.error("Could not start Google Analytics connection");
    } finally {
      setGaConnecting(false);
    }
  };

  const pendingPlugins = useMemo(
    () => (site.plugin_data?.plugins ?? []).filter((p) => p.update_available),
    [site.plugin_data?.plugins]
  );

  const filteredUpdates = useMemo(() => {
    const q = updateSearch.trim().toLowerCase();
    if (!q) return pendingPlugins;
    return pendingPlugins.filter((p) => p.name.toLowerCase().includes(q));
  }, [pendingPlugins, updateSearch]);

  const alerts = useMemo(() => {
    const items: { title: string; description: string; onClick: () => void }[] = [];
    if (updates > 0) {
      items.push({
        title: `${updates} Plugin Update${updates === 1 ? "" : "s"} Available`,
        description: `${updates} plugin${updates === 1 ? "" : "s"} need updates.`,
        onClick: () => setTab("plugins"),
      });
    }
    if (site.malware_status === "threat") {
      items.push({
        title: "Malware Detected",
        description: "Run a security scan to review threats.",
        onClick: () => setTab("malware"),
      });
    }
    if (sslDays != null && sslDays < 30 && sslDays >= 0) {
      items.push({
        title: "SSL Certificate Expiring Soon",
        description: `Certificate expires in ${sslDays} day${sslDays === 1 ? "" : "s"}.`,
        onClick: () => setTab("uptime"),
      });
    }
    if (down) {
      items.push({
        title: "Site is Down",
        description: "Uptime monitor reports the site is unreachable.",
        onClick: () => setTab("uptime"),
      });
    }
    return items;
  }, [updates, site.malware_status, sslDays, down, setTab]);

  const domain = (() => {
    try {
      return new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`).hostname;
    } catch {
      return site.url;
    }
  })();

  return (
    <div
      className="min-h-full w-full overflow-auto"
      style={{ background: DASHBOARD_GRADIENT }}
    >
      <div className="mx-auto p-4 pr-6" style={{ width: "min(107.125rem, 100%)" }}>
        <div className="flex flex-wrap items-stretch gap-4">
          {/* Site Summary */}
          <WidgetSlot width={648}>
            <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-accent/40 bg-[#FDFDFD] shadow-xs">
              <div className="flex flex-col gap-8 p-6 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <header className="flex items-end gap-2">
                      <Globe size={20} strokeWidth={1} className="text-zinc-900" />
                      <span className="text-lg font-medium leading-none text-zinc-900">Site Summary</span>
                    </header>
                    <div className="flex h-6 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1">
                      <span className="text-sm font-medium text-zinc-800">
                        {site.plugin_connected ? "Connected" : "Free"}
                      </span>
                    </div>
                  </div>
                  {!site.plugin_connected && (
                    <span className="inline-flex h-6 items-center rounded-md border border-zinc-200 bg-white px-2 text-xs font-normal text-muted-foreground shadow-xs">
                      Not connected
                    </span>
                  )}
                </div>

                <div className="flex gap-6">
                  <div className="relative shrink-0">
                    <div className="h-[112px] w-[184px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-100">
                      <SiteScreenshot
                        url={site.url}
                        connected={site.plugin_connected}
                        hacked={site.malware_status === "threat"}
                        width={368}
                        className="h-full w-full"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent text-white hover:bg-accent-hover"
                      aria-label="Site lock status"
                    >
                      {online ? <LockOpen size={12} /> : <Lock size={12} />}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-6 pl-1">
                      <div className="flex items-center gap-2">
                        <WordPressIcon size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{wpVersion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold lowercase text-white">
                          php
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{phpVersion}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTab("plugins")}
                      className="flex max-w-fit items-center gap-2 transition-opacity hover:opacity-80"
                    >
                      <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50">
                        <Plug size={16} strokeWidth={1} className="text-zinc-600" />
                        {updates > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-xs font-medium text-zinc-600">
                            {updates}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-xs text-zinc-800">
                        Active Plugins: {pluginCount ?? "—"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab("plugins")}
                      className="flex max-w-fit items-center gap-2 transition-opacity hover:opacity-80"
                    >
                      <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50">
                        <Palette size={16} strokeWidth={1} className="text-zinc-600" />
                      </div>
                      <span className="truncate text-xs text-zinc-800">Manage themes & plugins</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  {online ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-zinc-900">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Site is Online
                    </span>
                  ) : down ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Site is Down
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      Status unknown
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-hidden border-t border-zinc-100 bg-zinc-50 p-6">
                <div className="space-y-6">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts for this site.</p>
                  ) : (
                    alerts.map((alert) => (
                      <button
                        key={alert.title}
                        type="button"
                        onClick={alert.onClick}
                        className="group flex w-full items-start gap-3 text-left transition-all hover:underline"
                      >
                        <div className="flex aspect-square items-center justify-center rounded-sm bg-amber-50 p-1">
                          <Download size={16} strokeWidth={1.5} className="text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 group-hover:underline">
                            {alert.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {alerts.length > 0 && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setTab("issues")}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-accent shadow-xs hover:bg-zinc-50"
                    >
                      <List size={16} strokeWidth={1} />
                      View All ({alerts.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </WidgetSlot>

          {/* Backups */}
          <WidgetSlot width={544}>
            <McWidgetCard>
              <WidgetHeader
                icon={<CloudUpload size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Backups"
                action={
                  <McSwitch
                    checked={backupsEnabled}
                    disabled={backupToggling}
                    onClick={() => void toggleBackups()}
                  />
                }
              />
              {backupsLoading ? (
                <CubeLoader label="Loading backups" sublabel="Checking schedule and history…" />
              ) : lastBackup ? (
                <div className="space-y-2 px-2">
                  <p className="text-sm font-medium text-zinc-900">Last backup</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(lastBackup.created_at)}
                    {lastBackup.size_mb ? ` · ${lastBackup.size_mb} MB` : ""}
                  </p>
                </div>
              ) : (
                <EmptyWidget
                  title="Backups are turned off."
                  description="Even a small glitch could wipe out days of work. Enable backups for 24/7 site safety."
                  bullets={[
                    "Never lose data during updates",
                    "Instant recovery from hacks or crashes",
                    "Set it once — and forget it",
                  ]}
                />
              )}
            </McWidgetCard>
          </WidgetSlot>

          {/* Performance */}
          <WidgetSlot width={544}>
            <McWidgetCard>
              <WidgetHeader
                icon={<FileChartColumnIncreasing size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Performance"
                badge={
                  perfScore != null && perfScore < 80 ? (
                    <McBadge variant="warn">Needs Improvement</McBadge>
                  ) : undefined
                }
                action={
                  <button
                    type="button"
                    onClick={() => setTab("performance")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                    aria-label="View performance details"
                  >
                    <ArrowUpRight size={16} strokeWidth={1} />
                  </button>
                }
              />
              <div className="flex min-h-0 flex-1 flex-col gap-6">
                <div className="grid grid-cols-5 items-stretch gap-6">
                  <div className="col-span-2 flex flex-col items-center justify-center gap-2">
                    {perfScore != null ? (
                      <SiteScoreWheel score={perfScore} caption="Site Score" size={144} />
                    ) : (
                      <div className="flex h-[144px] w-[144px] items-center justify-center rounded-full border-2 border-dashed border-zinc-200 text-sm text-zinc-400">
                        No score
                      </div>
                    )}
                    {site.avg_response_ms != null && (
                      <p className="text-xs text-zinc-900">
                        Load Time: <span className="text-accent">{(site.avg_response_ms / 1000).toFixed(1)} s</span>
                      </p>
                    )}
                  </div>
                  <div className="col-span-3 flex flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm font-medium text-zinc-900">Performance Trend</p>
                    <p className="text-xs text-muted-foreground">Trend data will appear after 24 hours</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-4">
                <p className="text-xs text-zinc-900">
                  Status:{" "}
                  <span className="font-semibold">
                    {perfScore == null ? "No data" : perfScore >= 80 ? "Good" : "Needs improvement"}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setTab("performance")}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-accent hover:bg-zinc-200"
                >
                  <FileChartColumnIncreasing size={16} strokeWidth={1} />
                  View Report
                </button>
                </div>
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Site Health */}
          <WidgetSlot width={1104}>
            <McWidgetCard>
              <WidgetHeader
                icon={<ShieldCheck size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Site Health"
                badge={
                  site.malware_status === "threat" ? (
                    <McBadge variant="danger">Issues found</McBadge>
                  ) : latestAudit ? (
                    <McBadge variant="success">Scanned</McBadge>
                  ) : (
                    <McBadge variant="warn">Not scanned</McBadge>
                  )
                }
                action={
                  <button
                    type="button"
                    onClick={() => setTab("health")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                    aria-label="View site health details"
                  >
                    <ArrowUpRight size={16} strokeWidth={1} />
                  </button>
                }
              />
              {site.malware_status === "threat" || latestAudit ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {(
                    [
                      ["Malware", site.malware_status === "clean" || !site.malware_status ? "Clean" : "Detected"],
                      ["Vulnerabilities", String(site.plugin_vuln_count ?? 0)],
                      ["SSL", sslDays == null ? "—" : sslDays < 0 ? "Expired" : `${sslDays}d left`],
                      ["Uptime", site.uptime_percentage != null ? `${site.uptime_percentage.toFixed(1)}%` : "—"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyWidget
                  icon={<ShieldCheck size={40} strokeWidth={1} className="text-zinc-300" />}
                  title="No health scan yet."
                  description="Run a site audit to review malware signals, plugin vulnerabilities, SSL, and uptime."
                  action={
                    canRunAudit ? (
                      <button
                        type="button"
                        onClick={runAudit}
                        disabled={auditLoading}
                        className="inline-flex h-8 items-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-accent hover:bg-zinc-200 disabled:opacity-50"
                      >
                        <Settings2 size={16} strokeWidth={1} />
                        {auditLoading ? "Scanning…" : "Run Site Audit"}
                      </button>
                    ) : undefined
                  }
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    site.malware_status === "threat" || (site.plugin_vuln_count ?? 0) > 0
                      ? "bg-amber-400"
                      : latestAudit
                        ? "bg-green-500"
                        : "bg-zinc-300"
                  )}
                />
                <p className="text-xs text-zinc-700">
                  Status:{" "}
                  <span className="font-semibold">
                    {site.malware_status === "threat" || (site.plugin_vuln_count ?? 0) > 0
                      ? "Needs attention"
                      : latestAudit
                        ? "Healthy"
                        : "Awaiting first scan"}
                  </span>
                  {latestAudit?.completed_at ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · Last scan {timeAgo(latestAudit.completed_at)}
                    </span>
                  ) : null}
                </p>
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Manage Updates */}
          <WidgetSlot width={1104}>
            <McWidgetCard className="gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <WidgetHeader
                  icon={<SlidersVertical size={20} strokeWidth={1} className="text-zinc-900" />}
                  title="Manage Updates"
                  badge={
                    updates > 0 ? (
                      <McBadge variant="success">{updates} Updates</McBadge>
                    ) : (
                      <McBadge variant="success">Up to date</McBadge>
                    )
                  }
                />
                <div className="relative flex h-8 w-[240px] items-center gap-2.5 rounded-lg bg-zinc-100 px-3 py-2">
                  <Search size={16} strokeWidth={1} className="shrink-0 text-zinc-950" />
                  <input
                    type="text"
                    value={updateSearch}
                    onChange={(e) => setUpdateSearch(e.target.value)}
                    placeholder="Search plugins, themes..."
                    className="h-full min-w-0 flex-1 border-none bg-transparent text-xs outline-none placeholder:text-xs placeholder:text-muted-foreground"
                    aria-label="Search plugins and themes"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-auto py-2 pr-2">
                {filteredUpdates.length === 0 ? (
                  <EmptyWidget
                    icon={<Plug size={40} strokeWidth={1} className="text-zinc-300" />}
                    title={updates > 0 ? "No matching updates" : "All plugins up to date"}
                    description={
                      updates > 0
                        ? "Try a different search term."
                        : "No pending plugin, theme, or core updates."
                    }
                  />
                ) : (
                  filteredUpdates.slice(0, 10).map((plugin) => (
                    <UpdateListItem key={plugin.slug ?? plugin.name} plugin={plugin} />
                  ))
                )}
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setTab("plugins")}
                  disabled={updates === 0}
                  className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  <BookUp size={16} strokeWidth={1} />
                  Update
                </button>
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Scheduled Reports */}
          <WidgetSlot width={544}>
            <McWidgetCard>
              <WidgetHeader
                icon={<FileChartLine size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Scheduled Reports"
                action={
                  <Link
                    href={`/reports/${site.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                    aria-label="Open reports"
                  >
                    <ArrowUpRight size={16} strokeWidth={1} />
                  </Link>
                }
              />
              <div className="flex min-h-0 flex-1 flex-col gap-8">
              {reportsLoading ? (
                <CubeLoader label="Loading reports" sublabel="Fetching scheduled report history…" />
              ) : reports.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-zinc-900">Latest report</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(reports[0].created_at)}</p>
                  {reports[0].overall_score != null && (
                    <McBadge variant="success">{reports[0].overall_score}/100</McBadge>
                  )}
                </div>
              ) : (
                <EmptyWidget
                  icon={<FileChartLine size={40} strokeWidth={1} className="text-zinc-300" />}
                  title="Send reports on autopilot."
                  description="Choose a frequency, select a client, and hit go!"
                  action={
                    <Link
                      href={`/reports/${site.id}`}
                      className="inline-flex h-8 items-center gap-2 rounded-md bg-zinc-100 px-4 text-xs font-normal text-accent hover:bg-zinc-200"
                    >
                      <FileClock size={16} strokeWidth={1} />
                      Set up a Scheduled Report
                    </Link>
                  }
                />
              )}
              <div className="mt-auto flex items-center gap-2.5 rounded-lg bg-sky-50 p-4">
                <Info size={20} strokeWidth={1.5} className="shrink-0 text-sky-700" />
                <p className="min-w-0 flex-1 text-xs leading-tight text-sky-700">
                  <span className="font-medium">Generate a One-Time Report instead?</span>
                </p>
                <Link
                  href={`/reports/${site.id}`}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 text-sm font-medium text-accent shadow-xs hover:bg-zinc-50"
                >
                  <Plus size={16} strokeWidth={1} />
                  New Report
                </Link>
              </div>
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Activity Log */}
          <WidgetSlot width={544}>
            <McWidgetCard>
              <WidgetHeader
                icon={<LayoutList size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Activity Log"
                action={
                  <McSwitch
                    checked={activity.length > 0}
                    onClick={() => router.push("/settings/activity")}
                  />
                }
              />
              <div className="flex min-h-0 flex-1 flex-col">
              {activityLoading ? (
                <CubeLoader label="Loading activity" sublabel="Fetching recent site actions…" />
              ) : activity.length === 0 ? (
                <EmptyWidget
                  icon={<LayoutList size={40} strokeWidth={1} className="text-zinc-300" />}
                  title="Activity Logging Disabled"
                  description="Enable activity logging to track WordPress actions, updates, and changes on your site."
                />
              ) : (
                <ul className="w-full divide-y divide-zinc-100">
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
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Google Analytics */}
          <WidgetSlot width={544}>
            <McWidgetCard>
              <WidgetHeader
                icon={<BarChart2 size={20} strokeWidth={1} className="text-zinc-900" />}
                title="Google Analytics"
              />
              <div className="flex min-h-0 flex-1 flex-col">
              {analyticsConnected === null ? (
                <CubeLoader label="Checking Analytics" sublabel="Looking up GA4 connection…" />
              ) : analyticsConnected ? (
                <div className="w-full space-y-2 text-center">
                  <p className="text-sm font-medium text-zinc-900">Google Analytics connected</p>
                  <p className="text-xs text-muted-foreground">View traffic in the Performance tab.</p>
                  <button
                    type="button"
                    onClick={() => setTab("performance")}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Open analytics →
                  </button>
                </div>
              ) : (
                <EmptyWidget
                  icon={<BarChart2 size={40} strokeWidth={1} className="text-zinc-300" />}
                  title="Get Started with Google Analytics"
                  description="Connect GA4 to see sessions, page views, and engagement for this site."
                  action={
                    <button
                      type="button"
                      onClick={() => void connectGoogleAnalytics()}
                      disabled={gaConnecting}
                      className="inline-flex h-8 items-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-accent hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {gaConnecting ? (
                        <Loader2 size={16} strokeWidth={1} className="animate-spin" />
                      ) : (
                        <BarChart2 size={16} strokeWidth={1} />
                      )}
                      {gaConnecting ? "Connecting…" : "Connect Google Analytics"}
                    </button>
                  }
                />
              )}
              </div>
            </McWidgetCard>
          </WidgetSlot>

          {/* Advanced Monitoring */}
          <WidgetSlot width={1104}>
            <McWidgetCard className="gap-6">
              {(() => {
                const uptimeActive =
                  site.uptime_status === "up" ||
                  site.uptime_status === "down" ||
                  Boolean(site.last_uptime_check_at);
                const sslActive = site.ssl_expiry_date != null;

                const byType = Object.fromEntries(
                  advMonitors.map((m) => [m.monitor_type, m])
                ) as Record<string, (typeof advMonitors)[number]>;

                const statusLabel = (m?: (typeof advMonitors)[number]) => {
                  if (!m || !m.enabled) return "Off";
                  if (monitorBusy === m.monitor_type) return "Checking";
                  if (m.status === "healthy") return "Healthy";
                  if (m.status === "warning") return "Warning";
                  if (m.status === "critical") return "Critical";
                  if (m.status === "disabled") return "Off";
                  return "Unknown";
                };

                const monitors = [
                  uptimeActive
                    ? {
                        key: "uptime",
                        title: "Uptime Monitor",
                        subtitle: domain,
                        status: online ? "Up" : down ? "Down" : "Checking",
                        metric: formatLastChecked(site.last_uptime_check_at),
                        insight: online
                          ? "Site is responding normally"
                          : down
                            ? "Site is unreachable — investigate now"
                            : "Waiting for the next uptime check",
                        icon: <SquareActivity size={20} strokeWidth={1} className="text-muted-foreground" />,
                        onClick: () => setTab("uptime"),
                      }
                    : null,
                  sslActive
                    ? {
                        key: "ssl",
                        title: "SSL Monitor",
                        subtitle: domain,
                        status:
                          sslDays != null && sslDays < 0
                            ? "Expired"
                            : sslDays != null && sslDays < 30
                              ? "Expiring"
                              : "Valid",
                        metric: formatLastChecked(site.ssl_expiry_date),
                        insight:
                          sslDays != null && sslDays < 0
                            ? "SSL certificate has expired"
                            : sslDays != null && sslDays < 30
                              ? `Certificate expires in ${sslDays} day${sslDays === 1 ? "" : "s"}`
                              : "Certificate is valid",
                        icon: <EarthLock size={20} strokeWidth={1} className="text-muted-foreground" />,
                        onClick: () => setTab("uptime"),
                      }
                    : null,
                  {
                    key: "domain",
                    title: "Domain Monitor",
                    subtitle: domain,
                    status: statusLabel(byType.domain),
                    metric: formatLastChecked(byType.domain?.last_checked_at),
                    insight:
                      byType.domain?.last_result?.summary ||
                      (byType.domain?.enabled
                        ? "Watching DNS and domain expiry"
                        : "Enable to track DNS changes and expiry"),
                    icon: <Globe size={20} strokeWidth={1} className="text-muted-foreground" />,
                    onClick: () => {
                      if (!byType.domain?.enabled) void toggleMonitor("domain", true);
                      else void runMonitor("domain");
                    },
                  },
                  {
                    key: "page_content",
                    title: "Page Content Monitor",
                    subtitle: domain,
                    status: statusLabel(byType.page_content),
                    metric: formatLastChecked(byType.page_content?.last_checked_at),
                    insight:
                      byType.page_content?.last_result?.summary ||
                      (byType.page_content?.enabled
                        ? "Comparing homepage against baseline"
                        : "Enable to detect unexpected homepage changes"),
                    icon: <FileCode2 size={20} strokeWidth={1} className="text-muted-foreground" />,
                    onClick: () => {
                      if (!byType.page_content?.enabled) void toggleMonitor("page_content", true);
                      else void runMonitor("page_content");
                    },
                  },
                  {
                    key: "php_error",
                    title: "PHP Error Monitor",
                    subtitle: site.plugin_connected ? "debug.log" : "Plugin required",
                    status: statusLabel(byType.php_error),
                    metric: formatLastChecked(byType.php_error?.last_checked_at),
                    insight:
                      byType.php_error?.last_result?.summary ||
                      (!site.plugin_connected
                        ? "Connect the Site Armor plugin to read PHP errors"
                        : byType.php_error?.enabled
                          ? "Scanning WordPress debug.log for PHP errors"
                          : "Enable to watch for fatal errors and warnings"),
                    icon: <Bug size={20} strokeWidth={1} className="text-muted-foreground" />,
                    onClick: () => {
                      if (!site.plugin_connected) return;
                      if (!byType.php_error?.enabled) void toggleMonitor("php_error", true);
                      else void runMonitor("php_error");
                    },
                  },
                ].filter(Boolean) as {
                  key: string;
                  title: string;
                  subtitle: string;
                  status: string;
                  metric: string;
                  insight: string;
                  icon: ReactNode;
                  onClick: () => void;
                }[];

                const activeCount = monitors.filter((m) => {
                  if (m.key === "uptime" || m.key === "ssl") return true;
                  const row = byType[m.key];
                  return Boolean(row?.enabled);
                }).length;

                return (
                  <>
                    <WidgetHeader
                      icon={<Activity size={20} strokeWidth={1} className="text-zinc-900" />}
                      title="Advanced Monitoring"
                      badge={
                        advMonitorsLoading ? (
                          <McBadge variant="neutral">Loading…</McBadge>
                        ) : activeCount > 0 ? (
                          <McBadge variant="success">
                            {activeCount} Monitor{activeCount === 1 ? "" : "s"} Active
                          </McBadge>
                        ) : (
                          <McBadge variant="warn">No Monitors Active</McBadge>
                        )
                      }
                      action={
                        <button
                          type="button"
                          onClick={() => setTab("uptime")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs hover:bg-zinc-50"
                          aria-label="Open advanced monitoring"
                        >
                          <ArrowUpRight size={16} strokeWidth={1} />
                        </button>
                      }
                    />
                    <div className="-mx-2 overflow-x-auto">
                      <div className="flex flex-col gap-1 px-2">
                        {monitors.map((m) => (
                          <MonitorRow
                            key={m.key}
                            onClick={m.onClick}
                            icon={m.icon}
                            title={m.title}
                            subtitle={m.subtitle}
                            status={m.status}
                            metric={m.metric}
                            insight={m.insight}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full",
                          activeCount > 0 ? "bg-emerald-500" : "bg-amber-400"
                        )}
                      />
                      <p className="text-xs text-zinc-700">
                        Active monitors:{" "}
                        <span className="font-semibold">
                          {activeCount > 0 ? activeCount : "None"}
                        </span>
                        {monitorBusy ? (
                          <span className="ml-2 text-zinc-500">Running {monitorBusy}…</span>
                        ) : null}
                      </p>
                    </div>
                  </>
                );
              })()}
            </McWidgetCard>
          </WidgetSlot>
        </div>
      </div>
    </div>
  );
}
