"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <Section id="features">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "Capabilities")}
            title={c("title", "Everything an agency ops stack needs — in one place.")}
            description={c(
              "description",
              "Fourteen capabilities that map to how you actually run WordPress maintenance — each with its own deep dive."
            )}
          />
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HOME_FEATURE_GRID.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.slug} delay={Math.min(i * 0.03, 0.3)}>
                <Link
                  href={feature.href}
                  className="group flex h-full flex-col rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-white">
                      <Icon size={16} />
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="text-[var(--mkt-muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-accent"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--mkt-fg)]">
                    {feature.shortTitle}
                  </h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--mkt-muted)]">
                    {feature.description}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
