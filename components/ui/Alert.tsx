import { cn } from "@/lib/utils";
import { McAlert, type AlertVariant } from "@/components/shared/MalCareUI";
import type { ReactNode } from "react";

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
  if (!title && !children) return null;

  return (
    <McAlert
      variant={variant}
      title={title ?? ""}
      className={cn(className)}
    >
      {children}
    </McAlert>
  );
}
