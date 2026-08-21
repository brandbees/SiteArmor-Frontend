import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.06em] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap transition-all duration-fast active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-accent hover:bg-accent-hover shadow-elevated-xs",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:border-accent/30 hover:bg-muted",
  outline:
    "bg-transparent text-foreground border border-border hover:bg-muted hover:border-border-strong",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted normal-case tracking-normal font-semibold",
  danger:
    "bg-destructive text-white hover:bg-red-700 shadow-elevated-xs",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-9 px-4 text-xs",
  lg: "h-11 px-5 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
