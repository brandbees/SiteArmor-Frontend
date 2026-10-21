import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/** Site Armor identity — solid accent primary; zinc secondary/ghost */
const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap transition-colors duration-150";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary:
    "border border-white/75 bg-white/55 text-zinc-800 shadow-[inset_0_1px_0_rgb(255_255_255/0.85)] backdrop-blur-md hover:bg-white/75",
  outline:
    "border border-white/70 bg-white/35 text-zinc-800 shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] backdrop-blur-md hover:bg-white/55",
  ghost: "bg-transparent text-zinc-600 hover:bg-white/40 hover:text-zinc-900",
  danger: "bg-destructive text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
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
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
