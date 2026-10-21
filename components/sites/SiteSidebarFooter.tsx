"use client";

import { WordPressIcon } from "@/components/shared/WordPressIcon";
import type { SiteDetail } from "@/hooks/useSite";

/** Sticky sidebar footer — WP + plugin + PHP (light glass rail) */
export function SiteSidebarFooter({
  site,
  collapsed,
}: {
  site: SiteDetail | null | undefined;
  collapsed: boolean;
}) {
  const wpVersion = site?.plugin_data?.wp_version;
  const phpVersion = site?.plugin_data?.php_version;
  const pluginVersion = site?.plugin_version;

  const titleParts = [
    wpVersion ? `WP ${wpVersion}` : null,
    pluginVersion ? `SA ${pluginVersion}` : null,
    phpVersion ? `PHP ${phpVersion}` : null,
  ].filter(Boolean);

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/80 bg-white/50 backdrop-blur-md"
          title={titleParts.length ? titleParts.join(" · ") : "Site environment"}
        >
          <WordPressIcon size={16} className="text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-slate-200/60 p-2 px-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/80 bg-white/45 px-3 py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.85)] backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <WordPressIcon size={16} className="text-slate-700" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-none text-slate-500">WP Version</p>
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              {wpVersion ?? "—"}
            </p>
            {pluginVersion ? (
              <p className="mt-0.5 truncate text-[10px] font-medium leading-none text-slate-500">
                Site Armor {pluginVersion}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-500">{phpVersion ?? "—"}</span>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold lowercase text-white">
            php
          </span>
        </div>
      </div>
    </div>
  );
}
