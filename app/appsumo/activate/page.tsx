"use client";

import { Suspense, useEffect, useState } from "react";
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

type ExchangeResult = {
  license_key: string;
  status: string;
  tier: number;
  plan: string;
  sites_limit: number;
  label: string;
  agency_id: string | null;
  claim_token: string;
};

function ActivateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyEmail, login, refreshAgency } = useAuth();

  const oauthCode = searchParams.get("code") || "";

  const [phase, setPhase] = useState<"loading" | "form" | "verify" | "done" | "error">("loading");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [exchange, setExchange] = useState<ExchangeResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [doneLabel, setDoneLabel] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Portal validation hits this URL with no query — always render OK
      if (!oauthCode) {
        setPhase("form");
        setError("Open this page from AppSumo after clicking Activate now.");
        return;
      }

      try {
        const { data } = await api.post<ExchangeResult>("/appsumo/oauth/exchange", {
          code: oauthCode,
        });
        if (cancelled) return;
        setExchange(data);

        // Already linked → just log them toward dashboard if same session
        if (data.agency_id && isLoggedIn()) {
          await api.post("/appsumo/oauth/claim", { claim_token: data.claim_token }).catch(() => null);
          await refreshAgency();
          setDoneLabel(data.label);
          setPhase("done");
          return;
        }

        if (isLoggedIn()) {
          setMode("login");
        }
        setPhase("form");
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            || "Could not complete AppSumo activation. Try Activate now again from AppSumo."
        );
        setPhase("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [oauthCode, refreshAgency]);

  async function claimAfterAuth() {
    if (!exchange?.claim_token) throw new Error("Missing claim token");
    const { data } = await api.post<{ label: string; plan: string }>(
      "/appsumo/oauth/claim",
      { claim_token: exchange.claim_token }
    );
    await refreshAgency();
    setDoneLabel(data.label || PLAN_LABELS[data.plan] || data.plan);
    setPhase("done");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!exchange?.claim_token) {
      setError("AppSumo session missing. Activate again from AppSumo.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(
        name,
        email,
        password,
        undefined,
        cfToken,
        "agency",
        exchange.claim_token
      );
      if (result.pending) {
        setPendingEmail(result.email);
        setPhase("verify");
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Registration failed."
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
      // License already linked during verify-email when claim token was in payload
      await refreshAgency();
      setDoneLabel(exchange?.label || "");
      setPhase("done");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Invalid verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!isLoggedIn()) {
        await login(email, password, cfToken);
      }
      await claimAfterAuth();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Could not link AppSumo license."
      );
    } finally {
      setLoading(false);
    }
  }

  if (phase === "loading") {
    return (
      <AuthShell variant="register" title="Connecting AppSumo…" subtitle="Hang tight — verifying your license">
        <p className="text-center text-sm text-muted-foreground">Talking to AppSumo…</p>
      </AuthShell>
    );
  }

  if (phase === "done") {
    return (
      <AuthShell variant="register" title="License activated" subtitle="Your AppSumo plan is live">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re on{" "}
            <span className="font-semibold text-foreground">
              {doneLabel || exchange?.label || "your AppSumo plan"}
            </span>
            .
          </p>
          <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (phase === "error") {
    return (
      <AuthShell variant="register" title="Activation failed" subtitle="Try again from AppSumo">
        <p className="mb-4 text-sm text-red-600">{error}</p>
        <Button className="w-full" variant="secondary" onClick={() => router.push("/redeem")}>
          Redeem a code instead
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="register"
      title="Activate AppSumo license"
      subtitle={
        exchange
          ? `Unlocks ${exchange.label} · ${exchange.sites_limit >= 9999 ? "Unlimited" : exchange.sites_limit} sites`
          : "Create or sign in to finish activation"
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@brandbees.io" className="font-semibold text-accent hover:underline">
            support@brandbees.io
          </a>
        </p>
      }
    >
      {exchange && (
        <div className="mb-5 rounded-[4px] border border-border bg-[#f7f9fc] p-3 text-xs text-muted-foreground">
          License{" "}
          <span className="font-mono text-foreground">{exchange.license_key.slice(0, 8)}…</span>
          {" · "}
          Tier {exchange.tier} → {exchange.label}
        </div>
      )}

      {!isLoggedIn() && phase === "form" && (
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
      ) : mode === "signup" && !isLoggedIn() ? (
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
          {CF_SITE_KEY ? (
            <Turnstile siteKey={CF_SITE_KEY} onSuccess={setCfToken} onExpire={() => setCfToken(null)} />
          ) : null}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg" disabled={!exchange}>
            Create account &amp; activate
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLoginClaim} className="space-y-4">
          {!isLoggedIn() && (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg" disabled={!exchange}>
            {isLoggedIn() ? "Link license to this account" : "Sign in & activate"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function AppsumoActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ActivateInner />
    </Suspense>
  );
}
