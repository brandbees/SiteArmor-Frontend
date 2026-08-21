import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Border-first metric tile — Sites/Dashboard language */
export function MetricTile({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="shrink-0 text-accent">{icon}</span> : null}
      </div>
      <p className="font-portal-display text-2xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      {sub ? (
        <div className="mt-2 text-xs font-medium text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

/** White content panel */
export function SectionCard({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PortalTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
