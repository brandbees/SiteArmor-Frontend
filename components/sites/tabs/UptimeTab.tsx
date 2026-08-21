"use client";

import { useState, useEffect } from "react";
import {
  Activity, AlertCircle, Clock, CheckCircle2, Bell, Wifi,
} from "lucide-react";
import { McCard, McPill } from "@/components/shared/MalCareUI";
import api from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { Site, AlertSettings } from "@/types";

export function UptimeTab({ site, brandColor }: { site: Site; brandColor: string }) {
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [responseHistory, setResponseHistory] = useState<
    { day: string; avg_ms: number; uptime_pct: number }[]
  >([]);

  useEffect(() => {
    api
      .get<AlertSettings>(`/alerts/${site.id}`)
      .then(({ data }) => setAlertSettings(data))
      .catch(() => {});
  }, [site.id]);

  useEffect(() => {
    api
      .get<{ history: { day: string; avg_ms: number; uptime_pct: number }[] }>(
        `/sites/${site.id}/uptime-history`
      )
      .then(({ data }) => setResponseHistory(data.history ?? []))
      .catch(() => {});
  }, [site.id]);

  const uptime = site.uptime_percentage ?? null;
  const hasData = uptime !== null;
  const uptimeNum = uptime ?? 0;
  const isUp = site.uptime_status === "up";
  const isDown = site.uptime_status === "down";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <McCard
          title="30-Day Uptime"
          icon={<Wifi size={15} />}
          action={
            <McPill tone={isUp ? "good" : isDown ? "bad" : "neutral"}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isUp
                    ? "bg-[var(--score-good)]"
                    : isDown
                      ? "bg-[var(--score-bad)]"
                      : "bg-muted-foreground"
                }`}
              />
              {isUp ? "Excellent" : isDown ? "Down" : "Unknown"}
            </McPill>
          }
        >
          <p className="font-portal-display text-4xl font-bold tabular-nums text-foreground">
            {hasData ? (
              <>
                {uptimeNum.toFixed(1)}
                <span className="text-xl font-semibold text-muted-foreground">%</span>
              </>
            ) : (
              "—"
            )}
          </p>
          {hasData && (
            <div className="mt-3 flex gap-4 text-xs">
              <span className="font-medium text-[var(--score-good)]">
                Up: {uptimeNum.toFixed(1)}%
              </span>
              <span className="font-medium text-[var(--score-bad)]">
                Down: {(100 - uptimeNum).toFixed(1)}%
              </span>
            </div>
          )}
        </McCard>

        <McCard title="Monitor Stats" icon={<Activity size={15} />} className="md:col-span-2">
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {(
              [
                {
                  icon: <Activity size={14} />,
                  label: "Avg Response Time",
                  value: site.avg_response_ms != null ? `${site.avg_response_ms}ms` : "—",
                },
                { icon: <AlertCircle size={14} />, label: "Incidents (30d)", value: "—" },
                { icon: <Clock size={14} />, label: "Total Downtime", value: "—" },
                {
                  icon: <CheckCircle2 size={14} />,
                  label: "Last Check",
                  value: site.last_uptime_check_at ? timeAgo(site.last_uptime_check_at) : "—",
                },
              ] as const
            ).map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0 sm:odd:pr-2"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  {icon}
                  <span className="text-foreground">{label}</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </McCard>
      </div>

      <McCard
        title={
          isUp ? "Site is currently online" : isDown ? "Site is currently down" : "Status unknown"
        }
        icon={<Activity size={15} />}
        action={
          <McPill tone={isUp ? "good" : isDown ? "bad" : "neutral"}>
            {isUp ? "Online" : isDown ? "Down" : "Unknown"}
          </McPill>
        }
      >
        <p className="text-xs text-muted-foreground">
          {isUp
            ? "All systems operational. Uptime monitoring is active."
            : isDown
              ? "The site is not responding. Check your server or DNS settings."
              : "Connect the plugin and run an audit to enable uptime monitoring."}
        </p>
      </McCard>

      <McCard
        title="Response History"
        icon={<Activity size={15} />}
        action={
          responseHistory.length > 0 ? (
            <McPill tone="neutral">{responseHistory.length}d of data</McPill>
          ) : null
        }
        bodyClassName="p-0"
      >
        {responseHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <Activity size={20} className="text-accent" />
            <p className="text-sm font-semibold text-foreground">No response time data yet</p>
            <p className="text-xs text-muted-foreground">
              Data will appear here as uptime monitoring collects pings
            </p>
          </div>
        ) : (
          <div className="max-h-[240px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">
                    Day
                  </th>
                  <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">
                    Avg ms
                  </th>
                  <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">
                    Uptime
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...responseHistory].reverse().map((row) => (
                  <tr key={row.day} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(row.day).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums text-foreground">
                      {row.avg_ms} ms
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums text-foreground">
                      {row.uptime_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </McCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <McCard
          className="lg:col-span-2"
          title="Incident Log"
          icon={<AlertCircle size={15} />}
          action={<McPill tone="good">0 incidents</McPill>}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 size={22} className="text-[var(--score-good)]" />
            <p className="text-sm font-semibold text-foreground">No incidents recorded</p>
            <p className="max-w-md text-xs text-muted-foreground">
              All systems have been operational. Incident history will appear here when monitoring
              detects downtime.
            </p>
          </div>
        </McCard>

        <McCard
          title="Alert Settings"
          icon={<Bell size={15} />}
          action={
            <a
              href="/settings/alerts"
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-surface px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-foreground ring-1 ring-border-strong hover:ring-accent/30"
            >
              <Bell size={11} />
              Edit
            </a>
          }
        >
          <div className="divide-y divide-border text-xs">
            {(
              [
                { label: "Channel", value: alertSettings?.channel ?? "—" },
                { label: "Alert Email", value: alertSettings?.alert_email ?? "—" },
                {
                  label: "Perf Alert",
                  value:
                    alertSettings != null ? `Below ${alertSettings.performance_threshold}` : "—",
                },
                {
                  label: "SEO Alert",
                  value: alertSettings != null ? `Below ${alertSettings.seo_threshold}` : "—",
                },
                {
                  label: "Sec Alert",
                  value: alertSettings != null ? `Below ${alertSettings.security_threshold}` : "—",
                },
                {
                  label: "Malware",
                  value:
                    alertSettings != null
                      ? alertSettings.malware_alerts
                        ? "Enabled"
                        : "Disabled"
                      : "—",
                },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="ml-2 max-w-[140px] truncate text-right font-semibold capitalize text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </McCard>
      </div>
    </div>
  );
}
