"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="forgot"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a secure reset link."
      footer={
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-[4px] border border-border bg-[#f7f9fc] px-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-[var(--score-good-bg)]">
            <MailCheck size={22} className="text-[var(--score-good)]" />
          </div>
          <p className="text-sm font-bold text-foreground">Check your email</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            If <span className="font-semibold text-foreground">{email}</span> has an account, a
            reset link is on its way. The link expires in one hour.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Nothing arrived? Check spam, or{" "}
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
              className="font-bold text-accent hover:underline"
            >
              try another address
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[4px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className={authLabelClass}>Email address</label>
            <div className="relative">
              <KeyRound
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
                autoFocus
                required
                className={`${authInputClass} pl-10`}
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
