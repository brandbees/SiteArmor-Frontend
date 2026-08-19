import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:outline-accent",
  secondary:
    "bg-[var(--mkt-surface)] text-[var(--mkt-fg)] ring-1 ring-[var(--mkt-border-strong)] hover:ring-accent/30",
  ghost:
    "bg-transparent text-[var(--mkt-fg)] hover:bg-[var(--mkt-bg-muted)]",
  inverse:
    "bg-white text-accent-deep hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-xs",
  lg: "h-[52px] px-8 text-[13px]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-[4px] font-bold uppercase tracking-[0.08em] transition-all duration-200",
    variants[variant],
    sizes[size],
    className
  );

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
