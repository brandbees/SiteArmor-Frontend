"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";

/**
 * Vertical scroll drives horizontal travel through product screens.
 * Section pins while you scroll the runway, then releases back to normal scroll.
 */
export function ScrollPinnedCarousel({
  ids,
  className,
  title,
  eyebrow,
  description,
}: {
  ids: SnapshotId[];
  className?: string;
  title?: string;
  eyebrow?: string;
  description?: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [travel, setTravel] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [32, -travel]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(
      ids.length - 1,
      Math.max(0, Math.round(v * (ids.length - 1)))
    );
    setActive(i);
  });

  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      if (!track) return;
      // Distance needed so the last card can enter the viewport
      const overflow = track.scrollWidth - window.innerWidth + 48;
      setTravel(Math.max(0, overflow));
    }
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [ids]);

  if (reduce) {
    return (
      <div className={cn("py-16", className)}>
        <Header eyebrow={eyebrow} title={title} description={description} />
        <div className="flex gap-5 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ids.map((id) => (
            <SlideCard key={id} id={id} active />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ height: `${Math.max(ids.length * 70, 280)}vh` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden py-8">
        <Header eyebrow={eyebrow} title={title} description={description} />

        <div className="relative mt-2 w-full overflow-hidden">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex w-max gap-6 pl-6 sm:pl-10 will-change-transform"
          >
            {ids.map((id, i) => (
              <SlideCard key={id} id={id} active={i === active} />
            ))}
          </motion.div>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-xs flex-col items-center gap-2 px-6">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--mkt-border)]">
            <motion.div
              className="h-full origin-left rounded-full bg-accent"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
          <p className="text-xs text-[var(--mkt-muted)]">
            <span className="font-semibold text-[var(--mkt-fg)]">
              {SNAPSHOTS[ids[active]]?.label}
            </span>
            <span className="mx-1.5 opacity-40">·</span>
            {active + 1}/{ids.length}
            <span className="ml-2 opacity-60">scroll to explore</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Header({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  if (!eyebrow && !title) return null;
  return (
    <div className="mx-auto mb-8 max-w-2xl shrink-0 px-6 text-center">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--mkt-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SlideCard({ id, active }: { id: SnapshotId; active: boolean }) {
  const snap = SNAPSHOTS[id];
  return (
    <article
      className={cn(
        "w-[min(85vw,540px)] shrink-0 transition-[opacity,transform] duration-500",
        active ? "scale-100 opacity-100" : "scale-[0.96] opacity-50"
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-2.5 shadow-elevated-md ring-1 transition-shadow duration-500",
          active ? "shadow-elevated-lg ring-accent/20" : "ring-[var(--mkt-border)]"
        )}
      >
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
          <span className="ml-1.5 truncate text-[10px] font-medium text-[var(--mkt-muted)]">
            app.sitearmor · {snap.label}
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
            sizes="540px"
            className="object-cover object-top"
          />
        </div>
      </div>
      <div className="mt-4 px-1">
        <p className="text-base font-semibold text-[var(--mkt-fg)]">{snap.label}</p>
        <p className="mt-0.5 text-sm text-[var(--mkt-muted)]">{snap.caption}</p>
      </div>
    </article>
  );
}
