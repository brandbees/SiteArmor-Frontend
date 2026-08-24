"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { SiteProvider } from "@/components/sites/SiteContext";
import { isLoggedIn, isTokenExpired, clearToken, getAgency } from "@/lib/auth";

// Paths a client portal user is allowed to visit
const CLIENT_ALLOWED = ["/dashboard", "/sites", "/seo", "/performance", "/security", "/malware", "/uptime"];

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => pathname === "/sites" || pathname === "/sites/add" || pathname === "/clients/add"
  );
  const sidebarUserToggled = useRef(false);
  const prevPathname = useRef<string | null>(null);
  const isSitesList = pathname === "/sites";
  const isSiteSetup = pathname === "/sites/add";
  const isClientSetup = pathname === "/clients/add";
  const isSetup = isSiteSetup || isClientSetup;
  const isSiteDetail = /^\/sites\/[^/]+$/.test(pathname ?? "") && !isSiteSetup;
  const siteDetailId = isSiteDetail ? pathname?.match(/^\/sites\/([^/]+)$/)?.[1] : undefined;
  const isDashboard = pathname === "/dashboard";
  const isFullBleed =
    isSiteDetail ||
    isDashboard ||
    isSetup ||
    pathname === "/sites" ||
    pathname === "/notifications" ||
    pathname === "/reports" ||
    pathname === "/agent" ||
    /^\/reports\/[^/]+(\/[^/]+)?$/.test(pathname ?? "");
  const isAgent = pathname === "/agent";

  useEffect(() => {
    const prev = prevPathname.current;
    const enteringSites = (isSitesList || isSiteDetail || isSetup) && prev !== "/sites" && !prev?.match(/^\/sites\/[^/]+$/) && prev !== "/sites/add" && prev !== "/clients/add";
    const leavingSites = !isSitesList && !isSiteDetail && !isSetup && (prev === "/sites" || prev === "/sites/add" || prev === "/clients/add" || !!prev?.match(/^\/sites\/[^/]+$/));

    if (enteringSites) {
      setSidebarCollapsed(true);
      sidebarUserToggled.current = false;
    } else if (leavingSites) {
      setSidebarCollapsed(localStorage.getItem("bb_sidebar_collapsed") === "1");
      sidebarUserToggled.current = false;
    } else if (prev === null && !isSitesList && !isSiteDetail && !isSetup) {
      setSidebarCollapsed(localStorage.getItem("bb_sidebar_collapsed") === "1");
    }

    prevPathname.current = pathname ?? "";
  }, [pathname, isSitesList, isSiteDetail, isSetup]);

  function toggleSidebar() {
    sidebarUserToggled.current = true;
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (!isSitesList && !isSiteDetail && !isSetup) {
        localStorage.setItem("bb_sidebar_collapsed", next ? "1" : "0");
      }
      return next;
    });
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    // Client portal users can only access specific routes
    const agency = getAgency();
    if (agency?.is_client_portal) {
      const path = window.location.pathname;
      const allowed = CLIENT_ALLOWED.some(p => path === p || path.startsWith(p + "/"));
      if (!allowed) { router.replace("/dashboard"); return; }
    }

    import("@/lib/api").then(({ default: api }) => {
      // Check maintenance before rendering any dashboard content
      api.get("/status").then(({ data }) => {
        if (data.maintenance) {
          window.location.href = "/maintenance";
        } else {
          setReady(true);
        }
      }).catch(() => {
        // On error, allow through so a network hiccup doesn't lock agencies out
        setReady(true);
      });

      // Always verify onboarding status from the server — localStorage can be stale
      api.get("/auth/me").then(({ data }) => {
        const agency = data.agency;
        if (agency && agency.onboarding_complete === false && agency.trial_ends_at != null) {
          api.get("/sites?limit=1").then(({ data: sitesData }) => {
            if ((sitesData.total ?? sitesData.sites?.length ?? 0) === 0) {
              router.replace("/onboarding");
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    });
  }, [router]);

  // Global refresh listener — persists across route changes to catch bb:refresh events
  useEffect(() => {
    function handleRefresh() {
      // Mark that data needs refreshing even if component is unmounted
      sessionStorage.setItem('needsDataRefresh', 'true');
      // Emit a persisting event that all pages can listen for
      window.dispatchEvent(new CustomEvent('data-refresh-needed'));
    }
    window.addEventListener('bb:refresh', handleRefresh);
    return () => window.removeEventListener('bb:refresh', handleRefresh);
  }, []);

  // Auto-logout on inactivity or when returning to a tab with an expired token
  useEffect(() => {
    function doLogout() {
      clearToken();
      window.location.href = "/login";
    }

    function resetTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(doLogout, IDLE_TIMEOUT_MS);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible" && isTokenExpired()) {
        doLogout();
      }
    }

    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);
    resetTimer();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!ready) return null;

  const dashboardShell = (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f4f5]">
      <AnnouncementBanner />
      <TrialBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar collapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
          <main
            className={cn(
              "min-w-0 flex-1 overflow-x-auto",
              isDashboard ? "flex flex-col bg-[#f4f4f5]" : "bg-[#f4f4f5]",
              isFullBleed ? "p-0" : "p-4 md:p-5",
              isAgent || isSiteDetail || isSetup || pathname?.startsWith("/reports")
                ? "flex flex-col overflow-hidden"
                : "overflow-y-auto"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <BrandingProvider>
      {siteDetailId ? (
        <SiteProvider siteId={siteDetailId}>{dashboardShell}</SiteProvider>
      ) : (
        dashboardShell
      )}
    </BrandingProvider>
  );
}
