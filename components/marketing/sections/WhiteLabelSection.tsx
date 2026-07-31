"use client";

import { Check } from "lucide-react";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import { SNAPSHOTS } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

const POINTS = [
  "Agency logo, favicon, colours, and display name",
  "AI-written PDF with plain-English narrative",
  "Scheduled weekly or monthly email delivery",
  "Tokenized client portal — no login friction",
];

export function WhiteLabelSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
              <ProductFrame
              snapshot={SNAPSHOTS.reports}
              size="lg"
              showCaption
            />
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {c("eyebrow", "White-label reporting")}
            </p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
              {c("title", "Reports that look like you wrote them.")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
              {c(
                "description",
                "AI drafts the narrative. Your brand owns the cover. SnapshotAI stays invisible to the end client — exactly how agencies want it."
              )}
            </p>
            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-[var(--mkt-fg)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <ButtonLink
              href="/features/client-reports"
              className="mt-8"
              variant="secondary"
            >
              See client reports
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
