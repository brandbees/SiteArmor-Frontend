"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

/** MalCare admin page shell — matches Sites / site detail layout */
export function PortalPageShell({
  title,
  description,
  icon,
  action,
  children,
  className,
  contentClassName,
  cardClassName,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  cardClassName?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#f4f4f5]", className)}>
      <header className="sticky top-0 z-10 shrink-0 border-b border-zinc-200 bg-white p-4 pr-6">
        <PageHeader title={title} description={description} icon={icon} action={action} />
      </header>
      <div className={cn("min-h-0 flex-1 overflow-auto p-4 pr-6", contentClassName)}>
        <div
          className={cn(
            "min-h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white",
            cardClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
