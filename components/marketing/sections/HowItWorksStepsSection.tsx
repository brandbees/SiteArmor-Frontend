"use client";

import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";

const STEPS = [
  {
    num: "01",
    title: "Paste a URL",
    desc: "No plugin required. External scanning — performance, SEO, uptime, SSL — starts within seconds.",
  },
  {
    num: "02",
    title: "Get your first audit",
    desc: "Five health pillars scored, issues ranked by impact. You see exactly what needs attention.",
  },
  {
    num: "03",
    title: "Connect the plugin",
    desc: "Optional, two-minute install. Unlocks inside-the-site data — malware, plugin versions, database.",
  },
  {
    num: "04",
    title: "Let the AI agent work",
    desc: "Ask questions in English. Confirm proposed fixes. Rollback is automatic if a change hurts the score.",
  },
  {
    num: "05",
    title: "Send white-label reports",
    desc: "AI-written narratives, your brand. Clients see progress — you prove the retainer every month.",
  },
];

export function HowItWorksStepsSection() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow="Getting started"
            title={
              <>
                <span className="text-[var(--mkt-fg)]">Five steps. </span>
                <span className="text-[var(--mkt-muted)]">
                  Under five minutes.
                </span>
              </>
            }
            description="From URL to full portfolio monitoring — no security expertise required."
          />
        </Reveal>

        <div className="mx-auto max-w-3xl">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={0.06 * i}>
              <div className="group relative flex gap-6 pb-10 last:pb-0">
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-[19px] top-11 h-[calc(100%-2.75rem)] w-px bg-[var(--mkt-border)]"
                  />
                )}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white shadow-elevated-sm">
                  {step.num}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[var(--mkt-fg)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--mkt-muted)]">
                    {step.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
