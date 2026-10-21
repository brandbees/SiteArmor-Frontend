"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Shield, ShieldAlert, ShieldCheck, Key, CheckCircle2, XCircle, AlertCircle, Wrench,
} from "lucide-react";
import { McCard, McPill, ScoreHistoryList } from "@/components/shared/MalCareUI";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import type { Site, Audit } from "@/types";

type HardenAction =
  | "disable_xmlrpc"
  | "disable_file_editor"
  | "disable_debug_mode"
  | "lock_sensitive_files"
  | "block_php_in_uploads";

function sslDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function CheckIcon({ safe }: { safe: boolean | null }) {
  if (safe === true) return <CheckCircle2 size={14} className="shrink-0 text-[var(--score-good)]" />;
  if (safe === false) return <XCircle size={14} className="shrink-0 text-[var(--score-bad)]" />;
  return <span className="shrink-0 text-xs text-muted-foreground">—</span>;
}

export function SecurityTab({
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
  void brandColor;
  const [fixing, setFixing] = useState<HardenAction | "batch" | null>(null);

  const score = site.latest_scores?.security;
  const sslDays = sslDaysRemaining(site.ssl_expiry_date);
  const sslTone =
    sslDays === null ? "neutral" : sslDays <= 7 ? "bad" : sslDays <= 30 ? "warn" : "good";
  const sslLabel =
    sslDays === null ? "Unknown" : sslDays <= 0 ? "Expired" : sslDays <= 30 ? "Expiring soon" : "Valid";
  const adminNames = site.admin_usernames ?? [];
  const hasDefaultAdmin = adminNames.some((n) => n.toLowerCase() === "admin");
  const pluginReady = !!site.plugin_connected;

  const completed = audits.filter((a) => a.status === "completed" && a.scores);
  const trendPts = completed.slice(-10).map((a) => ({
    date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: a.scores!.security,
  }));

  const checks: {
    label: string;
    category: string;
    safe: boolean | null;
    detail: string;
    fixAction?: HardenAction;
  }[] = [
    {
      label: "XML-RPC",
      category: "Access",
      safe: site.xml_rpc_enabled === undefined ? null : !site.xml_rpc_enabled,
      detail: site.xml_rpc_enabled ? "Enabled — exposes attack surface" : "Disabled",
      fixAction: site.xml_rpc_enabled ? "disable_xmlrpc" : undefined,
    },
    {
      label: "Default Login URL",
      category: "Access",
      safe: site.login_url_default === undefined ? null : !site.login_url_default,
      detail: site.login_url_default ? "Using /wp-login.php — change it" : "Custom URL in use",
    },
    {
      label: "Admin Username",
      category: "Accounts",
      safe: hasDefaultAdmin ? false : adminNames.length > 0 ? true : null,
      detail: hasDefaultAdmin
        ? '"admin" username found — rename it'
        : adminNames.length > 0
          ? "No default usernames"
          : "Unknown",
    },
    {
      label: "Admin Account Count",
      category: "Accounts",
      safe: site.admin_users_count == null ? null : site.admin_users_count <= 2,
      detail:
        site.admin_users_count == null
          ? "Unknown"
          : site.admin_users_count <= 2
            ? `${site.admin_users_count} admin${site.admin_users_count !== 1 ? "s" : ""} — acceptable`
            : `${site.admin_users_count} admins — review and reduce`,
    },
    {
      label: "File Editor",
      category: "Files",
      safe: site.file_editor_enabled === undefined ? null : !site.file_editor_enabled,
      detail: site.file_editor_enabled ? "Enabled in admin panel" : "Disabled",
      fixAction: site.file_editor_enabled ? "disable_file_editor" : undefined,
    },
    {
      label: "Debug Mode",
      category: "Files",
      safe: site.wp_debug_enabled === undefined ? null : !site.wp_debug_enabled,
      detail: site.wp_debug_enabled ? "WP_DEBUG on — disable in production" : "Off",
      fixAction: site.wp_debug_enabled ? "disable_debug_mode" : undefined,
    },
    {
      label: "wp-config.php",
      category: "Files",
      safe: site.wp_config_writable === undefined ? null : !site.wp_config_writable,
      detail: site.wp_config_writable ? "Writable — fix file permissions" : "Protected",
      fixAction: site.wp_config_writable ? "lock_sensitive_files" : undefined,
    },
    {
      label: ".htaccess",
      category: "Files",
      safe: site.htaccess_writable === undefined ? null : !site.htaccess_writable,
      detail: site.htaccess_writable ? "Writable — fix file permissions" : "Protected",
      fixAction: site.htaccess_writable ? "lock_sensitive_files" : undefined,
    },
    {
      label: "PHP in Uploads",
      category: "Files",
      safe: site.uploads_php_enabled === undefined ? null : !site.uploads_php_enabled,
      detail: site.uploads_php_enabled ? "PHP execution allowed in /uploads" : "Blocked",
      fixAction: site.uploads_php_enabled ? "block_php_in_uploads" : undefined,
    },
    {
      label: "SSL Certificate",
      category: "SSL",
      safe: sslDays === null ? null : sslDays > 30,
      detail:
        sslDays === null ? "Unknown" : sslDays <= 0 ? "Expired" : `${sslDays} days remaining`,
    },
  ];

  const knownChecks = checks.filter((c) => c.safe !== null);
  const safeCount = knownChecks.filter((c) => c.safe === true).length;
  const issueCount = knownChecks.filter((c) => c.safe === false).length;
  // Unique actions for the API batch; row count for the button label (wp-config + .htaccess share one action)
  const fixableRows = checks.filter((c) => c.safe === false && c.fixAction);
  const quickFixes = [...new Set(fixableRows.map((c) => c.fixAction).filter(Boolean))] as HardenAction[];

  const applyFix = useCallback(
    async (actions: HardenAction[]) => {
      if (!actions.length || fixing || !pluginReady) return;
      const key = actions.length === 1 ? actions[0] : "batch";
      setFixing(key);
      try {
        const { data } = await api.post<{
          success?: boolean;
          applied?: number;
          results?: Array<{ action: string; success: boolean; error?: string; message?: string }>;
        }>(`/scan/sites/${site.id}/protect/apply`, { actions });
        const failed = (data.results || []).filter((r) => !r.success);
        if (data.applied && data.applied > 0) {
          toast.success(
            data.results?.find((r) => r.success)?.message ||
              `Applied ${data.applied} fix${data.applied === 1 ? "" : "es"}`
          );
        }
        if (failed.length) {
          toast.error(failed[0].error || failed[0].message || "Fix failed");
        }
        await api.post("/sites/cache/clear").catch(() => {});
        window.dispatchEvent(new Event("bb:refresh"));
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "Could not apply fix — update Site Armor plugin to 1.13.11+");
      } finally {
        setFixing(null);
      }
    },
    [fixing, pluginReady, site.id]
  );

  return (
    <div className="space-y-4">
      <McCard
        title="Security"
        icon={<Shield size={15} />}
        action={
          <div className="flex items-center gap-2">
            {score != null && (
              <McPill
                tone={score >= 80 ? "good" : score >= 50 ? "warn" : "bad"}
                icon={
                  score >= 80 ? (
                    <ShieldCheck size={11} />
                  ) : score >= 50 ? (
                    <Shield size={11} />
                  ) : (
                    <ShieldAlert size={11} />
                  )
                }
              >
                {score >= 80 ? "Protected" : score >= 50 ? "Needs work" : "At risk"}
              </McPill>
            )}
            {quickFixes.length > 0 && pluginReady && (
              <Button
                size="sm"
                loading={fixing === "batch"}
                disabled={!!fixing}
                onClick={() => void applyFix(quickFixes)}
              >
                <Wrench size={13} />
                Fix all ({fixableRows.length})
              </Button>
            )}
            {canRunAudit && runAudit && (
              <Button size="sm" variant="outline" onClick={runAudit}>
                Scan
              </Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
          <SiteScoreWheel score={score} caption="Security Score" size={118} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {score != null && score <= 0 && issueCount > 0
                ? "Critical security risks failed"
                : issueCount > 0
                  ? `${issueCount} issue${issueCount !== 1 ? "s" : ""} found`
                  : "No threats detected"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {safeCount} of {knownChecks.length} security checks passed
              {score != null && score <= 0 && issueCount > 0
                ? " — score drops to 0 when high-severity risks remain open"
                : ""}
            </p>
            {!pluginReady && quickFixes.length > 0 && (
              <p className="mt-2 text-xs text-amber-800">
                Connect / update the Site Armor plugin (1.13.11+) to enable one-click Fix.
              </p>
            )}
            {trendPts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Recent scores</p>
                <ScoreHistoryList points={trendPts} />
              </div>
            )}
          </div>
        </div>
      </McCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <McCard title="SSL Certificate" icon={<Shield size={15} />}>
          <div className="divide-y divide-border text-xs">
            <div className="flex items-center justify-between py-2 first:pt-0">
              <span className="text-muted-foreground">Domain</span>
              <span className="ml-2 truncate font-semibold text-foreground">
                {site.url.replace(/^https?:\/\//, "")}
              </span>
            </div>
            {site.ssl_expiry_date && (
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-semibold text-foreground">
                  {new Date(site.ssl_expiry_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {sslDays !== null && (
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Days Left</span>
                <span className="font-bold tabular-nums text-foreground">
                  {sslDays <= 0 ? "Expired" : `${sslDays} days`}
                </span>
              </div>
            )}
            <div className="pt-3">
              <McPill tone={sslTone as "neutral" | "good" | "warn" | "bad"}>
                {sslLabel === "Valid" ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {sslLabel}
              </McPill>
            </div>
          </div>
        </McCard>

        <McCard title="Login Checks" icon={<Key size={15} />}>
          <div className="space-y-2.5">
            {[
              { label: "XML-RPC disabled", safe: site.xml_rpc_enabled === undefined ? null : !site.xml_rpc_enabled },
              { label: "Custom login URL", safe: site.login_url_default === undefined ? null : !site.login_url_default },
              { label: "No default admin user", safe: adminNames.length > 0 ? !hasDefaultAdmin : null },
              { label: "wp-config protected", safe: site.wp_config_writable === undefined ? null : !site.wp_config_writable },
            ].map(({ label, safe }) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-foreground">{label}</span>
                <CheckIcon safe={safe} />
              </div>
            ))}
          </div>
        </McCard>

        <McCard title="File Checks" icon={<Shield size={15} />}>
          <div className="space-y-2.5">
            {[
              { label: "File editor disabled", safe: site.file_editor_enabled === undefined ? null : !site.file_editor_enabled },
              { label: "Debug mode off", safe: site.wp_debug_enabled === undefined ? null : !site.wp_debug_enabled },
              { label: ".htaccess protected", safe: site.htaccess_writable === undefined ? null : !site.htaccess_writable },
              { label: "PHP in uploads blocked", safe: site.uploads_php_enabled === undefined ? null : !site.uploads_php_enabled },
            ].map(({ label, safe }) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-foreground">{label}</span>
                <CheckIcon safe={safe} />
              </div>
            ))}
          </div>
        </McCard>

        <McCard
          title="Admin Accounts"
          icon={<Key size={15} />}
          action={
            site.admin_users_count != null ? (
              <McPill
                tone={
                  site.admin_users_count > 4 ? "bad" : site.admin_users_count > 2 ? "warn" : "good"
                }
              >
                {site.admin_users_count} admin{site.admin_users_count !== 1 ? "s" : ""}
              </McPill>
            ) : null
          }
        >
          {adminNames.length > 0 ? (
            <div className="divide-y divide-border">
              {adminNames.map((name) => {
                const risky = name.toLowerCase() === "admin";
                return (
                  <div key={name} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                        risky
                          ? "bg-[var(--score-bad-bg)] text-[var(--score-bad)]"
                          : "bg-accent-light text-accent"
                      }`}
                    >
                      {name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                      {name}
                    </span>
                    {risky ? (
                      <AlertCircle size={14} className="shrink-0 text-[var(--score-bad)]" />
                    ) : (
                      <CheckCircle2 size={14} className="shrink-0 text-[var(--score-good)]" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Connect the plugin to view accounts
            </p>
          )}
        </McCard>
      </div>

      <McCard
        title="Security Checks"
        icon={<Shield size={15} />}
        action={
          <McPill tone={issueCount === 0 ? "good" : "warn"}>
            {safeCount}/{knownChecks.length} passed
          </McPill>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Check", "Category", "Status", "Details", "Action"].map((h) => (
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
              {checks.map(({ label, category, safe, detail, fixAction }) => (
                <tr key={label} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">{label}</td>
                  <td className="px-4 py-2.5">
                    <McPill tone="neutral">{category}</McPill>
                  </td>
                  <td className="px-4 py-2.5">
                    {safe === true ? (
                      <McPill tone="good">
                        <CheckCircle2 size={10} /> Safe
                      </McPill>
                    ) : safe === false ? (
                      <McPill tone="bad">
                        <XCircle size={10} /> Risk
                      </McPill>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{detail}</td>
                  <td className="px-4 py-2.5">
                    {fixAction && safe === false ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!pluginReady || !!fixing}
                        loading={fixing === fixAction}
                        onClick={() => void applyFix([fixAction])}
                        title={
                          pluginReady
                            ? "Apply one-click fix via Site Armor plugin"
                            : "Plugin required"
                        }
                      >
                        <Wrench size={12} />
                        Fix
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </McCard>
    </div>
  );
}
