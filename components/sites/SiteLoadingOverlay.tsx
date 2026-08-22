"use client";

import { Globe, Loader2 } from "lucide-react";

export function SiteLoadingOverlay({ siteName }: { siteName?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f4f5]/90 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-10 py-8 shadow-lg">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
          <Globe size={24} strokeWidth={1.5} className="text-zinc-400" />
          <Loader2
            size={44}
            strokeWidth={1.5}
            className="absolute inset-0 animate-spin text-accent opacity-90"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-950">
            {siteName ? `Loading ${siteName}` : "Loading site"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Fetching site data…</p>
        </div>
      </div>
    </div>
  );
}
