"use client";

import { useEffect } from "react";

/**
 * Applies agency branding from localStorage after mount.
 * Replaces the old beforeInteractive script (rejected by React 19).
 */
export function BrandingInit() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bb_branding");
      const b = raw ? (JSON.parse(raw) as { accent_color?: string }) : null;
      if (!b?.accent_color) return;
      const hex = b.accent_color;
      const root = document.documentElement.style;
      root.setProperty("--accent", hex);
      root.setProperty(
        "--accent-hover",
        `color-mix(in srgb, ${hex} 82%, black)`
      );
      root.setProperty(
        "--accent-light",
        `color-mix(in srgb, ${hex} 12%, white)`
      );
      root.setProperty(
        "--accent-deep",
        `color-mix(in srgb, ${hex} 55%, black)`
      );
      root.setProperty(
        "--gradient-brand",
        `linear-gradient(135deg, color-mix(in srgb, ${hex} 85%, white) 0%, ${hex} 45%, color-mix(in srgb, ${hex} 55%, black) 100%)`
      );
      const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
      if (m) {
        const n = parseInt(m[1], 16);
        root.setProperty(
          "--accent-rgb",
          `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
