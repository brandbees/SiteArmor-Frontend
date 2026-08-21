"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** MalCare-style bordered panel — white on soft gray canvas */
export function McCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[4px] border border-border bg-white shadow-[0_1px_2px_rgb(26_29_35/0.04)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#f0f2f5] text-muted-foreground">
                {icon}
              </span>
            ) : null}
            {title ? (
              <h3 className="truncate text-[13px] font-bold text-foreground">{title}</h3>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn(!flush && "px-4 pb-4", bodyClassName)}>{children}</div>
    </div>
  );
}

/** Compact status pill */
export function McPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground border-border",
    good: "bg-[var(--score-good-bg)] text-[var(--score-good)] border-[var(--score-good-border)]",
    warn: "bg-[var(--score-warn-bg)] text-[var(--score-warn)] border-[var(--score-warn-border)]",
    bad: "bg-[var(--score-bad-bg)] text-[var(--score-bad)] border-[var(--score-bad-border)]",
    accent: "bg-accent-light text-accent border-accent/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/** Horizontal score bar — denser than gauges */
export function ScoreBar({
  label,
  score,
  onClick,
}: {
  label: string;
  score: number | null | undefined;
  onClick?: () => void;
}) {
  const v = score ?? null;
  const color =
    v == null ? "#94a3b8" : v >= 80 ? "#16a34a" : v >= 50 ? "#d97706" : "#dc2626";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full text-left",
        onClick && "rounded-md transition-colors hover:bg-muted/50"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {v == null ? "—" : v}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${v == null ? 0 : Math.min(100, v)}%`, background: color }}
        />
      </div>
    </Tag>
  );
}

/** Left filter rail used on Sites + insight pages */
export function FilterRail({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col rounded-lg border border-border bg-surface lg:w-[220px]">
      <div className="flex-1 space-y-5 p-4">{children}</div>
      {footer ? (
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

export function QuickPills({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Quick Suggestions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(active ? "all" : item.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InsightTableShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className="border-t border-border px-4 py-3 text-xs font-medium text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Dense score history — replaces AreaChart heroes in site tabs */
export function ScoreHistoryList({
  points,
}: {
  points: { date: string; score: number }[];
}) {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        Run audits to build history
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {[...points].reverse().slice(0, 8).map((p, i) => {
        const color =
          p.score >= 80 ? "#16a34a" : p.score >= 50 ? "#d97706" : "#dc2626";
        return (
          <li key={`${p.date}-${i}`} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{p.date}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {p.score}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
