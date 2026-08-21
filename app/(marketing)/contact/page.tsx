import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Clock } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf, cmsField } from "@/lib/marketing/cms";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("contact");
  const title = field(content.sections, "meta", "title", "Contact — Site Armor by BrandBees");
  const description = field(content.sections, "meta", "description", "Contact BrandBees about Site Armor — product questions, security reviews, or agency rollout.");
  return { title, description, alternates: { canonical: "/contact" }, openGraph: { title, description, url: "/contact", type: "website" } };
}

const REASONS = [
  { icon: Mail, title: "Product questions", desc: "Feature fit, integrations, plan sizing — we'll give you straight answers." },
  { icon: Clock, title: "Security reviews", desc: "Need a DPA, security questionnaire, or vault architecture details? We're ready." },
  { icon: MapPin, title: "Agency rollout", desc: "Planning to onboard 50+ sites? Let's talk sequencing and team setup." },
];

export default async function ContactPage() {
  const content = await getPageContent("contact");
  const c = cmsField(sf(content.sections, "hero"));

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -5%, rgb(var(--accent-rgb) / 0.15), transparent 55%), linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 80%)`,
        }} />
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                {c("eyebrow", "Contact")}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-[family-name:var(--font-marketing-display)] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
                {c("title", "Talk to the BrandBees team.")}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-[var(--mkt-muted)]">
                {c("description", "Product questions, security reviews, or agency rollout — email us directly. Prefer to try first? Start free with no card required.")}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Contact info + reasons */}
      <Section className="!py-0 !-mt-2">
        <Container>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <div className="rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Email us</p>
                <a href="mailto:hello@brandbees.net" className="mt-3 block font-[family-name:var(--font-marketing-display)] text-2xl font-bold text-[var(--mkt-fg)] transition-colors hover:text-accent sm:text-3xl">
                  hello@brandbees.net
                </a>
                <p className="mt-3 text-base leading-relaxed text-[var(--mkt-muted)]">
                  We typically respond within one business day. For security-specific questions (DPA requests, vault architecture, compliance), mention it in the subject line.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/register" size="lg">
                    Start Free
                    <ArrowRight size={15} />
                  </ButtonLink>
                  <ButtonLink href="/trust" variant="secondary" size="lg">
                    Security overview
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
            <div className="space-y-3">
              {REASONS.map((reason, i) => {
                const Icon = reason.icon;
                return (
                  <Reveal key={reason.title} delay={0.05 * i}>
                    <div className="group rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated-md">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                        <Icon size={18} />
                      </div>
                      <h3 className="font-[family-name:var(--font-marketing-display)] text-base font-bold text-[var(--mkt-fg)]">{reason.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--mkt-muted)]">{reason.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>

      {/* Quick links */}
      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Before you reach out"
              title="These pages might have your answer."
            />
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Features", href: "/features", desc: "14 capabilities, one platform." },
              { label: "How it works", href: "/how-it-works", desc: "Three connection tiers." },
              { label: "Pricing", href: "/pricing", desc: "Plans, limits, comparison." },
              { label: "Security", href: "/trust", desc: "Vault, audit trail, RBAC." },
            ].map((link, i) => (
              <Reveal key={link.href} delay={0.04 * i}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated-md"
                >
                  <span className="font-[family-name:var(--font-marketing-display)] text-base font-bold text-[var(--mkt-fg)] group-hover:text-accent">{link.label}</span>
                  <span className="mt-1 text-sm text-[var(--mkt-muted)]">{link.desc}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCTASection cms={sf(content.sections, "cta_banner")} />
    </main>
  );
}
