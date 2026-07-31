"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";
import { cn } from "@/lib/utils";

export function ProductSlider({
  ids,
  className,
}: {
  ids: SnapshotId[];
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollByCard(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slide]");
    const amount = card ? card.offsetWidth + 16 : 320;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Previous screenshot"
          onClick={() => scrollByCard(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mkt-surface)] text-[var(--mkt-fg)] shadow-elevated-xs transition-all hover:-translate-y-px hover:shadow-elevated-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next screenshot"
          onClick={() => scrollByCard(1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mkt-surface)] text-[var(--mkt-fg)] shadow-elevated-xs transition-all hover:-translate-y-px hover:shadow-elevated-sm"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ids.map((id) => {
          const snap = SNAPSHOTS[id];
          return (
            <div
              key={id}
              data-slide
              className="w-[min(88vw,420px)] shrink-0 snap-start sm:w-[440px]"
            >
              <ProductFrame
                snapshot={snap}
                size="md"
                showCaption
                aspectOverride="16 / 10"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
