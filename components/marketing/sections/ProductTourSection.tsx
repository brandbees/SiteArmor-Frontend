"use client";

import { ScrollPinnedCarousel } from "@/components/marketing/ScrollPinnedCarousel";
import { TOUR_SLIDES } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

/**
 * Distinct from the hero reel: scroll-pinned horizontal product tour.
 * Vertical scroll moves the gallery sideways until the last screen, then releases.
 */
export function ProductTourSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <section
      id="product-tour"
      className="bg-[var(--mkt-bg-muted)]"
      aria-label="Product tour"
    >
      <ScrollPinnedCarousel
        ids={TOUR_SLIDES}
        eyebrow={c("eyebrow", "Inside the product")}
        title={c("title", "Scroll through the real product.")}
        description={c(
          "description",
          "Keep scrolling — the tour moves sideways through dashboard, sites, agent, audits, and reports. When it ends, the page scrolls normally again."
        )}
      />
    </section>
  );
}
