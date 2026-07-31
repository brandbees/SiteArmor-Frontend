import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Shield, Zap, Package, Bot, Globe, Lock, RotateCcw } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf, cmsField } from "@/lib/marketing/cms";
import { CONNECTION_TIERS } from "@/lib/marketing/features";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";
import { FAQSection, FaqJsonLd } from "@/components/marketing/sections/FAQSection";

const DEFAULT_TITLE = "How it works — Monitor client WordPress sites with SnapshotAI";
const DEFAULT_DESC = "Three connection tiers: URL-only in 30 seconds, WordPress plugin in 2 minutes, SSH when you're ready for autonomous remediation.";

const TIER_SNAPSHOTS: SnapshotId[] = ["sites", "site-dash", "agent"];

const TIER_UNLOCKS: Record<string, { items: string[]; icon: typeof Globe }> = {
  "01": {
    icon: Globe,
    items: ["Performance (Lighthouse)", "SEO audit", "Uptime pings", "SSL & domain expiry", "Broken links", "Public security surface"],
  },
  "02": {
    icon: Package,
    items: ["Plugin/theme inventory", "File integrity", "Malware scanning", "WooCommerce metrics", "Backups", "Safe plugin updates"],
  },
  "03": {
    icon: Bot,
    items: ["Read server files & logs", "Server-level fixes", "Security hardening", "Malware cleanup", "Config changes", "Full AI agent tools"],
  },
};

const FAQS = [
  { q: "Do I have to give SSH access?", a: "No. URL-only and plugin tiers deliver substantial monitoring and maintenance value. SSH unlocks the autonomous agent for server-level fixes — when you're ready." },
  { q: "Where are SSH credentials stored?", a: "In an encrypted vault — never plaintext, never exposed to the AI model. Every operation is logged with actor, command, and result." },
  { q: "Can I start without booking a demo?", a: "Yes. Tier 1 works immediately after you add a URL. Nothing is gated behind a sales call." },
  { q: "How long does the plugin take to install?", a: "About 2 minutes — install from WordPress admin, then connect from the SnapshotAI dashboard." },
  { q: "Does the agent modify sites without asking?", a: "No. Every destructive operation shows a preview. You confirm before anything is written. Snapshots enable rollback." },
];

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("how-it-works");
  const title = field(content.sections, "meta", "title", DEFAULT_TITLE);
  const description = field(content.sections, "meta", "description", DEFAULT_DESC);
  return { title, description, alternates: { canonical: "/how-it-works" }, openGraph: { title, description, url: "/how-it-works", type: "website" } };
}

export default async function HowItWorksPage() {
  const content = await getPageContent("how-it-works");
  const sections = content.sections;
  const c = cmsField(sf(sections, "hero"));

  return (
    <main>
      <FaqJsonLd faqs={FAQS} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -5%, rgb(var(--accent-rgb) / 0.15), transparent 55%), linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 80%)`,
        }} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                {c("eyebrow", "How it works")}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                {c("title", "Start shallow. Go deep when you're ready.")}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
                {c("description", "Three connection tiers, nothing gated behind a demo call. Each deeper tier unlocks more capability — on your timeline.")}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <ButtonLink href="/register" size="lg" className="mt-8">
                Start Free — No Card Needed
                <ArrowRight size={15} />
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Timeline summary */}
      <Section className="!py-0 !-mt-2">
        <Container>
          <Reveal>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-[var(--mkt-border)] shadow-elevated-sm">
              {CONNECTION_TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div key={tier.step} className="bg-[var(--mkt-surface)] px-4 py-5 text-center">
                    <Icon size={20} className="mx-auto mb-2 text-accent" />
                    <p className="text-sm font-semibold text-[var(--mkt-fg)]">{tier.title}</p>
                    <p className="mt-0.5 text-xs text-accent font-semibold">{tier.time}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Detailed tier cards */}
      <Section tone="muted">
        <Container>
          <div className="space-y-6">
            {CONNECTION_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const unlocks = TIER_UNLOCKS[tier.step];
              return (
                <Reveal key={tier.step} delay={0.06 * i}>
                  <div className="overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-sm transition-all hover:shadow-elevated-md">
                    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="p-6 sm:p-8">
                        <div className="mb-4 flex items-center gap-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-elevated-sm">
                            <Icon size={20} />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{tier.time}</p>
                            <h2 className="text-2xl font-semibold text-[var(--mkt-fg)]">{tier.title}</h2>
                          </div>
                        </div>
                        <p className="mb-5 max-w-lg text-base leading-relaxed text-[var(--mkt-muted)]">{tier.desc}</p>
                        <div className="rounded-xl bg-[var(--mkt-bg-muted)] p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--mkt-muted)]">Unlocks</p>
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {unlocks.items.map((item) => (
                              <li key={item} className="flex items-center gap-2 text-sm text-[var(--mkt-fg)]">
                                <Check size={13} className="shrink-0 text-accent" strokeWidth={2.5} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="border-t border-[var(--mkt-border)] bg-[var(--mkt-bg-muted)] p-4 lg:border-l lg:border-t-0">
                        <ProductFrame
                          snapshot={SNAPSHOTS[TIER_SNAPSHOTS[i]]}
                          size="sm"
                          chrome={false}
                          className="[&>div]:shadow-none [&>div]:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Security callout */}
      <Section>
        <Container>
          <Reveal>
            <div className="overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-elevated-lg">
              <div className="relative px-8 py-12 sm:px-12">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20" style={{
                  backgroundImage: "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 35%)",
                }} />
                <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                      <Shield size={22} className="text-white" />
                    </div>
                    <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold sm:text-3xl">
                      Giving SSH access is a big decision.
                    </h2>
                    <p className="mt-3 max-w-lg text-base text-white/75">
                      We treat it that way. Encrypted vault, confirmation before every write, backup-before-change, full audit log, and one-click rollback.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                      {[
                        { icon: Lock, label: "Encrypted vault" },
                        { icon: Check, label: "Confirmation before write" },
                        { icon: RotateCcw, label: "One-click rollback" },
                      ].map((item) => {
                        const IIcon = item.icon;
                        return (
                          <span key={item.label} className="flex items-center gap-2 text-sm text-white/85">
                            <IIcon size={14} /> {item.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <ButtonLink href="/trust" variant="inverse" size="lg">
                    Security & trust
                    <ArrowRight size={15} />
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FAQSection faqs={FAQS} cms={sf(sections, "faq")} />
      <FinalCTASection cms={sf(sections, "cta_banner")} />
    </main>
  );
}
