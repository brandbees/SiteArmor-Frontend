"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { isValidEmail } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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
      // The API deliberately answers the same way whether or not the account exists,
      // so the screen must not hint either — always show the same confirmation.
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />

          <div className="px-8 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <KeyRound size={18} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Forgot your password?</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We&apos;ll email you a link to set a new one
                </p>
              </div>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <MailCheck size={28} className="text-green-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">Check your email</p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  If <span className="font-medium text-foreground">{email}</span> has an account,
                  a reset link is on its way. The link expires in one hour.
                </p>
                <p className="text-[11px] text-muted-foreground text-center mt-1">
                  Nothing arrived? Check your spam folder, or{" "}
                  <button
                    type="button"
                    onClick={() => { setSent(false); setError(null); }}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    try another address
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@agency.com"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full mt-1.5 px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-border text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}