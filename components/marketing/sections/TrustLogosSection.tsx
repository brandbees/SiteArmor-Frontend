"use client";

import { Container } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";

const LOGOS = [
  "Starter Care Plans",
  "WP Care Studio",
  "Growth Partner Co.",
  "Pixel Fleet",
  "SiteCraft",
  "QuickWP",
];

export function TrustLogosSection() {
  return (
    <section className="border-b border-[var(--mkt-border)] bg-[var(--mkt-bg)] py-10">
      <Container>
        <Reveal>
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--mkt-muted)]">
            Trusted by agencies in 40+ countries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {LOGOS.map((name) => (
              <span
                key={name}
                className="font-[family-name:var(--font-marketing-display)] text-lg font-bold tracking-tight text-[var(--mkt-fg)] opacity-25"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
