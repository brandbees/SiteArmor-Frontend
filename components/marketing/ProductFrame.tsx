"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SnapshotMeta } from "@/lib/marketing/snapshots";

type FrameSize = "sm" | "md" | "lg" | "hero";

const sizePad: Record<FrameSize, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
  hero: "p-2.5 sm:p-3",
};

/**
 * Browser-chrome frame around pre-cropped landscape snapshot assets.
 */
export function ProductFrame({
  snapshot,
  className,
  size = "md",
  priority,
  float,
  showCaption,
  aspectOverride,
  chrome = true,
}: {
  snapshot: SnapshotMeta;
  className?: string;
  size?: FrameSize;
  priority?: boolean;
  float?: boolean;
  showCaption?: boolean;
  aspectOverride?: string;
  chrome?: boolean;
}) {
  const aspect = aspectOverride ?? snapshot.aspect ?? "16 / 10";

  return (
    <figure className={cn("group relative", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-lg ring-1 ring-[var(--mkt-border)]",
          chrome ? sizePad[size] : "p-0",
          float && "animate-mkt-float"
        )}
      >
        {chrome ? (
          <div className="mb-2 flex items-center gap-2 px-1.5 pt-0.5">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-2 flex h-5 flex-1 items-center rounded-md bg-[var(--mkt-bg-muted)] px-2.5">
              <span className="truncate text-[10px] font-medium text-[var(--mkt-muted)]">
                app.sitearmor · {snapshot.label}
              </span>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "relative overflow-hidden bg-[var(--mkt-bg-muted)]",
            chrome ? "rounded-xl" : "rounded-2xl"
          )}
          style={{ aspectRatio: aspect }}
        >
          {snapshot.darkSrc ? (
            <>
              <Image
                src={snapshot.src}
                alt={snapshot.alt}
                fill
                priority={priority}
                quality={95}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                className="object-contain object-top dark:hidden"
              />
              <Image
                src={snapshot.darkSrc}
                alt=""
                aria-hidden
                fill
                priority={priority}
                quality={95}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                className="hidden object-contain object-top dark:block"
              />
            </>
          ) : (
            <Image
              src={snapshot.src}
              alt={snapshot.alt}
              fill
              priority={priority}
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
              className="object-contain object-top"
            />
          )}
        </div>
      </div>

      {showCaption ? (
        <figcaption className="mt-3 text-center text-sm text-[var(--mkt-muted)]">
          <span className="font-semibold text-[var(--mkt-fg)]">{snapshot.label}</span>
          {" — "}
          {snapshot.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
