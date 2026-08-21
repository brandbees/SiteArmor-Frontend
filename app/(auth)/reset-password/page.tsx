"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth/AuthShell";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("No reset token found. Please use the link from your email.");
  }, [token]);

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength] ?? "";
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][strength] ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password reset! Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Failed to reset password. The link may have expired.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="reset"
      title="Reset your password"
      subtitle="Choose a new password for your account."
      footer={
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-bold text-accent hover:underline">
            Back to login
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-[4px] border border-border bg-[#f7f9fc] px-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-[var(--score-good-bg)]">
            <CheckCircle size={22} className="text-[var(--score-good)]" />
          </div>
          <p className="text-sm font-bold text-foreground">Password updated!</p>
          <p className="text-xs text-muted-foreground">Redirecting you to login…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[4px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className={authLabelClass}>New password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className={cn(authInputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] p-1 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-[2px] transition-all"
                      style={{ background: i <= strength ? strengthColor : "#e5e7eb" }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium" style={{ color: strengthColor }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className={authLabelClass}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
              className={authInputClass}
            />
            {confirm && password !== confirm && (
              <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
            )}
          </div>

          <Button type="submit" loading={loading} disabled={!token} className="w-full" size="lg">
            {loading ? "Resetting…" : "Set new password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-80 w-full max-w-sm animate-pulse rounded-[4px] border border-border bg-[#f7f9fc]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
