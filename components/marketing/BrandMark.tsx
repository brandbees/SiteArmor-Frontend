import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Site Armor — home"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-brand shadow-elevated-sm transition-transform duration-200 group-hover:scale-[1.03]">
        <Image
          src="/site-armor-icon.png"
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
          Site
          <span className={inverse ? "text-white/80" : "text-accent"}>Armor</span>
        </span>
      </span>
    </Link>
  );
}
