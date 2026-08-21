import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "outline"
  | "accent";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  default: "bg-foreground text-background",
  success: "bg-[var(--score-good-bg)] text-[var(--score-good)] border border-[var(--score-good-border)]",
  warning: "bg-[var(--score-warn-bg)] text-[var(--score-warn)] border border-[var(--score-warn-border)]",
  danger: "bg-[var(--score-bad-bg)] text-[var(--score-bad)] border border-[var(--score-bad-border)]",
  info: "bg-accent-light text-accent border border-accent/20",
  muted: "bg-muted text-muted-foreground border border-border",
  outline: "bg-transparent text-foreground border border-border",
  accent: "bg-accent-light text-accent border border-accent/20",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "success" && "bg-score-good",
            variant === "danger" && "bg-score-bad",
            variant === "warning" && "bg-score-warn",
            variant === "info" && "bg-accent",
            variant === "muted" && "bg-muted-foreground",
            variant === "accent" && "bg-accent",
            variant === "default" && "bg-background",
            variant === "outline" && "bg-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
