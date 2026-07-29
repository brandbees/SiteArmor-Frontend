"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { SiteHealthMockup } from "@/components/marketing/mockups/SiteHealthMockup";
import { cmsField } from "@/lib/marketing/cms";

export function HeroSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      {/* Atmospheric plane */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% -10%, rgb(var(--accent-rgb) / 0.18), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 20%, rgb(var(--accent-rgb) / 0.08), transparent 50%),
            linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 72%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231f5fb8' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Container className="pb-16 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <Reveal>
              <p className="mb-5 font-[family-name:var(--font-marketing-display)] text-sm font-semibold tracking-wide text-accent sm:text-base">
                {c("brand_line", "SnapshotAI by BrandBees")}
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="max-w-xl font-[family-name:var(--font-marketing-display)] text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.35rem]">
                {c(
                  "heading",
                  "Know first. Fix it. Prove the retainer."
                )}
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

          <Reveal delay={0.14} y={24} className="lg:pl-2">
            <SiteHealthMockup />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
