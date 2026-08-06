"use client";

/**
 * Agency-wide rollup of the crawl-based SEO audit.
 *
 * The rest of the SEO dashboard grades sites on the homepage audit score. This is the
 * other thing an agency needs to know first thing in the morning: which sites have open
 * findings, how many of those can be fixed without asking anyone, and which crawls came
 * back incomplete — because an incomplete crawl showing zero issues is not good news.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, Wand2, AlertTriangle, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";

interface OverviewSite {
  id: string;
  name: string | null;
  url: string;
  pages_crawled: number | null;
  stop_reason: string | null;
  blocked_kind: string | null;
  finished_at: string | null;
  ai_score: number | null;
  open_issues: number;
  auto_fixable: number;
  needs_approval: number;
  critical: number;
}

interface Overview {
  sites: OverviewSite[];
  crawled: number;
  total: number;
  open_issues: number;
  auto_fixable: number;
}

/** A malformed URL must not throw during render and blank the whole dashboard. */
function hostOf(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

export function CrawlOverviewCard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/seo/overview")
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const withIssues = data.sites.filter(s => s.open_issues > 0);
  const neverCrawled = data.total - data.crawled;

  return (
    <div className="bg-white rounded-2xl shadow-elevated-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Search size={14} className="text-blue-600" /> Site-wide crawls
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every page checked, not just the homepage. {data.crawled} of {data.total} sites crawled
            {neverCrawled > 0 && ` · ${neverCrawled} never crawled`}.
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums">{data.open_issues}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Open issues</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600 tabular-nums">{data.auto_fixable}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Auto-fixable</p>
          </div>
        </div>
      </div>

      {data.crawled === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground text-center">
          No site has been crawled yet. Open a site and run an SEO crawl from its SEO tab.
        </p>
      ) : withIssues.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground text-center">
          No open findings across the crawled sites.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {withIssues.slice(0, 8).map(site => (
            <Link
              key={site.id}
              href={`/sites/${site.id}?tab=seo`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {site.name || hostOf(site.url)}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">{site.pages_crawled ?? 0} pages</span>
                  {site.ai_score != null && (
                    <span className="inline-flex items-center gap-1">
                      <Bot size={10} /> AI {site.ai_score}
                    </span>
                  )}
                  {/* An incomplete crawl reporting few issues is not a clean site. */}
                  {site.stop_reason && site.stop_reason !== "completed" && (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <AlertTriangle size={10} />
                      {site.stop_reason === "blocked" ? "crawler blocked" : "partial crawl"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {site.critical > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 tabular-nums">
                    {site.critical} critical
                  </span>
                )}
                {site.auto_fixable > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 inline-flex items-center gap-1 tabular-nums">
                    <Wand2 size={9} /> {site.auto_fixable}
                  </span>
                )}
                <span className="text-xs font-semibold text-foreground tabular-nums">{site.open_issues}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </Link>
          ))}
          {withIssues.length > 8 && (
            <p className="px-5 py-2 text-[11px] text-muted-foreground">
              + {withIssues.length - 8} more site{withIssues.length - 8 === 1 ? "" : "s"} with open findings.
            </p>
          )}
        </div>
      )}
    </div>
  );
}