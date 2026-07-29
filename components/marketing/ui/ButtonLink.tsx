import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-elevated-sm hover:bg-accent-hover hover:-translate-y-px hover:shadow-elevated-md focus-visible:outline-accent",
  secondary:
    "bg-[var(--mkt-surface)] text-[var(--mkt-fg)] shadow-elevated-xs hover:shadow-elevated-sm hover:-translate-y-px",
  ghost:
    "bg-transparent text-[var(--mkt-fg)] hover:bg-[var(--mkt-bg-muted)]",
  inverse:
    "bg-white text-accent-deep shadow-elevated-sm hover:-translate-y-px hover:shadow-elevated-md",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
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
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
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
