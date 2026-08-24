"use client";

import Image from "next/image";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { CONNECTION_TIERS } from "@/lib/marketing/features";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

const TIER_SHOTS: SnapshotId[] = ["sites", "plugin", "agent"];

export function HowItWorksSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);

  return (
    <Section id="how-it-works" tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "How it works")}
            title={c("title", "Start shallow. Go deep when you're ready.")}
            description={c(
              "description",
              "Three connection tiers. Nothing is gated behind a demo call — tier 1 works in 30 seconds."
            )}
          />
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {CONNECTION_TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const shot = SNAPSHOTS[TIER_SHOTS[i]];
            return (
              <Reveal key={tier.step} delay={0.08 * i}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                  <div className="relative h-[170px] w-full overflow-hidden bg-[var(--mkt-bg-muted)]">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-contain object-top"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-elevated-sm">
                        <Icon size={16} />
                      </span>
                      <span className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold text-[var(--mkt-border-strong)]">
                        {tier.step}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {tier.time}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold text-[var(--mkt-fg)]">
                      {tier.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)]">
                      {tier.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
