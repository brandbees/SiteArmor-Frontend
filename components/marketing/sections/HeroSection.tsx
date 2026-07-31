"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { SnapshotGif } from "@/components/marketing/SnapshotGif";
import { HERO_FEATURES } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

export function HeroSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% -10%, rgb(var(--accent-rgb) / 0.16), transparent 55%),
            radial-gradient(ellipse 45% 35% at 100% 30%, rgb(var(--accent-rgb) / 0.08), transparent 50%),
            linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 75%)
          `,
        }}
      />

      <Container className="pb-16 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div>
            <Reveal>
              <p className="mb-5 font-[family-name:var(--font-marketing-display)] text-sm font-semibold tracking-wide text-accent sm:text-base">
                {c("brand_line", "SnapshotAI by BrandBees")}
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="max-w-xl font-[family-name:var(--font-marketing-display)] text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.25rem]">
                {c("heading", "Know first. Fix it. Prove the retainer.")}
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
                {c(
                  "subtitle",
                  "For agencies managing 5 to 500 client WordPress sites — continuous audits across five pillars, an AI agent that remediates with confirmation, and white-label reports that show the work."
                )}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href={c("cta_url", "/register")} size="lg">
                  {c("cta_label", "Start Free — No Card Needed")}
                  <ArrowRight size={16} />
                </ButtonLink>
                <ButtonLink
                  href={c("cta2_url", "/how-it-works")}
                  variant="secondary"
                  size="lg"
                >
                  {c("cta2_label", "See How It Works")}
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-6 text-sm text-[var(--mkt-muted)]">
                {c(
                  "trust_line",
                  "URL-only setup in 30 seconds. Plugin and SSH when you want deeper access."
                )}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={24}>
            <SnapshotGif
              ids={HERO_FEATURES}
              intervalMs={3800}
              priority
              showLabels
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
