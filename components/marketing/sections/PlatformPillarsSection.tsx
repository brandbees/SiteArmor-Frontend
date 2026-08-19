"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal, RevealSlide } from "@/components/marketing/ui/Reveal";
import { HOME_PILLARS } from "@/lib/marketing/home-content";
import { cmsField } from "@/lib/marketing/cms";

export function PlatformPillarsSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section id="platform">
      <Container className="max-w-7xl">
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow={c("eyebrow", "How Site Armor works")}
            title={
              <>
                <span className="text-[var(--mkt-muted)]">
                  Four layers between chaos and{" "}
                </span>
                <span className="text-[var(--mkt-fg)]">a calm portfolio.</span>
              </>
            }
            description={c(
              "description",
              "Monitor every site, fix with confirmation, prove the retainer, and scale without adding headcount."
            )}
          />
        </Reveal>

        <div className="mt-16 space-y-10">
          {HOME_PILLARS.map((pillar, i) => {
            const isEven = i % 2 === 0;
            return (
              <RevealSlide key={pillar.num} from={isEven ? "left" : "right"} delay={0.06 * i}>
                <article className="overflow-hidden rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-elevated-sm transition-shadow duration-300 hover:shadow-elevated-md">
                  <div
                    className={`grid gap-0 lg:grid-cols-2 ${
                      isEven ? "" : "lg:[direction:rtl]"
                    }`}
                  >
                    <div
                      className={`flex flex-col justify-center border-b border-[var(--mkt-border)] p-10 sm:p-12 lg:border-b-0 ${
                        isEven
                          ? "lg:border-r"
                          : "lg:border-l lg:[direction:ltr]"
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                        {pillar.num} · {pillar.label}
                      </p>

                      <h3 className="mt-5 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
                        {pillar.title}
                      </h3>

                      <div className="mt-8 inline-flex flex-col rounded-lg bg-[var(--mkt-bg-muted)] px-5 py-4">
                        <span className="font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-accent">
                          {pillar.stat}
                        </span>
                        <span className="mt-0.5 text-sm text-[var(--mkt-muted)]">
                          {pillar.statDetail}
                        </span>
                      </div>
                    </div>

                    <ul
                      className={`flex flex-col justify-center gap-6 p-10 sm:p-12 ${
                        isEven ? "" : "lg:[direction:ltr]"
                      }`}
                    >
                      {pillar.bullets.map((bullet, j) => (
                        <li key={j} className="flex gap-5">
                          <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-accent/60">
                            {pillar.num}.{j + 1}
                          </span>
                          <span className="text-base leading-relaxed text-[var(--mkt-fg)]">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </RevealSlide>
            );
          })}
        </div>

        <Reveal delay={0.2} className="mt-14 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-base font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Explore all 14 capabilities
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}
