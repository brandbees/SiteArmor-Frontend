"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { CountUp } from "@/components/marketing/ui/Reveal";

const FACTS = [
  { value: 5, suffix: "", label: "Health pillars", detail: "Performance · SEO · Security · Malware · Uptime" },
  { value: 14, suffix: "+", label: "Capabilities", detail: "From monitoring to white-label reports" },
  { value: 30, suffix: "s", label: "Setup time", detail: "Paste a URL — first audit starts instantly" },
  { value: 3, suffix: "", label: "Access tiers", detail: "URL · Plugin · SSH" },
  { value: 100, suffix: "%", label: "White-label", detail: "Logo, colours, domain — your brand everywhere" },
] as const;

function AnimatedFact({ fact, index }: { fact: typeof FACTS[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <p className="font-[family-name:var(--font-marketing-display)] text-5xl font-bold tracking-tight text-[var(--mkt-fg)] sm:text-6xl">
        <CountUp value={fact.value} suffix={fact.suffix} duration={2} />
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--mkt-fg)]">
        {fact.label}
      </p>
      <p className="mt-1 text-xs text-[var(--mkt-muted)]">
        {fact.detail}
      </p>
    </motion.div>
  );
}

export function FunFactsSection() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            title={
              <>
                <span className="text-[var(--mkt-fg)]">Built for scale. </span>
                <span className="text-[var(--mkt-muted)]">Proven in production.</span>
              </>
            }
            description="The numbers behind Site Armor — designed from day one for agencies managing WordPress portfolios."
          />
        </Reveal>

        <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-5">
          {FACTS.map((fact, i) => (
            <AnimatedFact key={fact.label} fact={fact} index={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
