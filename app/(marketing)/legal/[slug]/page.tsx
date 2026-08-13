import type { Metadata } from "next";
import { Container, Section } from "@/components/marketing/ui/Section";

const PAGES = {
  privacy: {
    title: "Privacy Policy",
    body: "This privacy policy describes how Site Armor collects, uses, and protects personal data. For the current legal text, contact hello@brandbees.net. This page is a compliance placeholder pending final counsel review.",
  },
  terms: {
    title: "Terms of Service",
    body: "These terms govern use of Site Armor. For the current legal text, contact hello@brandbees.net. This page is a compliance placeholder pending final counsel review.",
  },
  cookies: {
    title: "Cookie Policy",
    body: "Site Armor uses essential cookies for authentication and preferences, and may use analytics cookies where consented. For the current legal text, contact hello@brandbees.net.",
  },
  gdpr: {
    title: "GDPR",
    body: "BrandBees is committed to GDPR-aligned processing for Site Armor customers and their end clients' portal access. For DPA requests or data subject inquiries, contact hello@brandbees.net.",
  },
} as const;

type LegalSlug = keyof typeof PAGES;

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug as LegalSlug];
  if (!page) return {};
  return {
    title: `${page.title} — Site Armor`,
    description: page.body.slice(0, 155),
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug as LegalSlug];
  if (!page) {
    return (
      <Section className="pt-28">
        <Container>
          <h1 className="text-2xl font-semibold">Not found</h1>
        </Container>
      </Section>
    );
  }

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container>
          <article className="mx-auto max-w-2xl">
            <h1 className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)]">
              {page.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-[var(--mkt-muted)]">
              {page.body}
            </p>
            <p className="mt-8 text-sm text-[var(--mkt-muted)]">
              Questions:{" "}
              <a
                href="mailto:hello@brandbees.net"
                className="font-semibold text-accent"
              >
                hello@brandbees.net
              </a>
            </p>
          </article>
        </Container>
      </Section>
    </main>
  );
}
