"use client";

import { useRouter } from "next/navigation";
import { FileText, TrendingUp, Search, Shield, Bug, ChevronRight, Globe } from "lucide-react";
import { useSites } from "@/hooks/useSites";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { scoreHex, truncateUrl, timeAgo } from "@/lib/utils";
import type { Site } from "@/types";
import { Badge } from "@/components/ui/Badge";

const PILLARS = [
  { key: "performance" as const, label: "Perf" },
  { key: "seo" as const, label: "SEO" },
  { key: "security" as const, label: "Sec" },
  { key: "malware" as const, label: "Mal" },
];

const AVATAR_COLORS = ["#1a56db", "#0ea5e9", "#16a34a", "#d97706", "#dc2626", "#475569"];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

function ScoreCell({ score }: { score: number | undefined }) {
  if (score === undefined) {
    return <span className="text-sm font-bold text-muted-foreground/40">—</span>;
  }
  return (
    <span className="text-sm font-bold tabular-nums" style={{ color: scoreHex(score) }}>
      {score}
    </span>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { sites, loading, error } = useSites();

  const sitesWithAudits = sites.filter((s) => !!s.last_audit_at);
  const sitesWithout = sites.filter((s) => !s.last_audit_at);
  const ordered = [...sitesWithAudits, ...sitesWithout];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Generate and send branded PDF reports to clients."
        icon={<FileText size={22} />}
        action={
          sites.length > 0 ? (
            <Badge variant="muted">{sitesWithAudits.length} ready</Badge>
          ) : undefined
        }
      />

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && sites.length === 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={<FileText size={20} />}
            title="No sites yet"
            description="Add a site and run an audit before generating reports."
          />
        </div>
      )}

      {!loading && !error && sites.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Site</th>
                  {PILLARS.map((p) => (
                    <th key={p.key} className="px-3 py-3 text-center">
                      {p.label}
                    </th>
                  ))}
                  <th className="px-4 py-3">Last audit</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((site) => {
                  const ready = !!site.last_audit_at;
                  return (
                    <tr
                      key={site.id}
                      className={`border-b border-border last:border-0 ${
                        ready
                          ? "cursor-pointer hover:bg-muted/40"
                          : "opacity-60"
                      }`}
                      onClick={
                        ready ? () => router.push(`/reports/${site.id}`) : undefined
                      }
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-xs font-bold text-white"
                            style={{ background: avatarColor(site.id) }}
                          >
                            {site.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {site.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {truncateUrl(site.url)}
                            </p>
                          </div>
                        </div>
                      </td>
                      {PILLARS.map((p) => (
                        <td key={p.key} className="px-3 py-3.5 text-center">
                          <ScoreCell score={site.latest_scores?.[p.key]} />
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground">
                        {ready ? timeAgo(site.last_audit_at!) : "Needs audit"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {ready ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                            View <ChevronRight size={14} />
                          </span>
                        ) : (
                          <Globe size={14} className="ml-auto text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs font-medium text-muted-foreground">
            {sitesWithAudits.length} ready · {sitesWithout.length} need an audit first
          </div>
        </div>
      )}
    </div>
  );
}
