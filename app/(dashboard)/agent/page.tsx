"use client";

import { Suspense } from "react";
import { DASHBOARD_GRADIENT } from "@/components/dashboard/MalCareDashboard";
import { AgentPanel } from "@/components/agent/AgentPanel";

export default function AgentPage() {
  return (
    <Suspense>
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ background: DASHBOARD_GRADIENT }}
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1104px] flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-[#FDFDFD] shadow-xs">
            <AgentPanel variant="embedded" />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
