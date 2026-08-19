"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";

const BARS = [
  { name: "Site Armor", pct: 100, tone: "bg-gradient-brand", note: "Detected" },
  { name: "Typical scanner", pct: 63, tone: "bg-[#6b7a96]", note: "Detected" },
  { name: "Legacy firewall", pct: 39, tone: "bg-[#8b5cf6]", note: "Detected" },
  { name: "Host scan", pct: 8, tone: "bg-[#f97316]", note: "Detected" },
] as const;

const POINTS = [
  {
    num: "1.1",
    title: "Behavioral, not signature-only",
    desc: "New malware appears fast. Site Armor judges code behavior, not just known signatures.",
  },
  {
    num: "1.2",
    title: "False-positive resistant",
    desc: "Reduce alert noise so your team fixes real incidents first, without burn hours.",
  },
  {
    num: "1.3",
    title: "Zero load on client sites",
    desc: "Deep analysis happens off-site, keeping monitored WordPress installs fast.",
  },
] as const;

function AnimatedBar({ pct, tone, delay }: { pct: number; tone: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div
      ref={ref}
      className="relative mx-auto h-56 w-full max-w-[88px] overflow-hidden rounded-md bg-[var(--mkt-bg-muted)]"
    >
      <motion.div
        className={`absolute bottom-0 left-0 right-0 rounded-t-xl ${tone}`}
        initial={{ height: 0 }}
        animate={isInView ? { height: `${pct}%` } : { height: 0 }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function SecurityEdgeSection() {
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow="Why this works"
            title={
              <>
                <span className="text-[var(--mkt-muted)]">Detection that is </span>
                <span>fast, specific, and actionable.</span>
              </>
            }
            description="Not just 'you have malware' — exact context your team can act on."
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 shadow-elevated-xs">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
                Higher is better
              </p>
              <div className="grid grid-cols-4 gap-3">
                {BARS.map((bar, i) => (
                  <div key={bar.name} className="text-center">
                    <AnimatedBar pct={bar.pct} tone={bar.tone} delay={0.15 * i} />
                    <p className="mt-2 text-[11px] font-semibold text-[var(--mkt-fg)]">{bar.name}</p>
                    <p className="text-xs text-[var(--mkt-muted)]">{bar.pct}% {bar.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 shadow-elevated-xs">
              <ul className="divide-y divide-[var(--mkt-border)]">
                {POINTS.map((p) => (
                  <li key={p.num} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-xs font-bold text-accent">{p.num}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--mkt-fg)]">{p.title}</h3>
                        <p className="mt-1 text-base leading-relaxed text-[var(--mkt-muted)]">{p.desc}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
