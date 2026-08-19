"use client";

import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { HOME_PROBLEMS } from "@/lib/marketing/home-content";

export function ProblemSection() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow="The agency problem"
            title={
              <>
                <span className="text-[var(--mkt-muted)]">
                  You shouldn&apos;t hear about issues
                </span>{" "}
                <span className="text-[var(--mkt-fg)]">
                  from your clients.
                </span>
              </>
            }
            description="A missed alert doesn't just cost uptime — it costs trust, retainers, and hours you can't bill. Here's what agencies are up against."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {HOME_PROBLEMS.map((beat, i) => (
            <Reveal key={beat.title} delay={0.08 * i}>
              <div className="flex h-full flex-col rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-8">
                <p className="font-[family-name:var(--font-marketing-display)] text-5xl font-bold tracking-tight text-accent sm:text-6xl">
                  {beat.stat}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-[var(--mkt-fg)]">
                  {beat.title}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-[var(--mkt-muted)]">
                  {beat.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
