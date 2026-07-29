"use client";

import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { CONNECTION_TIERS } from "@/lib/marketing/features";
import { cmsField } from "@/lib/marketing/cms";

export function HowItWorksSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section id="how-it-works" tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "How it works")}
            title={c("title", "Start shallow. Go deep when you're ready.")}
            description={c(
              "description",
              "Three connection tiers. Nothing is gated behind a demo call — tier 1 works in 30 seconds."
            )}
          />
        </Reveal>

        <div className="relative grid gap-4 lg:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[var(--mkt-border)] to-transparent lg:block"
          />
          {CONNECTION_TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <Reveal key={tier.step} delay={0.08 * i}>
                <div className="relative h-full rounded-2xl bg-[var(--mkt-surface)] p-6 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-elevated-sm">
                      <Icon size={18} />
                    </span>
                    <span className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[var(--mkt-border-strong)]">
                      {tier.step}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                    {tier.time}
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold text-[var(--mkt-fg)]">
                    {tier.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)]">
                    {tier.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
