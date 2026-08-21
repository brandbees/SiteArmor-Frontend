"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "neutral" | "brand";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="font-portal-display mb-1 text-base font-bold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mb-5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </motion.div>
  );
}
