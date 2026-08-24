"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal, RevealScale } from "@/components/marketing/ui/Reveal";
import { SNAPSHOTS } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

const POINTS = [
  {
    title: "Ask in plain English",
    desc: "Query any site — scores, threats, uptime, plugins — and get answers grounded in live data.",
  },
  {
    title: "Confirm before it writes",
    desc: "The agent proposes a fix and waits for your approval. Nothing destructive runs without you.",
  },
  {
    title: "Rollback built in",
    desc: "Every write is preceded by a backup. If a change hurts the score, AI Optimize reverts it.",
  },
];

export function DifferentiatorSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);
  const agent = SNAPSHOTS.agent;

  return (
    <Section tone="default">
      <Container className="max-w-7xl">
        <Reveal>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              02 · Remediate
            </p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-bold leading-[1.1] tracking-tight text-[var(--mkt-fg)] sm:text-4xl lg:text-5xl">
              {c("title", "Your portfolio has a co-pilot.")}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--mkt-muted)]">
              {c(
                "description",
                "Most tools dump recommendations. Site Armor's AI Agent answers in plain English, then remediates with your confirmation — so you know first and fix it before the client calls."
              )}
            </p>
          </div>
        </Reveal>

        <RevealScale delay={0.1}>
          <div className="relative mx-auto max-w-5xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-12 rounded-[3rem] bg-accent/8 blur-3xl"
            />
            <div className="relative overflow-hidden rounded-lg bg-[var(--mkt-surface)] p-3 shadow-elevated-lg ring-1 ring-[var(--mkt-border)]">
              <div className="mb-2.5 flex items-center gap-2 px-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-xs font-medium text-[var(--mkt-muted)]">
                  app.sitearmor · AI Agent
                </span>
              </div>
              <div
                className="relative overflow-hidden rounded-md bg-[var(--mkt-bg-muted)]"
                style={{ aspectRatio: agent.aspect }}
              >
                <Image
                  src={agent.src}
                  alt={agent.alt}
                  fill
                  quality={95}
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="object-contain object-top"
                />
              </div>
            </div>
          </div>
        </RevealScale>

        <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-3">
          {POINTS.map((point, i) => (
            <Reveal key={i} delay={0.06 * i}>
              <div className="text-center">
                <span className="mb-3 inline-block font-mono text-xs font-bold text-accent/50">
                  02.{i + 1}
                </span>
                <h3 className="font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-[var(--mkt-fg)]">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)]">
                  {point.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 text-center">
          <ButtonLink
            href={c("cta_url", "/features/ai-agent")}
            variant="primary"
          >
            {c("cta_label", "Explore the AI Agent")}
            <ArrowRight size={15} />
          </ButtonLink>
        </Reveal>
      </Container>
    </Section>
  );
}
