"use client";

import { cn, scoreHex } from "@/lib/utils";

/**
 * MalCare-style site score wheel — number sits INSIDE a soft ring,
 * caption underneath. Used in Performance / Security / Overview cards.
 */
export function SiteScoreWheel({
  score,
  caption = "Site Score",
  size = 120,
  className,
}: {
  score: number | null | undefined;
  caption?: string;
  size?: number;
  className?: string;
}) {
  const v = score == null ? null : Math.max(0, Math.min(100, score));
  const color = v == null ? "#cbd5e1" : scoreHex(v);
  const track = "#eef1f5";
  const stroke = Math.max(8, Math.round(size * 0.08));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = v == null ? 0 : v / 100;
  const dash = c * pct;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-portal-display font-bold tabular-nums leading-none text-foreground"
            style={{ fontSize: size * 0.28 }}
          >
            {v == null ? "—" : v}
          </span>
        </div>
      </div>
      {caption ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
