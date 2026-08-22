"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Copy,
  Download,
  ExternalLink,
  FileBadge2,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { mapReportRow, formatReportDuration, reportCategoryLabel, type RawReportRow, type ReportListItem } from "@/lib/reports";
import { SendReportModal } from "@/components/reports/SendReportModal";
import { McAlert, McPill } from "@/components/shared/MalCareUI";
import { SiteScoreWheel } from "@/components/shared/SiteScoreWheel";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { cn, scoreHex, timeAgo, truncateUrl } from "@/lib/utils";

const PILLARS = [
  { key: "performance_score" as const, label: "Performance" },
  { key: "seo_score" as const, label: "SEO" },
  { key: "security_score" as const, label: "Security" },
  { key: "malware_score" as const, label: "Malware" },
];

function formatReportDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportDetailPage() {
  const { site_id, report_id } = useParams<{ site_id: string; report_id: string }>();
  const router = useRouter();

  const [report, setReport] = useState<ReportListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const { data } = await api.get<{ report: RawReportRow }>(`/reports/detail/${report_id}`);
      const mapped = mapReportRow(data.report);
      setReport(mapped);
      setNotes(mapped.annotations ?? "");
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [report_id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!report || report.status !== "pending") return;
    const timer = setInterval(fetchReport, 4000);
    return () => clearInterval(timer);
  }, [report, fetchReport]);

  async function saveNotes() {
    if (!report || notes === (report.annotations ?? "")) return;
    setNotesSaving(true);
    try {
      await api.patch(`/reports/annotate/${report.id}`, { annotations: notes });
    } catch {
      /* ignore */
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDownload() {
    if (!report) return;
    setDownloading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/reports/download/${report.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snapshot-report-${new Date(report.created_at).toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (report.pdf_url) window.open(report.pdf_url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    if (!report) return;
    const portalPath = `/portal/${report.portal_token}`;
    const full =
      typeof window !== "undefined" ? `${window.location.origin}${portalPath}` : portalPath;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f4f4f5] py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<AlertCircle size={20} />}
          title="Report not found"
          description="This report doesn't exist or you don't have access."
        />
      </div>
    );
  }

  const portalPath = `/portal/${report.portal_token}`;
  const isPending = report.status === "pending";
  const isCompleted = report.status === "completed";
  const isFailed = report.status === "failed";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f4f5]">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white p-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(`/reports/${site_id}`)}
          className="mb-3 flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
        >
          <ChevronLeft size={14} />
          Back to reports
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <FileBadge2
              size={24}
              strokeWidth={1}
              className="m-1 shrink-0 rounded-full bg-zinc-300 text-zinc-950 shadow-[0_0_0_4px_rgb(244,244,245)]"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-zinc-950">Report</h1>
              <p className="mt-0.5 text-xs text-[var(--score-good)]">
                {report.site_name ?? "Site"} · {reportCategoryLabel()}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {formatReportDate(report.created_at)}
              </p>
            </div>
          </div>

          {isCompleted && (
            <div className="flex flex-wrap items-center gap-2">
              {report.pdf_url && (
                <Button size="sm" onClick={handleDownload} disabled={downloading} loading={downloading}>
                  <Download size={14} />
                  Download PDF
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setSendOpen(true)}>
                <Send size={14} />
                {report.sent_to ? "Resend" : "Send to client"}
              </Button>
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Link
                href={portalPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              >
                <ExternalLink size={14} />
                Preview
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4">
          {sentSuccess && (
            <McAlert variant="success" title="Report sent">
              The client portal link was emailed successfully.
            </McAlert>
          )}

          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-[#FDFDFD] shadow-xs">
            {/* Summary row */}
            <div className="grid gap-4 border-b border-zinc-100 p-6 sm:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {isCompleted && (
                    <McPill tone="good" icon={<FileText size={10} />}>
                      Completed
                    </McPill>
                  )}
                  {isPending && (
                    <McPill tone="warn" dot>
                      Processing
                    </McPill>
                  )}
                  {isFailed && (
                    <McPill tone="bad" icon={<AlertCircle size={10} />}>
                      Failed
                    </McPill>
                  )}
                  {report.sent_to && (
                    <McPill tone="accent" icon={<Send size={10} />}>
                      Sent to client
                    </McPill>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Site</dt>
                    <dd className="mt-0.5 font-medium text-zinc-950">{report.site_name ?? "—"}</dd>
                    {report.site_url && (
                      <dd className="text-xs text-accent">{truncateUrl(report.site_url, 48)}</dd>
                    )}
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Client</dt>
                    <dd className="mt-0.5 font-medium text-zinc-950">
                      {report.client_name || report.client_email || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Category</dt>
                    <dd className="mt-0.5 text-zinc-800">{reportCategoryLabel()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Duration</dt>
                    <dd className="mt-0.5 text-zinc-800">
                      {formatReportDuration(report.created_at, report.completed_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Created</dt>
                    <dd className="mt-0.5 text-zinc-800">{timeAgo(report.created_at)}</dd>
                  </div>
                  {report.sent_to && (
                    <div>
                      <dt className="text-xs font-medium text-zinc-500">Sent to</dt>
                      <dd className="mt-0.5 text-zinc-800">{report.sent_to}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {report.overall_score != null && (
                <SiteScoreWheel score={report.overall_score} caption="Overall" size={120} className="mx-auto sm:mx-0" />
              )}
            </div>

            {/* Pillar scores */}
            {isCompleted && (
              <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 border-b border-zinc-100 sm:grid-cols-4 sm:divide-y-0">
                {PILLARS.map(({ key, label }) => {
                  const score = report[key];
                  return (
                    <div key={key} className="flex flex-col items-center px-4 py-5">
                      <SiteScoreWheel score={score} caption={label} size={72} />
                      {score != null && (
                        <p
                          className="mt-2 text-xs font-semibold tabular-nums"
                          style={{ color: scoreHex(score) }}
                        >
                          {score}/100
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status messages */}
            {isPending && (
              <div className="flex items-center gap-3 border-b border-zinc-100 bg-amber-50/50 px-6 py-4 text-sm text-amber-800">
                <Loader2 size={16} className="animate-spin shrink-0" />
                Usually ready in under a minute — this page updates automatically.
              </div>
            )}
            {isFailed && (
              <div className="border-b border-zinc-100 bg-red-50/50 px-6 py-4 text-sm text-red-700">
                Generation failed. Go back and generate a new report.
              </div>
            )}

            {/* Consultant notes */}
            {isCompleted && (
              <div className="bg-zinc-50/80 px-6 py-5">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Consultant notes
                  {notesSaving && <span className="ml-2 font-normal">· saving…</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Internal notes about this report…"
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900",
                    "placeholder:text-zinc-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {sendOpen && (
        <SendReportModal
          report={report}
          clientEmail={report.client_email}
          onClose={() => setSendOpen(false)}
          onSent={() => {
            setSendOpen(false);
            setSentSuccess(true);
            fetchReport();
            setTimeout(() => setSentSuccess(false), 4000);
          }}
        />
      )}
    </div>
  );
}
