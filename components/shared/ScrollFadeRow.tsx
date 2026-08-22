"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal scroll row with hidden scrollbar, edge fades, and chevron nudges. */
export function ScrollFadeRow({
  children,
  className,
  innerClassName,
  fadeFrom = "from-white",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Tailwind gradient start color, e.g. `from-white` or `from-[var(--background)]` */
  fadeFrom?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  return (
    <div className={cn("group/scroll relative", className)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-200",
          fadeFrom,
          canLeft && "opacity-100"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent opacity-0 transition-opacity duration-200",
          fadeFrom,
          canRight && "opacity-100"
        )}
      />

      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scroll(-1)}
        className={cn(
          "absolute left-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] border border-border bg-white/95 text-muted-foreground shadow-elevated-xs backdrop-blur-sm transition-all hover:text-foreground",
          canLeft
            ? "opacity-0 group-hover/scroll:opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <ChevronLeft size={15} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scroll(1)}
        className={cn(
          "absolute right-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] border border-border bg-white/95 text-muted-foreground shadow-elevated-xs backdrop-blur-sm transition-all hover:text-foreground",
          canRight
            ? "opacity-0 group-hover/scroll:opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <ChevronRight size={15} strokeWidth={2.25} />
      </button>

      <div
        ref={ref}
        className={cn(
          "scrollbar-none overflow-x-auto overscroll-x-contain",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
