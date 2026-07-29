"use client";

import { ArrowRight, RotateCcw, Search, Wrench, LineChart } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cmsField } from "@/lib/marketing/cms";

const STEPS = [
  {
    icon: Search,
    label: "Measure",
    detail: "Pull a real PageSpeed Insights report and run a causal diagnostic — which plugin, which asset, which route.",
  },
  {
    icon: Wrench,
    label: "Fix",
    detail: "Configure the site's existing cache plugin. Deploy critical CSS, JS delay, LCP preload, caching — after a backup.",
  },
  {
    icon: LineChart,
    label: "Verify",
    detail: "Re-measure. If the score improved, keep it. If it regressed or broke the site, undo automatically.",
  },
  {
    icon: RotateCcw,
    label: "Remember",
    detail: "Per-site memory of what didn't work — so the same broken fix is never retried on that site.",
  },
];

export function DifferentiatorSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section tone="accent-wash" className="overflow-hidden">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <Reveal>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {c("eyebrow", "The differentiator")}
            </p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
              {c(
                "title",
                "It doesn't just find problems. It fixes them."
              )}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
              {c(
                "description",
                "Most tools give you a list of recommendations. SnapshotAI applies them, measures the result, and rolls back if they don't help — with confirmation before every write."
              )}
            </p>
            <ButtonLink
              href={c("cta_url", "/features/ai-optimization")}
              className="mt-8"
              variant="primary"
            >
              {c("cta_label", "Explore AI Optimize")}
              <ArrowRight size={15} />
            </ButtonLink>
          </Reveal>

          <div className="relative">
            <div className="grid gap-3 sm:grid-cols-2">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.label} delay={0.07 * i}>
                    <div className="group h-full rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow-elevated-xs">
                          <Icon size={15} />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mkt-muted)]">
                            Step {i + 1}
                          </p>
                          <h3 className="text-sm font-semibold text-[var(--mkt-fg)]">
                            {step.label}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--mkt-muted)]">
                        {step.detail}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
