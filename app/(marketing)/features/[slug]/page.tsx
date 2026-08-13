import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, Zap, AlertTriangle, Wrench, Brain } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf, cmsField } from "@/lib/marketing/cms";
import { FEATURE_PAGES, PILLARS, CONNECTION_TIERS } from "@/lib/marketing/features";
import { FEATURE_SNAPSHOT, SNAPSHOTS } from "@/lib/marketing/snapshots";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import { FAQSection, FaqJsonLd } from "@/components/marketing/sections/FAQSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

type Props = { params: Promise<{ slug: string }> };

function pageKey(slug: string) {
  return `features-${slug}`;
}

export function generateStaticParams() {
  return FEATURE_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = FEATURE_PAGES.find((f) => f.slug === slug);
  if (!meta) return {};
  const content = await getPageContent(pageKey(slug));
  const title = field(content.sections, "meta", "title", `${meta.title} — Site Armor`);
  const description = field(content.sections, "meta", "description", meta.description);
  return {
    title,
    description,
    alternates: { canonical: meta.href },
    openGraph: { title, description, url: meta.href, type: "website" },
  };
}

const FEATURE_DETAIL: Record<string, {
  problem: string;
  problemDetail: string;
  mechanisms: { icon: typeof Zap; title: string; desc: string }[];
  technical: string[];
  availableFrom: string;
  faqs: { q: string; a: string }[];
}> = {
  "performance-monitoring": {
    problem: "Slow sites lose clients.",
    problemDetail:
      "Agencies discover performance regressions weeks late — usually when a client complains about bounce rates or Google flags Core Web Vitals failures. Recommendations alone don't help if nobody has time to apply them across 50 sites.",
    mechanisms: [
      { icon: Zap, title: "Lighthouse & Core Web Vitals", desc: "Automated PageSpeed Insights on every audit — mobile and desktop, with LCP, INP, CLS, and overall score." },
      { icon: Brain, title: "Trend history", desc: "Score trends over time so you can pinpoint exactly when something changed — across any date range." },
      { icon: Wrench, title: "AI Optimize", desc: "Measure → diagnose → fix → re-measure. Detects existing cache plugins, applies fixes with backup, and rolls back if the score regresses." },
      { icon: AlertTriangle, title: "Instant alerts", desc: "Get notified the moment a performance score drops below your threshold — email or Slack." },
    ],
    technical: [
      "Google PageSpeed Insights API (Lighthouse)",
      "Core Web Vitals: LCP, FID/INP, CLS",
      "Measure → diagnose → fix → re-measure loop",
      "10+ cache/optimization plugin integrations",
      "Automatic backup before changes + rollback on regression",
      "Real-user JS metrics (plugin connected)",
      "Mobile + desktop separate",
    ],
    availableFrom: "Free (AI Optimize from Growth)",
    faqs: [
      { q: "How often are performance scores checked?", a: "On every audit cycle. Free plans run manual audits; paid plans support scheduled automatic audits at daily or weekly intervals." },
      { q: "Does AI Optimize install a new plugin?", a: "No. It detects the existing cache/optimization plugin on your site and configures that — no conflicting double-optimizers." },
      { q: "What if a fix breaks the site?", a: "The agent re-measures after every change. If the site breaks or the score regresses, everything is rolled back automatically." },
      { q: "Can I compare mobile vs desktop?", a: "Yes. Each audit produces separate mobile and desktop scores, displayed side by side in the dashboard." },
    ],
  },
};

function getDetail(slug: string, meta: (typeof FEATURE_PAGES)[number]) {
  if (FEATURE_DETAIL[slug]) return FEATURE_DETAIL[slug];
  return {
    problem: "Late discovery costs retainers.",
    problemDetail: `Agencies lose hours and credibility when ${meta.shortTitle.toLowerCase()} issues surface late — or only when a client calls. The gap between detection and action is where trust erodes.`,
    mechanisms: [
      { icon: Zap, title: "Continuous monitoring", desc: `Automated ${meta.shortTitle.toLowerCase()} checks across the entire portfolio on every audit cycle.` },
      { icon: Brain, title: "History & trends", desc: "Per-site drill-down with score history so you can pinpoint exactly when something changed." },
      { icon: AlertTriangle, title: "Instant alerts", desc: "Get notified when scores drop or incidents appear — email or Slack, your choice." },
      { icon: Wrench, title: "AI agent integration", desc: "Ties into the AI agent for investigation and confirmed remediation where applicable." },
    ],
    technical: [meta.description, "Portfolio-wide rollups and per-site drill-down", "Score trend history over time", "Alert thresholds configurable", "White-label compatible"],
    availableFrom: "Free (with plan-specific limits)",
    faqs: [
      { q: `Does ${meta.shortTitle} require the WordPress plugin?`, a: "URL-only connection unlocks external checks immediately. The plugin and SSH tiers unlock deeper inside-the-site and server-level capabilities." },
      { q: "Which plans include this?", a: "Core monitoring pillars are available from Free upward with site limits by plan. Advanced remediation and white-label unlock on higher tiers." },
      { q: "Can I white-label the results for clients?", a: "Yes. Reports and the client portal carry your agency brand. Site Armor stays invisible to the end client." },
    ],
  };
}

