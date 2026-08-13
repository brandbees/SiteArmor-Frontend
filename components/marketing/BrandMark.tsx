import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
  inverse = false,
}: {
  className?: string;
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Site Armor by BrandBees — home"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-brand shadow-elevated-sm transition-transform duration-200 group-hover:scale-[1.03]">
        <Image
          src="/Brandbees-sas-x512.png"
          alt=""
          width={28}
          height={28}
          className="object-contain"
          priority
        />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[15px] font-bold tracking-tight",
            inverse ? "text-white" : "text-[var(--mkt-fg)]"
          )}
        >
          Snapshot
          <span className={inverse ? "text-white/80" : "text-accent"}>AI</span>
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em]",
              inverse ? "text-white/50" : "text-[var(--mkt-muted)]"
            )}
          >
            by BrandBees
          </span>
        ) : null}
      </span>
    </Link>
  );
}
