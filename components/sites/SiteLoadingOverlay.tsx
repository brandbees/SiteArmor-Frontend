"use client";

import { cn } from "@/lib/utils";

function CubeVisual({ size = 56 }: { size?: number }) {
  const half = size / 2;
  return (
    <div
      className="sa-cube"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="sa-cube-inner">
        {(
          [
            ["front", `translateZ(${half}px)`],
            ["back", `rotateY(180deg) translateZ(${half}px)`],
            ["right", `rotateY(90deg) translateZ(${half}px)`],
            ["left", `rotateY(-90deg) translateZ(${half}px)`],
            ["top", `rotateX(90deg) translateZ(${half}px)`],
            ["bottom", `rotateX(-90deg) translateZ(${half}px)`],
          ] as const
        ).map(([face, transform]) => (
          <span
            key={face}
            className={cn("sa-cube-face", face === "front" && "sa-cube-face-front")}
            style={{ width: size, height: size, transform }}
          />
        ))}
      </div>
    </div>
  );
}

/** Rotating 3D cube loader for site detail transitions. */
export function SiteLoadingOverlay({
  siteName,
  message = "Fetching the latest status, scores, and monitors for this site.",
}: {
  siteName?: string;
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f4f5]/92 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-5 px-6 py-4">
        <CubeVisual size={56} />
        <div className="max-w-xs text-center">
          <p className="text-sm font-semibold text-zinc-900">
            {siteName ? `Loading ${siteName}` : "Loading site"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{message}</p>
        </div>
      </div>
    </div>
  );
}

/** Inline cube for tab/section loading states */
export function CubeLoader({
  label = "Loading…",
  sublabel,
  className,
}: {
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}>
      <CubeVisual size={40} />
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        {sublabel ? <p className="mt-1 text-xs text-zinc-500">{sublabel}</p> : null}
      </div>
    </div>
  );
}
