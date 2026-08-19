"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { HOME_FEATURE_GRID } from "@/lib/marketing/features";
import { cmsField } from "@/lib/marketing/cms";

export function FeatureGridSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section id="features" tone="muted">
      <Container className="max-w-7xl">
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow={c("eyebrow", "Capabilities")}
            title={
              <>
                <span className="text-[var(--mkt-fg)]">
                  Everything your agency needs.{" "}
                </span>
                <span className="text-[var(--mkt-muted)]">
                  Nothing it doesn&apos;t.
                </span>
              </>
            }
            description={c(
              "description",
              "Fourteen capabilities that map to how you actually run WordPress maintenance — each with its own deep dive."
            )}
          />
        </Reveal>

        <div className="mt-14 space-y-4">
          {HOME_FEATURE_GRID.map((feature, i) => {
            const Icon = feature.icon;
            const num = String(i + 1).padStart(2, "0");
            return (
              <Reveal key={feature.slug} delay={Math.min(i * 0.03, 0.24)}>
                <Link
                  href={feature.href}
                  className="group flex items-center gap-6 rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] px-8 py-6 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md sm:gap-8 sm:px-10 sm:py-8"
                >
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-accent/50">
                    {num}
                  </span>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[var(--mkt-fg)] sm:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--mkt-muted)] sm:text-base">
                      {feature.description}
                    </p>
                  </div>

                  <span className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                    Explore
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
