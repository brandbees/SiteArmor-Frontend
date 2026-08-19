"use client";

import { Section, SectionHeading, Container } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "We replaced six separate tools with Site Armor. **One dashboard, one bill, one source of truth** for every client site.",
    name: "Agency Ops Lead",
    handle: "@wpcarestudio",
  },
  {
    quote:
      "The AI agent suggested fixes we would have missed — and **asked for confirmation before every destructive action**. That trust factor changed everything.",
    name: "Technical Director",
    handle: "@growthpartner",
  },
  {
    quote:
      "White-label reporting **transformed our client conversations**. We show progress monthly instead of explaining outages after the fact.",
    name: "Founder",
    handle: "@startercare",
  },
  {
    quote:
      "I was drowning in six logins across three dashboards. Site Armor **consolidated everything into one clean view** I actually check daily.",
    name: "Solo Developer",
    handle: "@devjess",
  },
  {
    quote:
      "The backup-before-write approach means **I never worry about breaking a client site**. The AI proposes, I confirm, done.",
    name: "WP Maintenance Pro",
    handle: "@sitecraftdan",
  },
  {
    quote:
      "Our clients used to ask 'what exactly do we pay you for?' Now we **send them a branded report every month** with actual proof.",
    name: "Agency Owner",
    handle: "@pixelfleet",
  },
  {
    quote:
      "Setup took thirty seconds. Literally. **Pasted a URL and the first audit was running** before I finished my coffee.",
    name: "Freelancer",
    handle: "@quickwpfix",
  },
  {
    quote:
      "We manage 200+ sites. Site Armor's portfolio view and **health scores across five pillars** give us a real bird's-eye view.",
    name: "Operations Manager",
    handle: "@agencyops",
  },
];

function parseQuote(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-[var(--accent)]">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TestimonialCard({
  quote,
  name,
  handle,
  index,
}: (typeof TESTIMONIALS)[number] & { index: number }) {
  return (
    <Reveal delay={index * 0.05} y={12}>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        )}
      >
        <p className="text-sm leading-relaxed text-[var(--mkt-fg)]">
          &ldquo;{parseQuote(quote)}&rdquo;
        </p>
        <div className="mt-auto flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-bg-muted)] text-xs font-medium text-[var(--mkt-muted)]">
            {getInitials(name)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--mkt-fg)]">
              {name}
            </span>
            <span className="text-xs text-[var(--mkt-muted)]">{handle}</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function TestimonialsSection() {
  return (
    <Section id="testimonials" tone="default">
      <Container>
        <SectionHeading
          align="center"
          title={
            <>
              <span className="text-[var(--mkt-muted)]">
                Trusted by teams who{" "}
              </span>
              <span className="text-[var(--mkt-fg)]">
                can&apos;t afford downtime.
              </span>
            </>
          }
          description="Agencies, freelancers, and in-house teams rely on Site Armor to keep WordPress sites healthy without the busywork."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.handle} {...t} index={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
