"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useSite } from "@/hooks/useSite";
import { mapReportRow, type RawReportRow, type ReportCategoryFilter, type ReportListItem } from "@/lib/reports";
import {
  ReportsPageShell,
  ReportsPagination,
  ReportsTable,
  useFilteredReports,
} from "@/components/reports/MalCareReportsUI";
import { SendReportModal } from "@/components/reports/SendReportModal";
import { McAlert } from "@/components/shared/MalCareUI";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import type { Report } from "@/types";

const PAGE_SIZE = 25;

export default function SiteReportsPage() {
  const { site_id } = useParams<{ site_id: string }>();
  const router = useRouter();
  const { site, loading: siteLoading } = useSite(site_id);

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [sendTarget, setSendTarget] = useState<ReportListItem | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const reportsRef = useRef(reports);
  reportsRef.current = reports;

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get<{ reports: RawReportRow[] }>(`/reports/${site_id}`);
      setReports((data.reports ?? []).map(mapReportRow));
    } catch {
      /* ignore */
    } finally {
      setLoadingReports(false);
    }
  }, [site_id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (reportsRef.current.some((r) => r.status === "pending")) fetchReports();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchReports]);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const { data } = await api.post<{
        queued: boolean;
        report_id: string;
        portal_token: string;
      }>(`/reports/generate/${site_id}`);
      const pending: Report = {
        id: data.report_id,
        site_id,
        audit_id: "",
        pdf_url: null,
        portal_token: data.portal_token,
        overall_score: null,
        status: "pending",
        sent_to: null,
        sent_at: null,
        created_at: new Date().toISOString(),
        completed_at: null,
        performance_score: null,
        seo_score: null,
        security_score: null,
        malware_score: null,
      };
      setReports((prev) => [
        {
          ...pending,
          site_name: site?.name ?? null,
          site_url: site?.url ?? null,
          client_name: site?.client_name ?? null,
          client_email: site?.client_email ?? null,
        },
        ...prev,
      ]);
    } catch (e: unknown) {
      setGenError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Failed to start report generation."
      );
    } finally {
      setGenerating(false);
    }
  }

  const filtered = useFilteredReports(reports, search, category);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  if (siteLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!site) {
    return (
      <EmptyState
        icon={<AlertCircle size={20} />}
        title="Site not found"
        description="This site doesn't exist or you don't have access."
      />
    );
  }

  const hasCompletedAudit = !!site.last_audit_at;
  const subtitle = `You have ${reports.length} report${reports.length === 1 ? "" : "s"} for ${site.name}`;

  return (
    <>
      <ReportsPageShell
        title={site.name}
        subtitle={subtitle}
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        action={
          <Button
            onClick={handleGenerate}
            disabled={generating || !hasCompletedAudit}
            loading={generating}
            size="sm"
            title={!hasCompletedAudit ? "Run an audit first" : undefined}
          >
            <RefreshCw size={14} />
            Generate report
          </Button>
        }
      >
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="mb-4 flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
        >
          <ChevronLeft size={14} />
          All reports
        </button>

        {!hasCompletedAudit && (
          <div className="mb-4">
            <McAlert variant="warning" title="Audit required">
              Run an audit on this site before generating a report.
            </McAlert>
          </div>
        )}
        {genError && (
          <div className="mb-4">
            <McAlert variant="error" title="Generation failed">
              {genError}
            </McAlert>
          </div>
        )}
        {sentSuccess && (
          <div className="mb-4">
            <McAlert variant="success" title="Report sent">
              The client portal link was emailed successfully.
            </McAlert>
          </div>
        )}

        <ReportsTable
          reports={paged}
          loading={loadingReports}
          showSiteColumn={false}
          onSend={setSendTarget}
          detailHref={(r) => `/reports/${site_id}/${r.id}`}
        />

        <ReportsPagination page={page} totalPages={totalPages} total={filtered.length} />
      </ReportsPageShell>

      {sendTarget && (
        <SendReportModal
          report={sendTarget}
          clientEmail={site.client_email}
          onClose={() => setSendTarget(null)}
          onSent={() => {
            setSendTarget(null);
            setSentSuccess(true);
            fetchReports();
            setTimeout(() => setSentSuccess(false), 4000);
          }}
        />
      )}
    </>
  );
}
