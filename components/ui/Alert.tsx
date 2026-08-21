import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

const styles: Record<
  AlertVariant,
  { wrap: string; icon: typeof Info }
> = {
  info: {
    wrap: "border-accent/20 bg-accent-light text-accent",
    icon: Info,
  },
  success: {
    wrap: "border-[var(--score-good-border)] bg-[var(--score-good-bg)] text-[var(--score-good)]",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "border-[var(--score-warn-border)] bg-[var(--score-warn-bg)] text-[var(--score-warn)]",
    icon: TriangleAlert,
  },
  error: {
    wrap: "border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] text-[var(--score-bad)]",
    icon: AlertCircle,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const conf = styles[variant];
  const Icon = conf.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        conf.wrap,
        className
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" strokeWidth={2.25} />
      <div className="min-w-0">
        {title ? (
          <p className="font-bold text-foreground">{title}</p>
        ) : null}
        {children ? (
          <div className={cn("text-muted-foreground", title && "mt-0.5")}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
