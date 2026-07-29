import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPageContent, field } from "@/lib/cms";
import { sf, cmsField } from "@/lib/marketing/cms";
import {
  Container,
  Section,
  SectionHeading,
} from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

type Beat = {
  title: string;
  body: string;
  icon?: LucideIcon;
};

type Stat = {
  value: string;
  label: string;
};

export function buildSimplePage({
  pageKey,
  path,
  defaultTitle,
  defaultDescription,
  eyebrow,
  title,
  description,
  heroDetail,
  beats,
  stats,
  bottomCta,
}: {
  pageKey: string;
  path: string;
  defaultTitle: string;
  defaultDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  heroDetail?: string;
  beats: Beat[];
  stats?: Stat[];
  bottomCta?: { label: string; href: string };
}) {
  async function generateMetadata(): Promise<Metadata> {
    const content = await getPageContent(pageKey);
    const metaTitle = field(content.sections, "meta", "title", defaultTitle);
    const metaDesc = field(
      content.sections,
      "meta",
      "description",
      defaultDescription
    );
    return {
      title: metaTitle,
      description: metaDesc,
      alternates: { canonical: path },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        url: path,
        type: "website",
      },
    };
  }

  async function Page() {
    const content = await getPageContent(pageKey);
    const sections = content.sections;
    const c = cmsField(sf(sections, "hero"));

    return (
      <main>
        {/* Hero with gradient background */}
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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23102850' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {c("eyebrow", eyebrow)}
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  {c("title", title)}
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--mkt-muted)] sm:text-lg">
                  {c("description", description)}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/register" size="lg">
                    Start Free — No Card Needed
                    <ArrowRight size={15} />
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="secondary" size="lg">
                    Contact us
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Stats bar */}
        {stats && stats.length > 0 ? (
          <Section className="!py-0">
            <Container>
              <Reveal>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--mkt-border)] shadow-elevated-sm md:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[var(--mkt-surface)] px-5 py-6 text-center"
                    >
                      <p className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-accent">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-[var(--mkt-muted)]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </Container>
          </Section>
        ) : null}

        {/* Detail paragraph */}
        {heroDetail ? (
          <Section className="!py-12">
            <Container>
              <Reveal>
                <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-surface)] px-8 py-7 shadow-elevated-xs">
                  <p className="text-base leading-relaxed text-[var(--mkt-muted)]">
                    {heroDetail}
                  </p>
                </div>
              </Reveal>
            </Container>
          </Section>
        ) : null}

        {/* Beats grid */}
        <Section tone="muted">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="How it works"
                title="Built for the way you operate."
              />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {beats.map((beat, i) => {
                const BeatIcon = beat.icon;
                return (
                  <Reveal key={beat.title} delay={0.05 * i}>
                    <div className="group h-full rounded-2xl bg-[var(--mkt-surface)] p-6 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                      {BeatIcon ? (
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                          <BeatIcon size={18} />
                        </div>
                      ) : (
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-elevated-xs">
                          <span className="text-sm font-bold">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                      )}
                      <h2 className="text-lg font-semibold text-[var(--mkt-fg)]">
                        {beat.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-muted)]">
                        {beat.body}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* Cross-link strip */}
        <Section className="!py-14">
          <Container>
            <Reveal>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "All features", href: "/features", desc: "14 capabilities, one platform." },
                  { label: "How it works", href: "/how-it-works", desc: "Three connection tiers." },
                  { label: "Pricing", href: "/pricing", desc: "Four plans, real limits." },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center justify-between rounded-2xl bg-[var(--mkt-surface)] px-5 py-4 shadow-elevated-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated-md"
                  >
                    <div>
                      <span className="text-sm font-semibold text-[var(--mkt-fg)]">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--mkt-muted)]">
                        {link.desc}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-[var(--mkt-muted)] transition-all group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>

        <FinalCTASection cms={sf(sections, "cta_banner")} />
      </main>
    );
  }

  return { generateMetadata, Page };
}
