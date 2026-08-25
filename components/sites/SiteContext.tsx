"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useSite, type SiteDetail } from "@/hooks/useSite";
import { SiteLoadingOverlay } from "@/components/sites/SiteLoadingOverlay";

type SiteContextValue = {
  siteId: string;
  site: SiteDetail | null;
  loading: boolean;
  error: string | null;
  refetch: (invalidate?: boolean) => void;
  transitioning: boolean;
};

const SiteContext = createContext<SiteContextValue | null>(null);

const MIN_OVERLAY_MS = 500;

export function SiteProvider({
  children,
  siteId: siteIdOverride,
}: {
  children: ReactNode;
  siteId?: string;
}) {
  const params = useParams<{ id: string }>();
  const siteId = siteIdOverride ?? params.id ?? "";
  const { site, loading, error, refetch } = useSite(siteId);
  const prevId = useRef<string | null>(null);
  const [transitioning, setTransitioning] = useState(Boolean(siteId));
  const shownAt = useRef(Date.now());

  // Show cube whenever we enter a site or switch sites
  useEffect(() => {
    if (!siteId) {
      setTransitioning(false);
      return;
    }
    if (prevId.current !== siteId) {
      prevId.current = siteId;
      shownAt.current = Date.now();
      setTransitioning(true);
    }
  }, [siteId]);

  // Keep overlay up until fetch settles, with a minimum visible time
  useEffect(() => {
    if (!transitioning) return;
    if (loading) return;

    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, MIN_OVERLAY_MS - elapsed);
    const t = window.setTimeout(() => setTransitioning(false), wait);
    return () => window.clearTimeout(t);
  }, [loading, transitioning, siteId]);

  const showLoader = Boolean(siteId) && (transitioning || (loading && !site));

  return (
    <SiteContext.Provider
      value={{
        siteId,
        site,
        loading,
        error,
        refetch: (invalidate?: boolean) => {
          void refetch(invalidate);
        },
        transitioning,
      }}
    >
      {showLoader && (
        <SiteLoadingOverlay
          siteName={site?.name}
          message="Preparing overview, monitors, and the latest audit signals."
        />
      )}
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSiteContext must be used within SiteProvider");
  return ctx;
}

/** Optional — TopBar breadcrumb when outside strict provider tree timing */
export function useSiteContextOptional() {
  return useContext(SiteContext);
}
