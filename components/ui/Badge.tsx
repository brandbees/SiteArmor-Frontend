import { cn } from "@/lib/utils";
import { McPill, type Tone } from "@/components/shared/MalCareUI";
import type { ReactNode } from "react";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "outline"
  | "accent";

const variantToTone: Record<Variant, Tone> = {
  default: "neutral",
  success: "good",
  warning: "warn",
  danger: "bad",
  info: "accent",
  muted: "neutral",
  outline: "neutral",
  accent: "accent",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}) {
  return (
    <McPill tone={variantToTone[variant]} dot={dot} className={cn(className)}>
      {children}
    </McPill>
  );
}
