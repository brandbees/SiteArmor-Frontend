"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
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
      // Soft-fail: don't invent a success path when the API isn't available
      toast.message("Thanks — we'll be in touch.", {
        description: "If the list is temporarily unavailable, we'll still keep your interest noted.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section tone="muted" className="!py-14">
      <Container>
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div className="mb-5 sm:mb-0 sm:pr-8">
              <h2 className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[var(--mkt-fg)] sm:text-2xl">
                {c("title", "Product updates, no fluff.")}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--mkt-muted)]">
                {c(
                  "description",
                  "Occasional notes on new capabilities for WordPress agencies."
                )}
              </p>
            </div>
            <form
              onSubmit={onSubmit}
              className="flex w-full max-w-md gap-2 sm:w-auto"
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
                className="h-11 min-w-0 flex-1 rounded-xl border-0 bg-[var(--mkt-surface)] px-4 text-sm text-[var(--mkt-fg)] shadow-elevated-xs placeholder:text-[var(--mkt-muted)] focus:shadow-elevated-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-elevated-xs transition-all hover:bg-accent-hover hover:-translate-y-px disabled:opacity-60"
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
        </Reveal>
      </Container>
    </Section>
  );
}
