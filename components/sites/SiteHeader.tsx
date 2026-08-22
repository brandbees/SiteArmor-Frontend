"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Globe, MoreVertical, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { truncateUrl } from "@/lib/utils";
import { WordPressIcon } from "@/components/shared/WordPressIcon";
import type { Site } from "@/types";

export function SiteHeader({
  site,
  onSync,
  syncLoading,
  wpAdminHref,
  menu,
}: {
  site: Site;
  onSync?: () => void;
  syncLoading?: boolean;
  wpAdminHref: string;
  menu?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const url = site.url.startsWith("http") ? site.url : `https://${site.url}`;

  async function copySiteToken() {
    if (!site.site_token) {
      toast.error("Site token not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(site.site_token);
      setCopied(true);
      toast.success("Site token copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  }

  return (
    <header className="shrink-0 border-b border-zinc-200 bg-white">
      <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 shadow-[0_0_0_4px_rgb(244,244,245)]">
            <Globe size={20} strokeWidth={1} className="text-zinc-950" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-xl font-semibold text-zinc-950 sm:text-2xl">{site.name}</h1>
              <span className="hidden text-zinc-300 sm:inline" aria-hidden>
                •
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 text-sm font-normal text-accent hover:underline"
              >
                <span className="truncate">{truncateUrl(site.url)}</span>
                <ExternalLink size={12} className="shrink-0 opacity-70" />
              </a>
            </div>
            <button
              type="button"
              onClick={copySiteToken}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent"
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={2} className="text-[var(--score-good)]" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2} />
                  Copy Site Token
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {menu ?? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-xs transition-colors hover:bg-zinc-50"
              aria-label="More actions"
            >
              <MoreVertical size={18} strokeWidth={1.5} />
            </button>
          )}
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={syncLoading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-xs transition-colors hover:bg-zinc-50 disabled:opacity-50"
              aria-label="Sync site"
            >
              <RefreshCw size={18} strokeWidth={1.5} className={syncLoading ? "animate-spin" : ""} />
            </button>
          )}
          <a
            href={wpAdminHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <WordPressIcon size={20} className="text-white" />
            WP Admin
          </a>
        </div>
      </div>
    </header>
  );
}
