"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Info,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";
type Severity = "critical" | "high" | "medium" | "low";
type AlertVariant = "info" | "success" | "warning" | "error";

const TONE_STYLES: Record<
  Tone,
  { box: string; pill: string; dot: string; stripe: string }
> = {
  neutral: {
    box: "bg-[#eef1f6] text-muted-foreground ring-1 ring-inset ring-black/[0.04]",
    pill: "border-border bg-white text-muted-foreground shadow-[0_1px_2px_rgb(15_23_42/0.04)]",
    dot: "bg-muted-foreground",
    stripe: "bg-muted-foreground",
  },
  good: {
    box: "bg-[var(--score-good-bg)] text-[var(--score-good)] ring-1 ring-inset ring-[var(--score-good-border)]",
    pill: "border-[var(--score-good-border)] bg-white text-[var(--score-good)] shadow-[0_1px_2px_rgb(22_163_74/0.08)]",
    dot: "bg-[var(--score-good)]",
    stripe: "bg-[var(--score-good)]",
  },
  warn: {
    box: "bg-[var(--score-warn-bg)] text-[var(--score-warn)] ring-1 ring-inset ring-[var(--score-warn-border)]",
    pill: "border-[var(--score-warn-border)] bg-white text-[var(--score-warn)] shadow-[0_1px_2px_rgb(217_119_6/0.08)]",
    dot: "bg-[var(--score-warn)]",
    stripe: "bg-[var(--score-warn)]",
  },
  bad: {
    box: "bg-[var(--score-bad-bg)] text-[var(--score-bad)] ring-1 ring-inset ring-[var(--score-bad-border)]",
    pill: "border-[var(--score-bad-border)] bg-white text-[var(--score-bad)] shadow-[0_1px_2px_rgb(220_38_38/0.08)]",
    dot: "bg-[var(--score-bad)]",
    stripe: "bg-[var(--score-bad)]",
  },
  accent: {
    box: "bg-accent-light text-accent ring-1 ring-inset ring-accent/15",
    pill: "border-accent/25 bg-white text-accent shadow-[0_1px_2px_rgb(var(--accent-rgb)/0.08)]",
    dot: "bg-accent",
    stripe: "bg-accent",
  },
};

const SEVERITY_META: Record<
  Severity,
  { label: string; tone: Tone; icon: typeof ShieldAlert }
> = {
  critical: { label: "Critical", tone: "bad", icon: ShieldAlert },
  high: { label: "High", tone: "warn", icon: Flame },
  medium: { label: "Medium", tone: "warn", icon: AlertCircle },
  low: { label: "Low", tone: "accent", icon: Info },
};

const ALERT_VARIANT: Record<AlertVariant, { tone: Tone; icon: typeof Info }> = {
  info: { tone: "accent", icon: Info },
  success: { tone: "good", icon: CheckCircle2 },
  warning: { tone: "warn", icon: AlertTriangle },
  error: { tone: "bad", icon: ShieldAlert },
};

/** Icon in a tinted square — used in cards, alerts, list rows */
export function McIconBox({
  icon,
  tone = "neutral",
  size = "md",
  className,
}: {
  icon: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-7 w-7 [&_svg]:size-3.5", md: "h-9 w-9 [&_svg]:size-[17px]", lg: "h-11 w-11 [&_svg]:size-5" };
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[4px]",
        TONE_STYLES[tone].box,
        sizes[size],
        className
      )}
    >
      {icon}
    </span>
  );
}

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
        "flex min-w-0 flex-col overflow-hidden rounded-[4px] border border-border bg-white shadow-[0_1px_2px_rgb(26_29_35/0.04)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon ? <McIconBox icon={icon} tone="neutral" size="sm" /> : null}
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

/** Status pill — white surface, colored border, optional icon/dot */
export function McPill({
  children,
  tone = "neutral",
  icon,
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        TONE_STYLES[tone].pill,
        className
      )}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_STYLES[tone].dot)} />
      ) : icon ? (
        <span className="opacity-90">{icon}</span>
      ) : null}
      {children}
    </span>
  );
}

/** Small category / effort tag */
export function McTag({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone | "purple" | "cyan" | "pink";
  icon?: ReactNode;
  className?: string;
}) {
  const extra: Record<string, string> = {
    purple: "border-purple-200 bg-purple-50/80 text-purple-700",
    cyan: "border-cyan-200 bg-cyan-50/80 text-cyan-700",
    pink: "border-pink-200 bg-pink-50/80 text-pink-700",
  };
  const isTone = tone === "neutral" || tone === "good" || tone === "warn" || tone === "bad" || tone === "accent";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isTone ? TONE_STYLES[tone].pill : extra[tone],
        className
      )}
    >
      {icon ? <span className="opacity-80">{icon}</span> : null}
      {children}
    </span>
  );
}

/** Severity chip with icon + optional count — Issues filter bar */
export function McSeverityChip({
  severity,
  count,
  compact,
  className,
}: {
  severity: Severity;
  count?: number;
  compact?: boolean;
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[4px] border px-2.5 py-1.5",
        TONE_STYLES[meta.tone].pill,
        className
      )}
    >
      <McIconBox icon={<Icon size={14} strokeWidth={2.25} />} tone={meta.tone} size="sm" />
      <span className="text-[11px] font-bold">{meta.label}</span>
      {count != null && !compact ? (
        <span className="rounded-[3px] bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
          {count}
        </span>
      ) : null}
    </span>
  );
}

/** Section header for grouped lists — e.g. "Critical · 4 issues" */
export function McSectionHeader({
  severity,
  count,
  noun = "issue",
  className,
}: {
  severity: Severity;
  count: number;
  noun?: string;
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[4px] border px-3 py-2",
        TONE_STYLES[meta.tone].pill,
        className
      )}
    >
      <McIconBox icon={<Icon size={15} strokeWidth={2.25} />} tone={meta.tone} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">
          {meta.label}
          <span className="mx-1.5 text-muted-foreground/60">·</span>
          {count} {count === 1 ? noun : `${noun}s`}
        </p>
      </div>
    </div>
  );
}

/** Clean alert banner with icon box + accent stripe */
export function McAlert({
  variant = "info",
  title,
  children,
  icon,
  className,
}: {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const conf = ALERT_VARIANT[variant];
  const tone = conf.tone;
  const DefaultIcon = conf.icon;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 overflow-hidden rounded-[4px] border border-border bg-white p-4 shadow-[0_1px_3px_rgb(15_23_42/0.05)]",
        className
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", TONE_STYLES[tone].stripe)}
        aria-hidden
      />
      <McIconBox
        icon={icon ?? <DefaultIcon size={17} strokeWidth={2.25} />}
        tone={tone}
        size="md"
      />
      <div className="min-w-0 flex-1 pl-0.5">
        <p className="text-[13px] font-bold text-foreground">{title}</p>
        {children ? (
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
        ) : null}
      </div>
    </div>
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
                "rounded-[4px] border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-white text-muted-foreground hover:border-accent/40 hover:text-foreground"
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

export { SEVERITY_META, type Severity, type Tone, type AlertVariant };
