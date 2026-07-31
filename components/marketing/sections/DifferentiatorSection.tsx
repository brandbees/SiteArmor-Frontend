"use client";

import Image from "next/image";
import { ArrowRight, Bot, Check } from "lucide-react";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { Container, Section } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { SNAPSHOTS } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

const POINTS = [
  "Ask about any site — scores, threats, uptime, plugins",
  "Agent proposes a fix; you confirm before it writes",
  "Grounded in live audit & scan data — not generic chat",
];

/**
 * AI Agent highlight — the differentiator, not a generic screenshot reel.
 */
export function DifferentiatorSection({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);
  const agent = SNAPSHOTS.agent;

  return (
    <Section tone="accent-wash" className="overflow-hidden">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
              <Bot size={13} />
              AI Agent
            </div>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
              {c(
                "title",
                "Your portfolio has a co-pilot."
              )}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
              {c(
                "description",
                "Most tools dump recommendations. SnapshotAI’s AI Agent answers in plain English, then remediates with your confirmation — so you know first and fix it before the client calls."
              )}
            </p>

            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-[var(--mkt-fg)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <ButtonLink
              href={c("cta_url", "/features/ai-agent")}
              className="mt-8"
              variant="primary"
            >
              {c("cta_label", "Explore the AI Agent")}
              <ArrowRight size={15} />
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.1} y={20}>
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-accent/15 blur-3xl"
              />
              <div className="relative overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-2.5 shadow-elevated-lg ring-1 ring-[var(--mkt-border)]">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                  <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                  <span className="ml-1.5 text-[10px] font-medium text-[var(--mkt-muted)]">
                    app.snapshotai · AI Agent
                  </span>
                </div>
                <div
                  className="relative overflow-hidden rounded-xl bg-[var(--mkt-bg-muted)]"
                  style={{ aspectRatio: agent.aspect }}
                >
                  <Image
                    src={agent.src}
                    alt={agent.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
