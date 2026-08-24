"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";

/**
 * Horizontal product carousel — controls centered under the track.
 */
export function ShowcaseCarousel({
  ids,
  className,
  autoPlay = true,
  intervalMs = 4500,
  cardWidth = "min(78vw, 520px)",
  fadeFrom = "var(--mkt-bg-muted)",
}: {
  ids: SnapshotId[];
  className?: string;
  autoPlay?: boolean;
  intervalMs?: number;
  cardWidth?: string;
  fadeFrom?: string;
}) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function scrollToIndex(i: number) {
    const el = scroller.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-slide]");
    const target = slides[i];
    if (!target) return;
    el.scrollTo({
      left: target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  function scrollByCard(dir: -1 | 1) {
    scrollToIndex((active + dir + ids.length) % ids.length);
  }

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const onScroll = () => {
      const slides = el.querySelectorAll<HTMLElement>("[data-slide]");
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const center = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [ids.length]);

  useEffect(() => {
    if (!mounted || !autoPlay || reduce || paused || ids.length < 2) return;
    const t = window.setInterval(() => {
      scrollToIndex((active + 1) % ids.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [mounted, autoPlay, reduce, paused, active, ids.length, intervalMs]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 md:w-24"
          style={{
            background: `linear-gradient(to right, ${fadeFrom}, transparent)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 md:w-24"
          style={{
            background: `linear-gradient(to left, ${fadeFrom}, transparent)`,
          }}
        />

        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1rem,calc((100%-min(78vw,520px))/2))] pb-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ids.map((id, i) => {
            const snap = SNAPSHOTS[id];
            const isActive = i === active;
            return (
              <button
                key={id}
                type="button"
                data-slide
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "shrink-0 snap-center text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  isActive
                    ? "scale-100 opacity-100"
                    : "scale-[0.94] opacity-50 hover:opacity-75"
                )}
                style={{ width: cardWidth }}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-2 shadow-elevated-md ring-1 transition-all duration-500",
                    isActive
                      ? "shadow-elevated-lg ring-accent/30"
                      : "ring-[var(--mkt-border)]"
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-1.5 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
                    <span className="ml-1 truncate text-[9px] font-medium text-[var(--mkt-muted)]">
                      {snap.label}
                    </span>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-xl bg-[var(--mkt-bg-muted)]"
                    style={{ aspectRatio: snap.aspect ?? "16 / 10" }}
                  >
                    <Image
                      src={snap.src}
                      alt={snap.alt}
                      fill
                      sizes="520px"
                      className="object-contain object-top"
                    />
                  </div>
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-[var(--mkt-fg)]">
                  {snap.label}
                </p>
                <p className="mt-0.5 text-center text-xs text-[var(--mkt-muted)]">
                  {snap.caption}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls centered under the carousel */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByCard(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mkt-surface)] text-[var(--mkt-fg)] shadow-elevated-sm ring-1 ring-[var(--mkt-border)] transition-all hover:-translate-y-px hover:bg-accent hover:text-white hover:ring-accent"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5 rounded-full bg-[var(--mkt-surface)] px-3 py-2 shadow-elevated-xs ring-1 ring-[var(--mkt-border)]">
          {ids.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-label={SNAPSHOTS[id].label}
              aria-current={i === active ? "true" : undefined}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active
                  ? "h-2.5 w-7 bg-accent"
                  : "h-2.5 w-2.5 bg-[var(--mkt-border-strong)] hover:bg-[var(--mkt-muted)]"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByCard(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mkt-surface)] text-[var(--mkt-fg)] shadow-elevated-sm ring-1 ring-[var(--mkt-border)] transition-all hover:-translate-y-px hover:bg-accent hover:text-white hover:ring-accent"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
