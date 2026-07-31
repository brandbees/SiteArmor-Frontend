"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cmsField } from "@/lib/marketing/cms";
import { API_BASE_URL } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";

export function NewsletterSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const base = API_BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      toast.success("You're on the list.");
      setEmail("");
    } catch {
      toast.message("Thanks — we'll be in touch.", {
        description:
          "If the list is temporarily unavailable, we'll still keep your interest noted.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section className="!pt-6 sm:!pt-8 !pb-16 sm:!pb-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-surface)] px-6 py-8 shadow-elevated-sm sm:px-10 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent">
                <Mail size={18} strokeWidth={2} />
              </span>
              <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-3xl">
                {c("title", "Product updates, no fluff.")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--mkt-muted)] sm:text-[15px]">
                {c(
                  "description",
                  "Occasional notes on new capabilities for WordPress agencies."
                )}
              </p>
              <form
                onSubmit={onSubmit}
                className="mt-7 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch"
              >
                <label htmlFor="mkt-newsletter" className="sr-only">
                  Email
                </label>
                <input
                  id="mkt-newsletter"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-bg)] px-4 text-sm text-[var(--mkt-fg)] outline-none transition-shadow placeholder:text-[var(--mkt-muted)] focus:border-accent focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.2)]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-elevated-xs transition-all hover:-translate-y-px hover:bg-accent-hover disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
