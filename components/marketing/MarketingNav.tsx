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
  Gauge,
  Shield,
  Bot,
  FileText,
  HardDrive,
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
  { href: "/features/performance-monitoring", label: "Performance", desc: "Monitor & AI Optimize", icon: Gauge },
  { href: "/features/ai-agent", label: "AI Agent", desc: "Ask it — then it does the work", icon: Bot },
  { href: "/features/security-scanning", label: "Security", desc: "Hardening & SSL monitoring", icon: Shield },
  { href: "/features/client-reports", label: "Client reports", desc: "White-label PDFs", icon: FileText },
  { href: "/features/backups", label: "Backups", desc: "Schedule & one-click restore", icon: HardDrive },
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
  const [isDark, setIsDark] = useState(initialDark);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(isLoggedIn());
    const saved = localStorage.getItem("landingDark");
    const active = saved !== null ? saved === "true" : initialDark;
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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <BrandMark />

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
                    "absolute left-0 top-full pt-2 transition-all duration-200",
                    featuresOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div className="w-[380px] rounded-2xl bg-[var(--mkt-surface)] p-2 shadow-elevated-lg">
                    <div className="grid grid-cols-1 gap-0.5">
                      {FEATURE_DROPDOWN.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Link
                            key={f.href}
                            href={f.href}
                            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--mkt-bg-muted)]"
                          >
                            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                              <Icon size={15} />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-[var(--mkt-fg)]">
                                {f.label}
                              </span>
                              <span className="block text-xs text-[var(--mkt-muted)]">
                                {f.desc}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href="/features"
                      className="mt-1 flex items-center justify-between rounded-xl bg-[var(--mkt-bg-muted)] px-3 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-light"
                    >
                      View all features
                      <span aria-hidden>→</span>
                    </Link>
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
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--mkt-muted)] transition-colors hover:bg-[var(--mkt-bg-muted)] hover:text-[var(--mkt-fg)]"
              >
                Log in
              </Link>
              <ButtonLink href={c("nav_cta_url", "/register")} size="sm">
                {c("nav_cta", "Start Free")}
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
          <div className="grid grid-cols-2 gap-1 border-t border-[var(--mkt-border)] pt-3">
            {FEATURE_DROPDOWN.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--mkt-muted)] hover:bg-[var(--mkt-bg-muted)] hover:text-[var(--mkt-fg)]"
              >
                {f.label}
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
