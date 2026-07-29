"use client";

import { Check } from "lucide-react";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { cmsField } from "@/lib/marketing/cms";

const POINTS = [
  "Agency logo, favicon, colours, and display name",
  "AI-written PDF with plain-English narrative",
  "Scheduled weekly or monthly email delivery",
  "Tokenized client portal — no login friction",
];

export function WhiteLabelSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-lg">
              <div className="border-b border-[var(--mkt-border)] bg-gradient-brand px-6 py-8 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Monthly site report
                </p>
                <p className="mt-2 font-[family-name:var(--font-marketing-display)] text-2xl font-semibold">
                  Your Agency Name
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Prepared for Acme Corp · June 2026
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-[var(--mkt-muted)]">Overall health</p>
                    <p className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold text-[var(--mkt-fg)]">
                      87
                    </p>
                  </div>
                  <p className="mb-1 text-sm font-semibold text-[var(--score-good)]">
                    +9 vs last month
                  </p>
                </div>
                <p className="rounded-xl bg-[var(--mkt-bg-muted)] p-4 text-sm leading-relaxed text-[var(--mkt-muted)]">
                  &ldquo;Performance improved after deferring render-blocking scripts from
                  the slider plugin. Security hardening closed the XML-RPC exposure.
                  No malware detected.&rdquo;
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Performance", "89"],
                    ["SEO", "92"],
                    ["Security", "81"],
                  ].map(([label, score]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-[var(--mkt-bg-muted)] px-3 py-3 text-center"
                    >
                      <p className="text-lg font-bold text-[var(--mkt-fg)]">{score}</p>
                      <p className="text-[10px] text-[var(--mkt-muted)]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {c("eyebrow", "White-label reporting")}
            </p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
              {c("title", "Reports that look like you wrote them.")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
              {c(
                "description",
                "AI drafts the narrative. Your brand owns the cover. SnapshotAI stays invisible to the end client — exactly how agencies want it."
              )}
            </p>
            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-[var(--mkt-fg)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <ButtonLink href="/features/client-reports" className="mt-8" variant="secondary">
              See client reports
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
