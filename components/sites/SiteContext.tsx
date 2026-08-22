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
  const prevId = useRef(siteId);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (prevId.current !== siteId) {
      setTransitioning(true);
      prevId.current = siteId;
    }
  }, [siteId]);

  useEffect(() => {
    if (!loading) setTransitioning(false);
  }, [loading]);

  const showLoader = transitioning || (loading && !site);

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
      {showLoader && <SiteLoadingOverlay siteName={site?.name} />}
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
