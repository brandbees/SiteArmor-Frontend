"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";

/**
 * Multi-feature hero showcase — soft crossfade between key product screens.
 * Frame aspect follows the active slide's native ratio (no object-cover zoom).
 */
export function SnapshotGif({
  ids,
  intervalMs = 4000,
  className,
  aspect,
  priority,
  chrome = true,
  showLabels = true,
}: {
  ids: SnapshotId[];
  intervalMs?: number;
  className?: string;
  /** Optional locked frame; defaults to each slide's native aspect. */
  aspect?: string;
  priority?: boolean;
  chrome?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const active = SNAPSHOTS[ids[index] ?? ids[0]];
  const frameAspect = aspect ?? active.aspect ?? "1920 / 878";

  useEffect(() => {
    setMounted(true);
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % ids.length) + ids.length) % ids.length);
    },
    [ids.length]
  );

  useEffect(() => {
    if (!mounted || reduce || ids.length < 2 || paused) return;
    const t = window.setInterval(() => go(index + 1), intervalMs);
    return () => window.clearInterval(t);
  }, [mounted, ids.length, intervalMs, reduce, paused, index, go]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-lg ring-1 ring-[var(--mkt-border)]",
          chrome ? "p-2 sm:p-2.5" : "p-0"
        )}
      >
        {chrome ? (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-1.5 flex h-5 min-w-0 flex-1 items-center rounded-md bg-[var(--mkt-bg-muted)] px-2.5">
              <span className="truncate text-[10px] font-medium text-[var(--mkt-muted)]">
                app.sitearmor · {active.label}
              </span>
            </div>
          </div>
        ) : null}

        <div
          className="relative overflow-hidden rounded-xl bg-[var(--mkt-bg-muted)]"
          style={{ aspectRatio: frameAspect }}
        >
          {ids.length > 1 ? (
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex gap-1.5">
              {ids.map((id, i) => (
                <span
                  key={`${id}-bar`}
                  className={cn(
                    "relative h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-accent",
                      i === index && !paused && !reduce && "animate-mkt-story-bar"
                    )}
                    style={{
                      width: i === index ? "100%" : i < index ? "100%" : "0%",
                      animationDuration: `${intervalMs}ms`,
                    }}
                  />
                </span>
              ))}
            </div>
          ) : null}
          {ids.map((id, i) => {
            const snap = SNAPSHOTS[id];
            const isActive = i === index;
            return (
              <div
                key={id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-out",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                aria-hidden={!isActive}
              >
                <Image
                  src={snap.src}
                  alt={isActive ? snap.alt : ""}
                  fill
                  priority={priority && i === 0}
                  quality={95}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                  className="object-contain object-top"
                />
              </div>
            );
          })}
        </div>
      </div>

      {showLabels && ids.length > 1 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ids.map((id, i) => {
            const snap = SNAPSHOTS[id];
            return snap.href ? (
              <Link
                key={id}
                href={snap.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  i === index
                    ? "bg-accent text-white shadow-elevated-xs"
                    : "bg-[var(--mkt-surface)] text-[var(--mkt-muted)] ring-1 ring-[var(--mkt-border)] hover:text-[var(--mkt-fg)]"
                )}
                onMouseEnter={() => go(i)}
              >
                {snap.label}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => go(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  i === index
                    ? "bg-accent text-white shadow-elevated-xs"
                    : "bg-[var(--mkt-surface)] text-[var(--mkt-muted)] ring-1 ring-[var(--mkt-border)] hover:text-[var(--mkt-fg)]"
                )}
              >
                {snap.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SnapshotReel(props: Parameters<typeof SnapshotGif>[0]) {
  return <SnapshotGif {...props} />;
}
