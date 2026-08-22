"use client";

import { WordPressIcon } from "@/components/shared/WordPressIcon";
import type { SiteDetail } from "@/hooks/useSite";

/** MalCare-style sticky sidebar footer — WP version + PHP badge */
export function SiteSidebarFooter({
  site,
  collapsed,
}: {
  site: SiteDetail | null | undefined;
  collapsed: boolean;
}) {
  const wpVersion = site?.plugin_data?.wp_version;
  const phpVersion = site?.plugin_data?.php_version;

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white"
          title={wpVersion ? `WP ${wpVersion}` : "Site environment"}
        >
          <WordPressIcon size={16} className="text-zinc-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-zinc-200 p-2 px-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <WordPressIcon size={16} className="text-zinc-800" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-none text-zinc-500">WP Version</p>
            <p className="truncate text-sm font-bold leading-tight text-zinc-950">
              {wpVersion ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-sm font-semibold text-zinc-500">{phpVersion ?? "—"}</span>
          <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold lowercase text-white">
            php
          </span>
        </div>
      </div>
    </div>
  );
}
