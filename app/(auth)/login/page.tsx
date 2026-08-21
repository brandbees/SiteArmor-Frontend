"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { getBranding } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import type { StoredBranding } from "@/lib/auth";

const CF_SITE_KEY = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY ?? "";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);

  function validateEmail(v: string) {
    if (v && !isValidEmail(v)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  // Start null so SSR and first client render match — populated in useEffect (client-only)
  const [branding, setBranding] = useState<StoredBranding | null>(null);

  useEffect(() => {
    // Already logged in — skip login page
    import("@/lib/auth").then(({ isLoggedIn }) => {
      if (isLoggedIn()) { router.replace("/dashboard"); return; }
    });

    // Pre-fill error from ?error= param (e.g. redirected here after suspension)
    const paramError = searchParams.get("error");
    if (paramError) setError(paramError);

    const stored = getBranding();
    setBranding(stored);
    if (stored?.accent_color) {
      document.documentElement.style.setProperty("--accent", stored.accent_color);
    }
    // Redirect to maintenance page if platform is down
    fetch(`${API_BASE_URL}/status`)
      .then(r => r.json())
      .then(d => { if (d.maintenance) window.location.href = "/maintenance"; })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password, cfToken);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const brandName = branding?.brand_name ?? "Site Armor";
  const logoUrl   = branding?.logo_url   ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className="mb-4 h-12 w-auto object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/site-armor-icon.png" alt="Site Armor" className="mb-4 h-14 w-14 object-contain" />
          )}
          <h1 className="font-portal-display text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">to {brandName}</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-7 shadow-elevated-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={(e) => validateEmail(e.target.value)}
                className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.12)] transition-shadow ${emailError ? "border-red-400" : "border-border"}`}
                placeholder="you@agency.com"
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.12)] transition-shadow"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="mt-1.5 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-accent"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] px-3.5 py-2.5">
                <p className="text-sm text-[var(--score-bad)]">{error}</p>
              </div>
            )}

            {CF_SITE_KEY && (
              <Turnstile
                siteKey={CF_SITE_KEY}
                onSuccess={setCfToken}
                onExpire={() => setCfToken(null)}
                onError={() => setCfToken(null)}
                options={{ theme: "light", size: "flexible" }}
              />
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!!emailError || (!!CF_SITE_KEY && !cfToken)}
              className="mt-1 w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-accent hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
