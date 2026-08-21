"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth/AuthShell";
import { getBranding } from "@/lib/auth";
import { cn, isValidEmail } from "@/lib/utils";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [branding, setBranding] = useState<StoredBranding | null>(null);

  function validateEmail(v: string) {
    if (v && !isValidEmail(v)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  useEffect(() => {
    import("@/lib/auth").then(({ isLoggedIn }) => {
      if (isLoggedIn()) {
        router.replace("/dashboard");
        return;
      }
    });

    const paramError = searchParams.get("error");
    if (paramError) setError(paramError);

    const stored = getBranding();
    setBranding(stored);
    if (stored?.accent_color) {
      document.documentElement.style.setProperty("--accent", stored.accent_color);
    }
    fetch(`${API_BASE_URL}/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.maintenance) window.location.href = "/maintenance";
      })
      .catch(() => {});
  }, [router, searchParams]);

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
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const brandName = branding?.brand_name ?? "Site Armor";
  const logoUrl = branding?.logo_url ?? null;

  return (
    <AuthShell
      variant="login"
      brandName={brandName}
      logoUrl={logoUrl}
      title="Welcome back"
      subtitle={`Sign in to ${brandName} and pick up where you left off.`}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-accent hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={authLabelClass}>Email address</label>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={cn(authInputClass, "pl-10", emailError && "border-red-400")}
              placeholder="you@agency.com"
            />
          </div>
          {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
        </div>

        <div>
          <label className={authLabelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(authInputClass, "pr-10")}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-[4px] border border-[var(--score-bad-border)] bg-[var(--score-bad-bg)] px-3.5 py-2.5">
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
          className="w-full"
          size="lg"
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
