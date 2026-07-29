"use client";

import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { PILLARS } from "@/lib/marketing/features";
import { cmsField } from "@/lib/marketing/cms";

export function PillarsSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "Five pillars · one score")}
            title={c("title", "Portfolio health, scored the way agencies think.")}
            description={c(
              "description",
              "Every site gets an overall health score (0–100) — a weighted composite of Performance, SEO, Security, Malware, and Uptime. Pillars without data are excluded, not zeroed."
            )}
          />
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.key} delay={0.05 * i}>
                <div className="group relative h-full overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent">
                      <Icon size={16} />
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--mkt-muted)]">
                      {pillar.weight}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--mkt-fg)]">
                    {pillar.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--mkt-muted)]">
                    {pillar.desc}
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
