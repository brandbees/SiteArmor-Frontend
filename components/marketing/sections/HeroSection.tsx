"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container } from "@/components/marketing/ui/Section";
import { Reveal, RevealScale } from "@/components/marketing/ui/Reveal";
import { SnapshotGif } from "@/components/marketing/SnapshotGif";
import { HERO_FEATURES } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

export function HeroSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <section className="relative overflow-hidden bg-[var(--mkt-bg)] pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)",
        }}
      />
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <h1 className="font-[family-name:var(--font-marketing-display)] text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              <span className="text-[var(--mkt-muted)]">
                {c("heading_muted", "Your client sites,")}
              </span>{" "}
              <span className="text-[var(--mkt-fg)]">
                {c("heading_bold", "always under control.")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-[var(--mkt-muted)]">
              {c(
                "subtitle",
                "Complete WordPress monitoring for agencies — five health pillars, an AI agent that remediates with confirmation, and white-label reports that prove the retainer."
              )}
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-10 flex justify-center">
              <ButtonLink
                href={c("cta_url", "/register")}
                size="lg"
              >
                {c("cta_label", "Protect My Sites For Free")}
                <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-5 text-sm text-[var(--mkt-muted)]">
              {c(
                "trust_line",
                "Free for 1 site · 14-day trial · URL-only setup in 30 seconds"
              )}
            </p>
          </Reveal>
        </div>

        <RevealScale delay={0.15} className="mx-auto mt-14 max-w-5xl lg:mt-16">
          <SnapshotGif
            ids={HERO_FEATURES}
            intervalMs={3800}
            priority
            showLabels
          />
        </RevealScale>
      </Container>
    </section>
  );
}
