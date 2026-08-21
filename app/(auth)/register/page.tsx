"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Circle, ArrowLeft, RefreshCw, Wand2, Building2, User } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth/AuthShell";
import { cn, isValidEmail } from "@/lib/utils";

type AccountType = "agency" | "individual";

const CF_SITE_KEY = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY ?? "";

// ── Password generator ────────────────────────────────────────────────────────

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

function generateStrongPassword(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => CHARSET[b % CHARSET.length]).join('');
}

// ── Password strength ─────────────────────────────────────────────────────────

const RULES = [
  { label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",          test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",          test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",                    test: (p: string) => /\d/.test(p) },
  { label: "One special character (!@#…)",  test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

function getStrength(password: string) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: "Too weak",  color: "#ef4444" };
  if (passed === 2) return { level: 1, label: "Weak",     color: "#f97316" };
  if (passed === 3) return { level: 2, label: "Fair",     color: "#eab308" };
  if (passed === 4) return { level: 3, label: "Strong",   color: "#22c55e" };
  return             { level: 4, label: "Very strong", color: "#16a34a" };
}

// ── Shared input class ────────────────────────────────────────────────────────

const inputCls = authInputClass;

// ── Phase 0 — Account type selection ─────────────────────────────────────────

function TypeSelectionStep({ onSelect }: { onSelect: (type: AccountType) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-muted-foreground">
        Choose the option that best describes you
      </p>
      <button
        type="button"
        onClick={() => onSelect("agency")}
        className="group flex w-full items-start gap-3.5 rounded-[4px] border border-border bg-[#f7f9fc] p-4 text-left transition-all hover:border-accent hover:bg-accent-light/40"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-accent-light text-accent transition-colors group-hover:bg-white">
          <Building2 size={16} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Agency / Freelancer</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            You manage websites for multiple clients and need reporting, team access, and client
            portals.
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect("individual")}
        className="group flex w-full items-start gap-3.5 rounded-[4px] border border-border bg-[#f7f9fc] p-4 text-left transition-all hover:border-accent hover:bg-accent-light/40"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-accent-light text-accent transition-colors group-hover:bg-white">
          <User size={16} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Individual / Business Owner</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            You own or manage your own website and want simple monitoring, audits, and fix
            recommendations.
          </p>
        </div>
      </button>
    </div>
  );
}

// ── Phase 1 — Registration form ───────────────────────────────────────────────

interface Phase1Props {
  onSuccess: (email: string) => void;
  accountType: AccountType;
  onBack: () => void;
}

function RegistrationForm({ onSuccess, accountType, onBack }: Phase1Props) {
  const { register } = useAuth();
  const [agencyName, setAgencyName]   = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [generated, setGenerated]       = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [cfToken, setCfToken]         = useState<string | null>(null);

  const strength = getStrength(password);

  function validateEmail(v: string) {
    if (v && !isValidEmail(v)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(agencyName, email, password, undefined, cfToken, accountType);
      if (result.pending) onSuccess(result.email);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[4px] p-1 text-muted-foreground transition-colors hover:bg-[#f0f2f5] hover:text-foreground"
        >
          <ArrowLeft size={14} />
        </button>
        <span
          className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-semibold ${
            accountType === "agency"
              ? "bg-accent-light text-accent"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {accountType === "agency" ? <Building2 size={11} /> : <User size={11} />}
          {accountType === "agency" ? "Agency / Freelancer" : "Individual / Business Owner"}
        </span>
      </div>

      <div>
        <label className={authLabelClass}>
          {accountType === "agency" ? "Agency / business name" : "Your name or business name"}
        </label>
        <input
          type="text"
          required
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          className={inputCls}
          placeholder={accountType === "agency" ? "Acme Digital Agency" : "My Business"}
        />
      </div>

      <div>
        <label className={authLabelClass}>Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validateEmail(e.target.value);
          }}
          onBlur={(e) => validateEmail(e.target.value)}
          className={cn(inputCls, emailError && "border-red-400")}
          placeholder="you@agency.com"
        />
        {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[12px] font-semibold text-foreground">Password</label>
          <button
            type="button"
            onClick={() => {
              const pwd = generateStrongPassword();
              setPassword(pwd);
              setShowPassword(true);
              setShowStrength(true);
              setGenerated(true);
              setTimeout(() => setGenerated(false), 2000);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <Wand2 size={11} />
            {generated ? "Generated" : "Generate"}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setShowStrength(true);
            }}
            className={cn(inputCls, "pr-10")}
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

        {showStrength && password.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-[2px] transition-all duration-300"
                  style={{
                    background: i <= strength.level ? strength.color : "#e2e8f0",
                  }}
                />
              ))}
            </div>
            <p className="text-xs font-medium" style={{ color: strength.color }}>
              {strength.label}
            </p>
            <div className="space-y-1">
              {RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                    {ok ? (
                      <CheckCircle2 size={11} className="shrink-0 text-green-500" />
                    ) : (
                      <Circle size={11} className="shrink-0 text-muted-foreground" />
                    )}
                    <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-[4px] border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
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
        Continue
      </Button>
    </form>
  );
}

// ── Phase 2 — OTP verification ────────────────────────────────────────────────

interface Phase2Props {
  email: string;
  onBack: () => void;
}

function VerifyEmailForm({ email, onBack }: Phase2Props) {
  const router = useRouter();
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode]             = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending]   = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyEmail(email, code.trim());
      router.replace("/onboarding");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Verification failed. Please check your code and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendCode(email);
      setResendCooldown(60);
      setError("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Could not resend code. Please try again.";
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-foreground">{email}</span>.
          Enter it below to activate your account.
        </p>
      </div>

      <div>
        <label className={authLabelClass}>Verification code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={cn(inputCls, "py-4 text-center text-2xl font-bold tracking-[0.5em]")}
          placeholder="000000"
          autoFocus
        />
      </div>

      {error && (
        <div className="rounded-[4px] border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Verify &amp; create account
      </Button>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={12} /> Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={11} className={resending ? "animate-spin" : ""} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [phase, setPhase]               = useState<"type" | "form" | "verify">("type");
  const [accountType, setAccountType]   = useState<AccountType>("agency");
  const [pendingEmail, setPending]      = useState("");

  useEffect(() => {
    import("@/lib/auth").then(({ isLoggedIn }) => {
      if (isLoggedIn()) router.replace("/dashboard");
    });
  }, [router]);

  const headings = {
    type: {
      title: "Create your account",
      sub: "Tell us a bit about how you'll use Site Armor",
    },
    form: {
      title: "Create your account",
      sub:
        accountType === "agency"
          ? "Start monitoring your clients' WordPress sites"
          : "Start monitoring your WordPress site",
    },
    verify: {
      title: "Check your email",
      sub: "Enter the code we emailed you",
    },
  };

  return (
    <AuthShell
      variant="register"
      title={headings[phase].title}
      subtitle={headings[phase].sub}
      footer={
        phase !== "verify" ? (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        ) : null
      }
    >
      {phase === "type" && (
        <TypeSelectionStep
          onSelect={(type) => {
            setAccountType(type);
            setPhase("form");
          }}
        />
      )}
      {phase === "form" && (
        <RegistrationForm
          accountType={accountType}
          onBack={() => setPhase("type")}
          onSuccess={(email) => {
            setPending(email);
            setPhase("verify");
          }}
        />
      )}
      {phase === "verify" && (
        <VerifyEmailForm email={pendingEmail} onBack={() => setPhase("form")} />
      )}
    </AuthShell>
  );
}
