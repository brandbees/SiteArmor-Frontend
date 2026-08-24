import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  message: string;
  compact?: boolean;
}

export function UpgradeBanner({ message, compact = false }: UpgradeBannerProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border border-accent/15 bg-accent-light px-4 py-3",
        compact && "rounded-xl py-2.5"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow-[0_0_0_1px_rgb(26_86_219_/_0.08)]">
          <Lock size={13} strokeWidth={1.75} />
        </span>
        <span className={cn("text-sm text-accent", compact && "text-xs")}>{message}</span>
      </div>
      <Link
        href="/settings?tab=billing"
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline"
      >
        Upgrade plan
        <ArrowRight size={14} strokeWidth={1.75} />
      </Link>
    </div>
  );
}
