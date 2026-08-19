"use client";

import { Check } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cn } from "@/lib/utils";

const ROWS = [
  { cap: "Health monitoring", ours: "5 pillars, continuous", alt1: "Single-dimension", alt2: "Varies" },
  { cap: "AI remediation", ours: "Agent + confirmation", alt1: "Manual only", alt2: "Not included" },
  { cap: "Client reporting", ours: "AI-written, white-label", alt1: "Basic exports", alt2: "Manual" },
  { cap: "Setup time", ours: "30 seconds (URL)", alt1: "15-30 minutes", alt2: "Per-tool config" },
  { cap: "Rollback safety", ours: "Backup before every write", alt1: "Partial", alt2: "Limited" },
  { cap: "Agency branding", ours: "Full white-label", alt1: "Not available", alt2: "Limited" },
] as const;

const COL_HEADERS = [
  { label: "Capability", highlight: false },
  { label: "Site Armor", highlight: true },
  { label: "Typical Security Plugin", highlight: false },
  { label: "Typical Monitoring Stack", highlight: false },
];

export function ComparisonSection() {
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow="Comparison"
            title={
              <>
                <span className="text-[var(--mkt-muted)]">Stack Site Armor against </span>
                <span>fragmented tool stacks.</span>
              </>
            }
            description="Built for agencies first: prevention, remediation, reporting, and client presentation in one platform."
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="overflow-hidden rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-elevated-sm">
                <div className="grid grid-cols-4">
                  {COL_HEADERS.map((col) => (
                    <div
                      key={col.label}
                      className={cn(
                        "border-b border-[var(--mkt-border)] px-5 py-4 text-sm font-bold uppercase tracking-wider",
                        col.highlight
                          ? "bg-accent/10 text-accent"
                          : "bg-[var(--mkt-bg-muted)] text-[var(--mkt-muted)]"
                      )}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>

                {ROWS.map((row, i) => (
                  <div
                    key={row.cap}
                    className={cn(
                      "grid grid-cols-4 border-b border-[var(--mkt-border)] last:border-b-0 transition-colors",
                      i % 2 === 1 && "bg-[var(--mkt-bg-muted)]/30"
                    )}
                  >
                    <div className="px-5 py-4 text-sm font-medium text-[var(--mkt-fg)]">
                      {row.cap}
                    </div>
                    <div className="flex items-center gap-2 bg-accent/[0.04] px-5 py-4 text-sm font-semibold text-[var(--mkt-fg)]">
                      <Check size={15} className="shrink-0 text-accent" strokeWidth={2.5} />
                      {row.ours}
                    </div>
                    <div className="px-5 py-4 text-sm text-[var(--mkt-muted)]">{row.alt1}</div>
                    <div className="px-5 py-4 text-sm text-[var(--mkt-muted)]">{row.alt2}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
