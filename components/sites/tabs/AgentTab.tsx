"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DASHBOARD_GRADIENT } from "@/components/dashboard/MalCareDashboard";
import { AgentPanel } from "@/components/agent/AgentPanel";
import type { Site } from "@/types";

function AgentTabInner({ site }: { site: Site }) {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? undefined;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ background: DASHBOARD_GRADIENT }}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1104px] flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-[#FDFDFD] shadow-xs">
          <AgentPanel
            fixedSiteId={site.id}
            variant="embedded"
            initialPrompt={initialPrompt}
          />
        </div>
      </div>
    </div>
  );
}

export function AgentTab({ site }: { site: Site }) {
  return (
    <Suspense>
      <AgentTabInner site={site} />
    </Suspense>
  );
}