export default async function FeatureDetailPage({ params }: Props) {
  const { slug } = await params;
  const meta = FEATURE_PAGES.find((f) => f.slug === slug);
  if (!meta) notFound();

  const content = await getPageContent(pageKey(slug));
  const sections = content.sections;
  const c = cmsField(sf(sections, "hero"));
  const detail = getDetail(slug, meta);
  const related = FEATURE_PAGES.filter((f) => f.slug !== slug && f.pillar !== meta.pillar).slice(0, 3);
  const samePillar = FEATURE_PAGES.filter((f) => f.slug !== slug && f.pillar === meta.pillar).slice(0, 2);
  const allRelated = [...samePillar, ...related].slice(0, 4);
  const Icon = meta.icon;
  const pillarInfo = PILLARS.find((p) => p.key === meta.pillar);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Features", item: "/features" },
      { "@type": "ListItem", position: 3, name: meta.title, item: meta.href },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <FaqJsonLd faqs={detail.faqs} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 60% 45% at 50% -10%, rgb(var(--accent-rgb) / 0.18), transparent 50%),
              linear-gradient(180deg, var(--mkt-wash) 0%, var(--mkt-bg) 75%)
            `,
          }}
        />
        <Container>
          <Reveal>
            <p className="mb-4 text-sm font-medium text-[var(--mkt-muted)]">
              <Link href="/features" className="hover:text-accent transition-colors">Features</Link>
              <span className="mx-2 opacity-40">/</span>
              <span className="text-accent">{meta.shortTitle}</span>
            </p>
          </Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
            <div>
              <Reveal delay={0.04}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-elevated-sm">
                  <Icon size={24} />
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="max-w-lg font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-5xl">
                  {c("title", meta.title)}
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
                  {c("subtitle", meta.description)}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/register" size="lg">
                    Start Free — No Card Needed
                    <ArrowRight size={15} />
                  </ButtonLink>
                  <ButtonLink href="/pricing" variant="secondary" size="lg">
                    View pricing
                  </ButtonLink>
                </div>
              </Reveal>
              {(pillarInfo || detail.availableFrom) && (
                <Reveal delay={0.2}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {pillarInfo ? (
                      <div className="rounded-xl bg-[var(--mkt-surface)] px-3.5 py-2.5 shadow-elevated-xs">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--mkt-muted)]">Pillar</p>
                        <p className="text-sm font-semibold text-[var(--mkt-fg)]">{pillarInfo.label}</p>
                      </div>
                    ) : null}
                    <div className="rounded-xl bg-[var(--mkt-surface)] px-3.5 py-2.5 shadow-elevated-xs">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--mkt-muted)]">From</p>
                      <p className="text-sm font-semibold text-[var(--mkt-fg)]">{detail.availableFrom}</p>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
            <Reveal delay={0.1}>
              {FEATURE_SNAPSHOT[slug] ? (
                <ProductFrame
                  snapshot={SNAPSHOTS[FEATURE_SNAPSHOT[slug]]}
                  size="lg"
                  priority
                  showCaption
                />
              ) : (
                <ProductFrame snapshot={SNAPSHOTS.dash} size="lg" showCaption />
              )}
            </Reveal>
          </div>
        </Container>
      </section>

      {/* The problem */}
      <Section tone="muted">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">The problem</p>
              <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
                {detail.problem}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--mkt-muted)]">
                {c("problem", detail.problemDetail)}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 shadow-elevated-sm sm:p-8">
                <h3 className="mb-5 text-lg font-semibold text-[var(--mkt-fg)]">How Site Armor handles it</h3>
                <div className="space-y-5">
                  {detail.mechanisms.map((m) => {
                    const MIcon = m.icon;
                    return (
                      <div key={m.title} className="flex gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
                          <MIcon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--mkt-fg)]">{m.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-[var(--mkt-muted)]">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Technical detail */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Technical detail"
              title="What actually gets measured and acted on."
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.technical.map((item, i) => (
              <Reveal key={item} delay={0.04 * i}>
                <div className="flex items-start gap-3 rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--mkt-fg)]">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <p className="mt-8 rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-surface)] px-6 py-4 text-sm text-[var(--mkt-muted)]">
              Every claim on this page maps to a shipping capability. For plan limits (sites, AI tokens, storage, backups), see{" "}
              <Link href="/pricing" className="font-semibold text-accent hover:text-accent-hover">Pricing</Link>.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Connection tiers mini */}
      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Depth levels"
              title="More access unlocks more capability."
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {CONNECTION_TIERS.map((tier, i) => {
              const TIcon = tier.icon;
              return (
                <Reveal key={tier.step} delay={0.05 * i}>
                  <div className="rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all hover:-translate-y-0.5 hover:shadow-elevated-md">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow-elevated-xs">
                        <TIcon size={15} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">{tier.time}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--mkt-fg)]">{tier.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--mkt-muted)]">{tier.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Related features */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Related features"
              title="Capabilities that work alongside this one."
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allRelated.map((f, i) => {
              const RIcon = f.icon;
              return (
                <Reveal key={f.slug} delay={0.04 * i}>
                  <Link
                    href={f.href}
                    className="group flex h-full flex-col rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated-md"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                        <RIcon size={15} />
                      </span>
                      <ArrowUpRight size={14} className="text-[var(--mkt-muted)] opacity-0 transition-all group-hover:opacity-100 group-hover:text-accent" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--mkt-fg)]">{f.title}</span>
                    <span className="mt-1 flex-1 text-xs leading-relaxed text-[var(--mkt-muted)]">{f.description}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <FAQSection faqs={detail.faqs} cms={sf(sections, "faq")} />
      <FinalCTASection cms={sf(sections, "cta_banner")} />
    </main>
  );
}
