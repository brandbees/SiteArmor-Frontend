import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf, cmsField } from "@/lib/marketing/cms";
import { FEATURE_PAGES } from "@/lib/marketing/features";
import { PILLARS } from "@/lib/marketing/features";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

const DEFAULT_TITLE = "Features — Site Armor WordPress operations platform";
const DEFAULT_DESC =
  "Explore Site Armor capabilities: performance & AI Optimize, SEO, security, malware, uptime, white-label reports, backups, and more.";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("features");
  const title = field(content.sections, "meta", "title", DEFAULT_TITLE);
  const description = field(content.sections, "meta", "description", DEFAULT_DESC);
  return {
    title,
    description,
    alternates: { canonical: "/features" },
    openGraph: { title, description, url: "/features", type: "website" },
  };
}

const GROUPS: { key: string; label: string; description: string; pillars: string[] }[] = [
  {
    key: "health",
    label: "Health pillars",
    description: "Five weighted scores that roll up into one portfolio health number.",
    pillars: ["ai", "performance", "seo", "security", "malware", "uptime"],
  },
  {
    key: "reporting",
    label: "Reporting & clients",
    description: "White-label PDFs, portals, and branding that keep Site Armor invisible.",
    pillars: ["reporting"],
  },
  {
    key: "ops",
    label: "Operations",
    description: "Backups, updates, broken links, WooCommerce, and SSL — the daily maintenance layer.",
    pillars: ["operations"],
  },
];

export default async function FeaturesHubPage() {
  const content = await getPageContent("features");
  const sections = content.sections;
  const c = cmsField(sf(sections, "hero"));

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% -5%, rgb(var(--accent-rgb) / 0.15), transparent 55%),
              linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 80%)
            `,
          }}
        />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                {c("eyebrow", "Platform capabilities")}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-[family-name:var(--font-marketing-display)] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
                {c("title", "Every capability that keeps client WordPress sites healthy.")}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--mkt-muted)]">
                {c("description", "Grouped the way agencies buy — health pillars, AI remediation, client reporting, and day-to-day operations.")}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/register" size="lg">
                  Start Free — No Card Needed
                  <ArrowRight size={15} />
                </ButtonLink>
                <ButtonLink href="/pricing" variant="secondary" size="lg">
                  View pricing
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Pillar summary strip */}
      <Section className="!py-0 !-mt-4">
        <Container>
          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[var(--mkt-border)] shadow-elevated-sm md:grid-cols-5">
              {PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.key} className="bg-[var(--mkt-surface)] px-4 py-5 text-center">
                    <Icon size={18} className="mx-auto mb-2 text-accent" />
                    <p className="text-sm font-semibold text-[var(--mkt-fg)]">{p.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--mkt-muted)]">{p.weight} weight</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Feature groups — icon boxes (no screenshots) */}
      {GROUPS.map((group, gi) => {
        const items = group.pillars.flatMap((pillar) =>
          FEATURE_PAGES.filter((f) => f.pillar === pillar)
        );
        if (!items.length) return null;
        return (
          <Section key={group.key} tone={gi % 2 === 0 ? "default" : "muted"}>
            <Container>
              <Reveal>
                <SectionHeading
                  eyebrow={group.label}
                  title={group.description}
                />
              </Reveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <Reveal key={feature.slug} delay={0.04 * i}>
                      <Link
                        href={feature.href}
                        className="group flex h-full flex-col rounded-lg border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated-md"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-white">
                            <Icon size={18} />
                          </span>
                          <ArrowUpRight
                            size={16}
                            className="text-[var(--mkt-muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-accent"
                          />
                        </div>
                        <h3 className="font-[family-name:var(--font-marketing-display)] text-lg font-bold text-[var(--mkt-fg)]">
                          {feature.shortTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)] sm:text-base">
                          {feature.description}
                        </p>
                        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-accent transition-opacity group-hover:opacity-100 sm:opacity-70">
                          Learn more <ArrowRight size={12} />
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </Container>
          </Section>
        );
      })}

      <FinalCTASection cms={sf(sections, "cta_banner")} />
    </main>
  );
}
