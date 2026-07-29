"use client";

import { Clock, PhoneCall, FileQuestion } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cmsField } from "@/lib/marketing/cms";

const BEATS = [
  {
    icon: Clock,
    title: "Manual audits burn hours",
    desc: "Checking performance, security, plugins, and uptime across a portfolio eats billable time every month.",
  },
  {
    icon: PhoneCall,
    title: "Clients find problems first",
    desc: "The agency nightmare: a client calls about downtime or malware before you've even seen the alert.",
  },
  {
    icon: FileQuestion,
    title: "No proof the retainer earns its keep",
    desc: "Maintenance work is invisible until something breaks. Clients only hear from you when there's bad news.",
  },
];

export function ProblemSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "The agency problem")}
            title={c("title", "You shouldn't hear about issues from your clients.")}
            description={c(
              "description",
              "SnapshotAI flips the script: you know first, often have already fixed it, and the monthly report proves the retainer is working."
            )}
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {BEATS.map((beat, i) => {
            const Icon = beat.icon;
            return (
              <Reveal key={beat.title} delay={0.08 * i}>
                <div className="group h-full rounded-2xl bg-[var(--mkt-surface)] p-6 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--mkt-fg)]">
                    {beat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)]">
                    {beat.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
