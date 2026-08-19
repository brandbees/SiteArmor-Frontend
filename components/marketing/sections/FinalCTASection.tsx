"use client";

import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { cmsField } from "@/lib/marketing/cms";

export function FinalCTASection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <Section className="!py-20 sm:!py-28 lg:!py-32">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-bold tracking-tight text-[var(--mkt-fg)] sm:text-4xl lg:text-5xl">
              Start monitoring your sites{" "}
              <span className="text-[var(--mkt-muted)]">in minutes.</span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-[var(--mkt-muted)]">
              {c("description", "Free tier. No credit card. URL-only setup in 30 seconds.")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href={c("cta_url", "/register") as string}
                size="lg"
              >
                {c("cta_label", "Start Free Trial")}
                <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                variant="secondary"
                size="lg"
              >
                View pricing
              </ButtonLink>
            </div>

            <p className="mt-8 text-xs text-[var(--mkt-muted)]">
              Free for 1 site · 14-day trial · No card required · Full white-label
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
