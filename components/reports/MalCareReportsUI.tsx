"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileChartLine,
  Search,
  ListFilter,
  ChevronDown,
  Send,
  Eye,
  Loader2,
  FileBadge2,
  RefreshCw,
} from "lucide-react";
import { cn, truncateUrl } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  REPORT_CATEGORIES,
  formatReportDuration,
  reportCategoryLabel,
  type ReportCategoryFilter,
  type ReportListItem,
} from "@/lib/reports";

function StatusBadge({ status, sent }: { status: ReportListItem["status"]; sent?: boolean }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Loader2 size={12} className="animate-spin" />
        Processing
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }
  if (sent) {
    return (
      <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 text-xs font-medium text-accent">
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Completed
    </span>
  );
}

function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportsPageShell({
  title,
  subtitle,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  action,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (v: string) => void;
  category: ReportCategoryFilter;
  onCategoryChange: (v: ReportCategoryFilter) => void;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f4f5]">
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-zinc-200 bg-white p-4 sm:flex-row sm:items-start sm:gap-8 sm:pr-6">
        <div className="flex min-w-0 max-w-[50%] items-start gap-4 overflow-hidden">
          <FileBadge2
            size={24}
            strokeWidth={1}
            className="m-1 shrink-0 rounded-full bg-zinc-300 text-zinc-950 shadow-[0_0_0_4px_rgb(244,244,245)]"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-zinc-950">{title}</h1>
            <p className="truncate text-xs font-normal text-[var(--score-good)]">{subtitle}</p>
          </div>
        </div>

        <div className="flex h-10 flex-1 flex-row items-center justify-end gap-4 sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-row items-stretch gap-4">
            <div className="relative flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-zinc-100 px-3 py-2">
              <Search size={16} strokeWidth={1} className="pointer-events-none shrink-0 text-zinc-950" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search for site name, site url, or client name"
                aria-label="Search reports"
                className="min-w-0 flex-1 border-none bg-transparent text-xs text-zinc-950 shadow-none outline-none placeholder:text-zinc-500 focus:ring-0"
              />
            </div>

            <div className="hidden w-52 shrink-0 sm:block">
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => onCategoryChange(e.target.value as ReportCategoryFilter)}
                  className="flex h-10 w-full cursor-pointer appearance-none items-center rounded-md border border-zinc-200 bg-white px-3 pr-8 text-sm font-light text-zinc-600 shadow-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {REPORT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value === "all" ? "Select category" : c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </div>

            <button
              type="button"
              className="inline-flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-xs transition-colors hover:bg-zinc-200/30 active:bg-neutral-200"
              aria-label="Filters"
            >
              <ListFilter size={16} strokeWidth={1} className="text-zinc-950" />
            </button>
          </div>

          {action}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4 pr-4 sm:pr-6">
        <div className="mx-auto flex min-h-full min-w-0 flex-col rounded-3xl border border-zinc-200 bg-[#FDFDFD] p-4 shadow-xs">
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function ReportsTable({
  reports,
  loading,
  showSiteColumn = true,
  onSend,
  detailHref,
}: {
  reports: ReportListItem[];
  loading?: boolean;
  showSiteColumn?: boolean;
  onSend?: (report: ReportListItem) => void;
  detailHref: (report: ReportListItem) => string;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <FileChartLine size={48} strokeWidth={1} className="mb-3 text-zinc-300" />
        <h3 className="mb-2 text-lg font-semibold text-zinc-950">No reports found</h3>
        <p className="text-sm text-zinc-500">When you create reports, they will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-auto">
      <table className="relative w-full caption-bottom">
        <thead className="sticky top-0 z-10 bg-[#FDFDFD] text-sm font-medium">
          <tr className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
            <th className="h-10 w-[150px] px-2 text-center align-middle text-zinc-700">Created At</th>
            {showSiteColumn && (
              <th className="h-10 w-[200px] px-2 text-center align-middle text-zinc-700">Site</th>
            )}
            <th className="h-10 w-[120px] px-2 text-center align-middle text-zinc-700">Duration</th>
            <th className="h-10 w-[120px] px-2 text-center align-middle text-zinc-700">Category</th>
            <th className="h-10 w-[160px] px-2 text-center align-middle text-zinc-700">Client</th>
            <th className="h-10 w-[130px] px-2 text-center align-middle text-zinc-700">Status</th>
            <th className="h-10 w-[120px] px-2 text-center align-middle text-zinc-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const href = detailHref(report);
            const clientLabel = report.client_name || report.client_email || "—";
            return (
              <tr
                key={report.id}
                className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                onClick={() => router.push(href)}
              >
                <td className="h-16 px-2 text-center align-middle text-xs text-zinc-600">
                  {formatCreatedAt(report.created_at)}
                </td>
                {showSiteColumn && (
                  <td className="h-16 px-2 align-middle">
                    <div className="min-w-0 text-center">
                      <p className="truncate text-sm font-medium text-zinc-950">
                        {report.site_name ?? "Site"}
                      </p>
                      {report.site_url && (
                        <p className="truncate text-xs text-accent">{truncateUrl(report.site_url, 32)}</p>
                      )}
                    </div>
                  </td>
                )}
                <td className="h-16 px-2 text-center align-middle text-xs text-zinc-600">
                  {formatReportDuration(report.created_at, report.completed_at)}
                </td>
                <td className="h-16 px-2 text-center align-middle text-xs text-zinc-700">
                  {reportCategoryLabel()}
                </td>
                <td className="h-16 px-2 text-center align-middle text-xs text-zinc-600">
                  <span className="line-clamp-2">{clientLabel}</span>
                </td>
                <td className="h-16 px-2 text-center align-middle">
                  <StatusBadge status={report.status} sent={!!report.sent_to} />
                </td>
                <td
                  className="h-16 px-2 text-center align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-1">
                    {report.status === "completed" && (
                      <>
                        <Link
                          href={href}
                          title="View report"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-accent"
                        >
                          <Eye size={15} strokeWidth={1.5} />
                        </Link>
                        {onSend && (
                          <button
                            type="button"
                            title="Send to client"
                            onClick={() => onSend(report)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-accent"
                          >
                            <Send size={15} strokeWidth={1.5} />
                          </button>
                        )}
                      </>
                    )}
                    {report.status === "pending" && (
                      <Loader2 size={16} className="animate-spin text-amber-500" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsPagination({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-100 px-2 py-4 sm:flex-row">
      <p className="text-sm font-medium text-zinc-500">
        Page {page} of {Math.max(totalPages, 1)}
        {total > 0 && (
          <span className="ml-2 text-zinc-400">
            · {total} report{total === 1 ? "" : "s"}
          </span>
        )}
      </p>
    </div>
  );
}

export function useFilteredReports(
  reports: ReportListItem[],
  search: string,
  category: ReportCategoryFilter
) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (category === "health" && r.status === "failed") return false;
      if (category === "sent" && !r.sent_to) return false;
      if (category === "pending" && r.status !== "pending") return false;
      if (!q) return true;
      const hay = [r.site_name, r.site_url, r.client_name, r.client_email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reports, search, category]);
}
