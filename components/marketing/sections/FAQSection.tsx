"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { cmsField } from "@/lib/marketing/cms";
import { cn } from "@/lib/utils";

export const HOME_FAQS = [
  {
    q: "Do I need to install a plugin to get started?",
    a: "No. Add a site by URL and external scanning starts immediately — performance, SEO, uptime, SSL, broken links, and public-surface security. The WordPress plugin unlocks deeper inside-the-site data when you're ready.",
  },
  {
    q: "Does the AI agent change sites without asking?",
    a: "No. Every destructive operation shows a preview of the write, and you confirm before anything is applied. Snapshots are taken before changes so you can roll back. That's a selling point, not a limitation.",
  },
  {
    q: "Can clients see that we use SnapshotAI?",
    a: "Not if you don't want them to. Full white-label covers logo, favicon, display name, cover tagline, and brand colours. Reports and the client portal carry your agency brand.",
  },
  {
    q: "What counts as a site?",
    a: "Each WordPress installation you connect counts as one site toward your plan limit. Staging and production are separate sites if both are monitored.",
  },
  {
    q: "What are AI tokens?",
    a: "AI tokens power the conversational agent and AI-written report narratives. Each plan includes a monthly allowance; you can buy top-ups if you need more.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. All paid plans include a 14-day trial with no card required at signup. The Free plan stays free forever for a single site.",
  },
  {
    q: "How are SSH credentials stored?",
    a: "In an encrypted vault — never in plaintext, never exposed to the AI model. Every SSH operation is logged with actor, command, and result.",
  },
  {
    q: "What happens if an optimization makes things worse?",
    a: "Optimize mode re-measures after every change. If the score regresses or the site breaks, SnapshotAI rolls back automatically and remembers not to retry that fix on that site.",
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-xs transition-shadow duration-200 hover:shadow-elevated-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-[var(--mkt-fg)]">{q}</span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-[var(--mkt-muted)] transition-transform duration-200",
            open && "rotate-180 text-accent"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--mkt-muted)]">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection({
  cms = {},
  faqs = HOME_FAQS,
}: {
  cms?: Record<string, string>;
  faqs?: { q: string; a: string }[];
}) {
  const c = cmsField(cms);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" className="!pb-10 sm:!pb-12 lg:!pb-14">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={c("eyebrow", "FAQ")}
            title={c("title", "Straight answers.")}
            description={c(
              "description",
              "Built for developers and agency owners who've heard every WordPress tool pitch."
            )}
          />
        </Reveal>

        <div className="mx-auto max-w-2xl space-y-2.5">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={Math.min(i * 0.04, 0.24)}>
              <FaqItem
                q={faq.q}
                a={faq.a}
                open={openIndex === i}
                onToggle={() =>
                  setOpenIndex((curr) => (curr === i ? null : i))
                }
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function FaqJsonLd({ faqs = HOME_FAQS }: { faqs?: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
