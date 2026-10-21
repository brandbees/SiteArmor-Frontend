"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

/** Portal page shell — cool wash canvas + white panel */
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
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      <header className="sticky top-0 z-10 shrink-0 border-b border-zinc-200/90 bg-white px-4 py-3 pr-6">
        <PageHeader title={title} description={description} icon={icon} action={action} />
      </header>
      <div className={cn("min-h-0 flex-1 overflow-auto p-4 pr-6", contentClassName)}>
        <div
          className={cn(
            "mc-shell min-h-full overflow-hidden bg-white",
            cardClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
