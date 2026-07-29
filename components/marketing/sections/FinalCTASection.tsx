"use client";

import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { cmsField } from "@/lib/marketing/cms";

export function FinalCTASection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <Section className="!py-16 sm:!py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-brand px-6 py-14 text-center shadow-elevated-lg sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 35%)",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {c(
                  "title",
                  "Add your first site in 30 seconds."
                )}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/75">
                {c(
                  "description",
                  "Start free. No card required. Deeper access when you're ready."
                )}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  href={c("cta_url", "/register")}
                  variant="inverse"
                  size="lg"
                >
                  {c("cta_label", "Start Free — No Card Needed")}
                  <ArrowRight size={16} />
                </ButtonLink>
                <ButtonLink
                  href="/pricing"
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10"
                >
                  View pricing
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
