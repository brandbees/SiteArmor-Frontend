"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import {
  PLANS,
  formatPlanPrice,
  type BillingPeriod,
} from "@/lib/marketing/pricing";
import { cmsField } from "@/lib/marketing/cms";
import { cn } from "@/lib/utils";

export function PricingPreviewSection({
  cms = {},
  showAllFeatures = false,
}: {
  cms?: Record<string, string>;
  showAllFeatures?: boolean;
}) {
  const c = cmsField(cms);
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <Section id="pricing" tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "Pricing")}
            title={c("title", "Four tiers. Real limits. No surprises.")}
            description={c(
              "description",
              "All paid plans include a 14-day trial — no card required at signup."
            )}
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mb-10 flex justify-center">
            <div className="inline-flex rounded-xl bg-[var(--mkt-surface)] p-1 shadow-elevated-xs">
              {(["monthly", "annual"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all",
                    period === p
                      ? "bg-accent text-white shadow-elevated-xs"
                      : "text-[var(--mkt-muted)] hover:text-[var(--mkt-fg)]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, i) => {
            const price = formatPlanPrice(plan.code, period);
            return (
              <Reveal key={plan.code} delay={0.05 * i}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl bg-[var(--mkt-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5",
                    plan.highlight
                      ? "shadow-elevated-md ring-1 ring-accent/30"
                      : "shadow-elevated-xs hover:shadow-elevated-md"
                  )}
                >
                  {plan.badge ? (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {plan.badge}
                    </span>
                  ) : null}

                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-[var(--mkt-fg)]">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--mkt-muted)]">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)]">
                        {price.display}
                      </span>
                      {plan.code !== "free" && price.announced ? (
                        <span className="text-sm text-[var(--mkt-muted)]">
                          /{period === "monthly" ? "mo" : "mo, billed annually"}
                        </span>
                      ) : null}
                    </div>
                    {!price.announced ? (
                      <p className="mt-1 text-xs text-[var(--mkt-muted)]">
                        Pricing announced soon
                      </p>
                    ) : plan.code === "free" ? (
                      <p className="mt-1 text-xs text-[var(--mkt-muted)]">
                        Forever free · 1 site
                      </p>
                    ) : null}
                  </div>

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {(showAllFeatures
                      ? plan.features
                      : plan.features.slice(0, 5)
                    ).map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-[var(--mkt-fg)]"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-accent"
                          strokeWidth={2.5}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href={plan.ctaHref}
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </ButtonLink>
                </div>
              </Reveal>
            );
          })}
        </div>

        {!showAllFeatures ? (
          <Reveal delay={0.15}>
            <div className="mt-10 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
              >
                Full pricing & feature comparison
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        ) : null}
      </Container>
    </Section>
  );
}
