import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, X, Minus } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf } from "@/lib/marketing/cms";
import { ADDONS, PLANS } from "@/lib/marketing/pricing";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { PricingPreviewSection } from "@/components/marketing/sections/PricingPreviewSection";
import { FAQSection, FaqJsonLd } from "@/components/marketing/sections/FAQSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

const DEFAULT_TITLE = "Pricing — SnapshotAI WordPress maintenance software";
const DEFAULT_DESC = "Four plans with real site limits, AI token allowances, storage, and backup retention. 14-day trial on paid plans — no card required.";

const PRICING_FAQS = [
  { q: "What counts as a site?", a: "Each WordPress installation you connect counts as one site. Staging and production count separately if both are monitored." },
  { q: "What happens when I hit my site limit?", a: "You can upgrade or remove a site. The Agency plan caps at 9,999 sites (effectively unlimited)." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from billing settings. Your access continues through the current billing period." },
  { q: "What are AI tokens?", a: "Tokens power the AI agent and report narratives. Unused allotments reset monthly; top-ups are available." },
  { q: "Is there a free trial?", a: "All paid plans include a 14-day trial with no card required. The Free plan stays free for one site." },
  { q: "Do you charge per user?", a: "No. Plans are priced by site count. Team members are unlimited on all plans." },
];

const COMPARISON_ROWS: { label: string; values: (boolean | string)[] }[] = [
  { label: "Sites", values: ["1", "10", "50", "9,999"] },
  { label: "AI tokens / month", values: ["1,000", "5,000", "20,000", "100,000"] },
  { label: "Storage", values: ["100 MB", "500 MB", "1 GB", "5 GB"] },
  { label: "All 5 health pillars", values: [true, true, true, true] },
  { label: "Scheduled audits", values: [false, true, true, true] },
  { label: "AI-written reports", values: [false, true, true, true] },
  { label: "Client portal", values: [false, false, true, true] },
  { label: "White-label branding", values: [false, false, true, true] },
  { label: "Automated backups", values: [false, false, true, true] },
  { label: "Backup retention", values: ["—", "7 days", "14 days", "30 days"] },
  { label: "Safe plugin updates", values: [false, false, true, true] },
  { label: "AI agent (SSH)", values: [false, false, true, true] },
  { label: "Team roles (RBAC)", values: [false, false, true, true] },
  { label: "AI Optimize mode", values: [false, false, true, true] },
];

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("pricing");
  const title = field(content.sections, "meta", "title", DEFAULT_TITLE);
  const description = field(content.sections, "meta", "description", DEFAULT_DESC);
  return { title, description, alternates: { canonical: "/pricing" }, openGraph: { title, description, url: "/pricing", type: "website" } };
}

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value
      ? <Check size={16} className="mx-auto text-accent" strokeWidth={2.5} />
      : <X size={14} className="mx-auto text-[var(--mkt-muted)] opacity-40" />;
  }
  if (value === "—") return <Minus size={14} className="mx-auto text-[var(--mkt-muted)] opacity-40" />;
  return <span className="text-sm font-medium text-[var(--mkt-fg)]">{value}</span>;
}

export default async function PricingPage() {
  const content = await getPageContent("pricing");
  const sections = content.sections;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "SnapshotAI",
    description: DEFAULT_DESC,
    brand: { "@type": "Brand", name: "BrandBees" },
    offers: [{ "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" }],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <FaqJsonLd faqs={PRICING_FAQS} />

      {/* Pricing cards */}
      <div className="pt-16 sm:pt-20">
        <PricingPreviewSection
          cms={{
            eyebrow: "Pricing",
            title: "Simple plans. Honest limits.",
            description: "Built around how agencies grow — sites, AI capacity, storage, and backup retention. All paid plans: 14-day trial, no card required.",
            ...sf(sections, "hero"),
            ...sf(sections, "pricing"),
          }}
          showAllFeatures
        />
      </div>

      {/* Feature comparison matrix */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Compare plans"
              title="Feature-by-feature breakdown."
            />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="overflow-x-auto rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-sm">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[var(--mkt-border)]">
                    <th className="px-5 py-4 text-sm font-semibold text-[var(--mkt-fg)]">Feature</th>
                    {PLANS.map((p) => (
                      <th key={p.code} className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-[var(--mkt-fg)]">{p.name}</span>
                        {p.highlight ? <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase text-white">Popular</span> : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-[var(--mkt-bg-muted)]" : ""}>
                      <td className="px-5 py-3.5 text-sm text-[var(--mkt-muted)]">{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="px-4 py-3.5 text-center">
                          <ComparisonCell value={val} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Add-ons */}
      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Add-ons"
              title="Need more tokens or storage?"
              description="Confirmed add-on pricing — buy capacity beyond your plan when you need it."
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="rounded-2xl bg-[var(--mkt-surface)] p-6 shadow-elevated-xs">
                <h3 className="mb-1 text-lg font-semibold text-[var(--mkt-fg)]">AI token top-ups</h3>
                <p className="mb-4 text-sm text-[var(--mkt-muted)]">Power more agent conversations and report narratives.</p>
                <div className="space-y-0 overflow-hidden rounded-xl border border-[var(--mkt-border)]">
                  {ADDONS.tokens.map((t, i) => (
                    <div key={t.amount} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-[var(--mkt-border)]" : ""}`}>
                      <span className="text-sm font-medium text-[var(--mkt-fg)]">{t.amount} tokens</span>
                      <span className="text-sm font-bold text-accent">${t.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="rounded-2xl bg-[var(--mkt-surface)] p-6 shadow-elevated-xs">
                <h3 className="mb-1 text-lg font-semibold text-[var(--mkt-fg)]">Extra storage</h3>
                <p className="mb-4 text-sm text-[var(--mkt-muted)]">More space for backups and site snapshots.</p>
                <div className="space-y-0 overflow-hidden rounded-xl border border-[var(--mkt-border)]">
                  {ADDONS.storage.map((s, i) => (
                    <div key={s.amount} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-[var(--mkt-border)]" : ""}`}>
                      <span className="text-sm font-medium text-[var(--mkt-fg)]">{s.amount}</span>
                      <span className="text-sm font-bold text-accent">${s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Trial banner */}
      <Section className="!py-12">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-5 rounded-2xl bg-accent-light px-8 py-7 sm:flex-row">
              <div>
                <p className="text-lg font-semibold text-[var(--mkt-fg)]">All paid plans: 14-day trial, no card required.</p>
                <p className="mt-1 text-sm text-[var(--mkt-muted)]">Start with the Free plan and upgrade when your portfolio grows.</p>
              </div>
              <ButtonLink href="/register" className="shrink-0">
                Start Free
                <ArrowRight size={15} />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FAQSection faqs={PRICING_FAQS} cms={sf(sections, "faq")} />
      <FinalCTASection cms={sf(sections, "cta_banner")} />
    </main>
  );
}
