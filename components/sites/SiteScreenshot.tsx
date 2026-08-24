"use client";

import { useState } from "react";
import { Globe, ShieldAlert, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";

export function siteScreenshotSrc(url: string, width = 480): string {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(href)}?w=${width}`;
}

export function faviconSrc(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

export function SiteScreenshot({
  url,
  connected,
  hacked,
  className,
  width = 480,
}: {
  url: string;
  connected?: boolean;
  hacked?: boolean;
  className?: string;
  width?: number;
}) {
  const [failed, setFailed] = useState(false);
  const shot = siteScreenshotSrc(url, width);
  const fav = faviconSrc(url);
  const unlinked = connected === false;

  return (
    <div className={cn("relative overflow-hidden bg-zinc-100", className)}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shot}
          alt=""
          className="h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : fav ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fav} alt="" className="h-full w-full object-contain p-4" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Globe size={22} className="text-zinc-400" strokeWidth={1.5} />
        </div>
      )}
      {(hacked || unlinked) && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white",
            hacked ? "bg-red-600/90" : "bg-zinc-700/85"
          )}
        >
          {hacked ? (
            <>
              <ShieldAlert size={14} strokeWidth={1.5} />
              Hacked
            </>
          ) : (
            <>
              <Unplug size={14} strokeWidth={1.5} />
              Unlinked
            </>
          )}
        </div>
      )}
    </div>
  );
}
