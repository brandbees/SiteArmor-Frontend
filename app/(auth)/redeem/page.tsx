"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth/AuthShell";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import { isValidEmail } from "@/lib/utils";
import { PLAN_LABELS } from "@/lib/constants";

const CF_SITE_KEY = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY ?? "";

const STACK_HINT = [
  { codes: "1 code · Starter", plan: "$45 LTD", limits: "1 site · 2 seats · 20k tokens" },
  { codes: "2 codes · Growth", plan: "$89 LTD", limits: "3 sites · 3 seats · 50k tokens" },
  { codes: "3 codes · Agency+", plan: "$139 LTD", limits: "5 sites · 5 seats · 100k tokens · backups" },
];

function RedeemInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyEmail, login, refreshAgency } = useAuth();

  const prefill = (searchParams.get("code") || searchParams.get("coupon") || "").toUpperCase();

  const [mode, setMode] = useState<"signup" | "login" | "stack">("signup");
  const [loggedIn, setLoggedIn] = useState(false);
  const [phase, setPhase] = useState<"form" | "verify">("form");
  const [pendingEmail, setPendingEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(prefill);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ plan: string; label?: string; codes?: number } | null>(null);

  useEffect(() => {
    const ok = isLoggedIn();
    setLoggedIn(ok);
    if (ok) setMode("stack");
  }, []);

  useEffect(() => {
    if (prefill) setCode(prefill);
  }, [prefill]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!code.trim()) {
      setError("AppSumo code is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(name, email, password, code.trim(), cfToken, "agency");
      if (result.pending) {
        setPendingEmail(result.email);
        setPhase("verify");
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmail(pendingEmail, otp.trim());
      await refreshAgency();
      router.replace("/billing?section=plans");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Invalid verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginRedeem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("AppSumo code is required.");
      return;
    }
    setLoading(true);
    try {
      if (!isLoggedIn()) {
        await login(email, password, cfToken);
      }
      const { data } = await api.post<{
        plan: string;
        label?: string;
        codes_redeemed?: number;
      }>("/billing/coupons/redeem", { code: code.trim() });
      await refreshAgency();
      setDone({
        plan: data.plan,
        label: data.label,
        codes: data.codes_redeemed,
      });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Could not redeem code."
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        variant="register"
        title="Code redeemed"
        subtitle="Your AppSumo plan is active"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re on{" "}
            <span className="font-semibold text-foreground">
              {done.label || PLAN_LABELS[done.plan] || done.plan}
            </span>
            {done.codes ? ` · ${done.codes} code${done.codes === 1 ? "" : "s"} stacked` : ""}.
          </p>
          <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
          <p className="text-xs text-muted-foreground">
            Stack more codes anytime from Plans &amp; Billing → Coupon.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="register"
      title="Redeem AppSumo code"
      subtitle="Create your account or stack a code on an existing account — no payment required"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@brandbees.io" className="font-semibold text-accent hover:underline">
            support@brandbees.io
          </a>
        </p>
      }
    >
      <div className="mb-5 rounded-[4px] border border-border bg-[#f7f9fc] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Stackable plans
        </p>
        <ul className="mt-2 space-y-1">
          {STACK_HINT.map((row) => (
            <li key={row.codes} className="flex justify-between gap-3 text-xs text-foreground">
              <span className="text-muted-foreground">{row.codes}</span>
              <span className="font-medium">{row.plan}</span>
              <span className="text-muted-foreground">{row.limits}</span>
            </li>
          ))}
        </ul>
      </div>

      {!loggedIn && phase === "form" && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-[4px] px-3 py-2 text-xs font-semibold ${
              mode === "signup" ? "bg-accent text-white" : "bg-[#f0f2f5] text-muted-foreground"
            }`}
          >
            New account
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-[4px] px-3 py-2 text-xs font-semibold ${
              mode === "login" ? "bg-accent text-white" : "bg-[#f0f2f5] text-muted-foreground"
            }`}
          >
            Existing account
          </button>
        </div>
      )}

      {phase === "verify" ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We emailed a code to <span className="font-semibold text-foreground">{pendingEmail}</span>
          </p>
          <div>
            <label className={authLabelClass}>Verification code</label>
            <input
              className={authInputClass}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Verify &amp; activate
          </Button>
        </form>
      ) : mode === "signup" && !loggedIn ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className={authLabelClass}>Name / agency</label>
            <input className={authInputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={authLabelClass}>Email</label>
            <input
              type="email"
              className={authInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className={authLabelClass}>Password</label>
            <input
              type="password"
              className={authInputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={authLabelClass}>AppSumo code</label>
            <input
              className={`${authInputClass} font-mono uppercase tracking-wider`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="SAXXXXXXXXXX"
            />
          </div>
          {CF_SITE_KEY ? (
            <Turnstile siteKey={CF_SITE_KEY} onSuccess={setCfToken} onExpire={() => setCfToken(null)} />
          ) : null}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create account &amp; redeem
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLoginRedeem} className="space-y-4">
          {!loggedIn && (
            <>
              <div>
                <label className={authLabelClass}>Email</label>
                <input
                  type="email"
                  className={authInputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={authLabelClass}>Password</label>
                <input
                  type="password"
                  className={authInputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {CF_SITE_KEY ? (
                <Turnstile siteKey={CF_SITE_KEY} onSuccess={setCfToken} onExpire={() => setCfToken(null)} />
              ) : null}
            </>
          )}
          <div>
            <label className={authLabelClass}>AppSumo code</label>
            <input
              className={`${authInputClass} font-mono uppercase tracking-wider`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="SAXXXXXXXXXX"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loggedIn ? "Stack code" : "Sign in & redeem"}
          </Button>
          {loggedIn && (
            <p className="text-center text-xs text-muted-foreground">
              Or manage codes in{" "}
              <Link href="/billing?section=coupon" className="text-accent hover:underline">
                Plans &amp; Billing
              </Link>
            </p>
          )}
        </form>
      )}
    </AuthShell>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <RedeemInner />
    </Suspense>
  );
}
