"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { mapReportRow, type RawReportRow, type ReportCategoryFilter, type ReportListItem } from "@/lib/reports";
import {
  ReportsPageShell,
  ReportsPagination,
  ReportsTable,
  useFilteredReports,
} from "@/components/reports/MalCareReportsUI";
import { SendReportModal } from "@/components/reports/SendReportModal";
import { McAlert } from "@/components/shared/MalCareUI";

const PAGE_SIZE = 25;

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [sendTarget, setSendTarget] = useState<ReportListItem | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const reportsRef = useRef(reports);
  reportsRef.current = reports;

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get<{ reports: RawReportRow[] }>("/reports");
      setReports((data.reports ?? []).map(mapReportRow));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (reportsRef.current.some((r) => r.status === "pending")) fetchReports();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchReports]);

  const filtered = useFilteredReports(reports, search, category);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const subtitle =
    reports.length === 0
      ? "You have 0 reports"
      : `You have ${reports.length} report${reports.length === 1 ? "" : "s"}`;

  return (
    <>
      <ReportsPageShell
        title="Reports"
        subtitle={subtitle}
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      >
        {sentSuccess && (
          <div className="mb-4">
            <McAlert variant="success" title="Report sent">
              The client portal link was emailed successfully.
            </McAlert>
          </div>
        )}

        <ReportsTable
          reports={paged}
          loading={loading}
          showSiteColumn
          onSend={setSendTarget}
          detailHref={(r) => `/reports/${r.site_id}/${r.id}`}
        />

        <ReportsPagination page={page} totalPages={totalPages} total={filtered.length} />
      </ReportsPageShell>

      {sendTarget && (
        <SendReportModal
          report={sendTarget}
          clientEmail={sendTarget.client_email}
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
