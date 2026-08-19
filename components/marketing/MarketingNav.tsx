"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/marketing/BrandMark";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { isLoggedIn } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { cmsField } from "@/lib/marketing/cms";

function applyBrandVars(bp: string, ba: string) {
  const r = document.documentElement.style;
  r.setProperty("--accent", bp);
  r.setProperty("--accent-deep", `color-mix(in srgb, ${bp} 55%, black)`);
  r.setProperty(
    "--gradient-brand",
    `linear-gradient(135deg, color-mix(in srgb, ${bp} 85%, white) 0%, ${bp} 45%, color-mix(in srgb, ${bp} 55%, black) 100%)`
  );
  const m = /^#?([0-9a-f]{6})$/i.exec(bp.trim());
  if (m) {
    const n = parseInt(m[1], 16);
    r.setProperty(
      "--accent-rgb",
      `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
    );
  }
  r.setProperty("--mkt-secondary", ba);
}

const FEATURE_DROPDOWN = [
  { href: "/features/performance-monitoring", label: "Performance", desc: "Core Web Vitals & AI Optimize" },
  { href: "/features/ai-agent", label: "AI Agent", desc: "Ask it — then it does the work" },
  { href: "/features/security-scanning", label: "Security Scanning", desc: "Hardening & SSL monitoring" },
  { href: "/features/client-reports", label: "Client Reports", desc: "White-label PDF & portal" },
  { href: "/features/backups", label: "Backups", desc: "Schedule & one-click restore" },
  { href: "/features/seo-monitoring", label: "SEO Monitoring", desc: "Meta, heading & indexability" },
  { href: "/features/uptime-monitoring", label: "Uptime Monitoring", desc: "1-minute checks, instant alerts" },
  { href: "/features/malware-scanning", label: "Malware Scanning", desc: "Behavioral detection, zero load" },
  { href: "/features/broken-links", label: "Broken Links", desc: "Catch 404s before visitors do" },
  { href: "/features/plugin-updates", label: "Plugin Updates", desc: "One-click bulk updates" },
];

const NAV = [
  { label: "Features", href: "/features", hasDropdown: true },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "For agencies", href: "/for/agencies" },
];

export function MarketingNav({
  cms = {},
  initialDark = false,
}: {
  cms?: Record<string, string>;
  initialDark?: boolean;
}) {
  const c = cmsField(cms);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(isLoggedIn());
    const saved = localStorage.getItem("landingDark");
    const active = saved !== null ? saved === "true" : true;
    setIsDark(active);
    document.documentElement.classList.toggle("dark", active);
    document.documentElement.classList.toggle("mkt-dark", active);
  }, [initialDark]);

  useEffect(() => {
    const base = API_BASE_URL.replace(/\/+$/, "");
    fetch(`${base}/content/global?_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const bp = data?.branding?.primary_color;
        const ba = data?.branding?.accent_color;
        if (bp && ba) applyBrandVars(bp, ba);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setFeaturesOpen(false);
  }, [pathname]);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("landingDark", String(next));
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("mkt-dark", next);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--mkt-border)] bg-[color-mix(in_srgb,var(--mkt-surface)_88%,transparent)] shadow-elevated-xs backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <BrandMark inverse={isDark} />

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) =>
            item.hasDropdown ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setFeaturesOpen(true)}
                onMouseLeave={() => setFeaturesOpen(false)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/features")
                      ? "text-accent"
                      : "text-[var(--mkt-muted)] hover:bg-[var(--mkt-bg-muted)] hover:text-[var(--mkt-fg)]"
                  )}
                  aria-expanded={featuresOpen}
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      featuresOpen && "rotate-180"
                    )}
                  />
                </Link>

                <div
                  className={cn(
                    "absolute left-1/2 top-full -translate-x-1/2 pt-2 transition-all duration-200",
                    featuresOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div className="w-[520px] rounded-xl bg-[var(--mkt-surface)] p-3 shadow-elevated-lg ring-1 ring-[var(--mkt-border)]">
                    <div className="grid grid-cols-2 gap-0.5">
                      {FEATURE_DROPDOWN.map((f, idx) => (
                        <Link
                          key={f.href}
                          href={f.href}
                          className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--mkt-bg-muted)]"
                        >
                          <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tabular-nums text-accent/50">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-[var(--mkt-fg)]">
                              {f.label}
                            </span>
                            <span className="block text-[11px] leading-snug text-[var(--mkt-muted)]">
                              {f.desc}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 border-t border-[var(--mkt-border)] pt-1.5">
                      <Link
                        href="/features"
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-[var(--mkt-bg-muted)]"
                      >
                        See plans &amp; pricing
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "text-accent"
                    : "text-[var(--mkt-muted)] hover:bg-[var(--mkt-bg-muted)] hover:text-[var(--mkt-fg)]"
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-[var(--mkt-muted)] transition-colors hover:bg-[var(--mkt-bg-muted)] hover:text-[var(--mkt-fg)]"
            suppressHydrationWarning
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {mounted && loggedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to Dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--mkt-fg)] transition-colors hover:text-[var(--mkt-muted)]"
              >
                Login
              </Link>
              <ButtonLink href={c("nav_cta_url", "/register")} size="sm">
                {c("nav_cta", "Protect My Sites")}
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-[var(--mkt-fg)] hover:bg-[var(--mkt-bg-muted)] lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-[var(--mkt-border)] bg-[var(--mkt-surface)] transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-[85vh] opacity-100" : "max-h-0 border-transparent opacity-0"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--mkt-fg)] hover:bg-[var(--mkt-bg-muted)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-0.5 border-t border-[var(--mkt-border)] pt-3">
            {FEATURE_DROPDOWN.map((f, idx) => (
              <Link
                key={f.href}
                href={f.href}
                className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-[var(--mkt-bg-muted)]"
              >
                <span className="mt-px font-mono text-[10px] font-bold text-accent/40">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-medium text-[var(--mkt-fg)]">
                  {f.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-[var(--mkt-border)] pt-3">
            <button
              type="button"
              onClick={toggleDark}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--mkt-border)] px-4 py-2.5 text-sm font-semibold text-[var(--mkt-fg)]"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
            <Link
              href="/login"
              className="rounded-xl border border-[var(--mkt-border)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--mkt-fg)]"
            >
              Log in
            </Link>
            <ButtonLink href={c("nav_cta_url", "/register")} className="w-full">
              {c("nav_cta", "Start Free")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
