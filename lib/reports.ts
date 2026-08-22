import type { Report } from "@/types";

export interface RawReportRow {
  id: string;
  site_id: string;
  audit_id: string;
  pdf_url?: string | null;
  portal_token: string;
  overall_score?: number | null;
  status: "pending" | "completed" | "failed";
  sent_to?: string | null;
  sent_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  performance_score?: number | null;
  seo_score?: number | null;
  security_score?: number | null;
  malware_score?: number | null;
  annotations?: string | null;
  site_name?: string | null;
  site_url?: string | null;
  client_name?: string | null;
  client_email?: string | null;
}

export type ReportListItem = Report & {
  site_name?: string | null;
  site_url?: string | null;
  client_name?: string | null;
  client_email?: string | null;
};

function parseSentTo(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? parsed : String(parsed);
    } catch {
      return raw;
    }
  }
  if (Array.isArray(raw) && raw[0]) return String(raw[0]);
  return String(raw);
}

export function mapReportRow(r: RawReportRow): ReportListItem {
  return {
    id: r.id,
    site_id: r.site_id,
    audit_id: r.audit_id,
    pdf_url: r.pdf_url ?? null,
    portal_token: r.portal_token,
    overall_score: r.overall_score ?? null,
    status: r.status,
    sent_to: parseSentTo(r.sent_to),
    sent_at: r.sent_at ?? null,
    created_at: r.created_at,
    completed_at: r.completed_at ?? null,
    performance_score: r.performance_score ?? null,
    seo_score: r.seo_score ?? null,
    security_score: r.security_score ?? null,
    malware_score: r.malware_score ?? null,
    annotations: r.annotations ?? null,
    site_name: r.site_name ?? null,
    site_url: r.site_url ?? null,
    client_name: r.client_name ?? null,
    client_email: r.client_email ?? null,
  };
}

export function formatReportDuration(createdAt: string, completedAt?: string | null): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(createdAt).getTime();
  if (ms < 0) return "—";
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

export const REPORT_CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "health", label: "Health Report" },
  { value: "sent", label: "Sent to client" },
  { value: "pending", label: "Processing" },
] as const;

export type ReportCategoryFilter = (typeof REPORT_CATEGORIES)[number]["value"];

export function reportCategoryLabel(): string {
  return "Health Report";
}
