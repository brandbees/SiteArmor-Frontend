import type { Metadata } from "next";
import { getPageContent, field } from "@/lib/cms";
import { sf } from "@/lib/marketing/cms";
import { HeroSection } from "@/components/marketing/sections/HeroSection";
import { StatsBarSection } from "@/components/marketing/sections/StatsBarSection";
import { ProblemSection } from "@/components/marketing/sections/ProblemSection";
import { PlatformPillarsSection } from "@/components/marketing/sections/PlatformPillarsSection";
import { DifferentiatorSection } from "@/components/marketing/sections/DifferentiatorSection";
import { SecurityEdgeSection } from "@/components/marketing/sections/SecurityEdgeSection";
import { FeatureGridSection } from "@/components/marketing/sections/FeatureGridSection";
import { ComparisonSection } from "@/components/marketing/sections/ComparisonSection";
import { FunFactsSection } from "@/components/marketing/sections/FunFactsSection";
import { InlineCTASection } from "@/components/marketing/sections/InlineCTASection";
import { HowItWorksStepsSection } from "@/components/marketing/sections/HowItWorksStepsSection";
import { TestimonialsSection } from "@/components/marketing/sections/TestimonialsSection";
import {
  FAQSection,
  FaqJsonLd,
  HOME_FAQS,
} from "@/components/marketing/sections/FAQSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";

const DEFAULT_TITLE =
  "Site Armor by BrandBees — WordPress monitoring & remediation for agencies";
const DEFAULT_DESC =
  "Monitor, fix, and report on every client WordPress site — automatically. Five health pillars, an AI agent that remediates with confirmation, and white-label client reports.";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("home");
  const title = field(content.sections, "meta", "title", DEFAULT_TITLE);
  const description = field(
    content.sections,
    "meta",
    "description",
    DEFAULT_DESC
  );
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", type: "website" },
  };
}

function HomeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "BrandBees",
        url: "https://brandbees.net",
        logo: "/site-armor-icon.png",
      },
      {
        "@type": "SoftwareApplication",
        name: "Site Armor",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: DEFAULT_DESC,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free plan available · paid plans with 14-day trial",
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function HomePage() {
  const pageContent = await getPageContent("home");
  const sections = pageContent.sections;

  return (
    <main>
      <HomeJsonLd />
      <FaqJsonLd faqs={HOME_FAQS} />

      {/* Hero + social proof */}
      <HeroSection cms={sf(sections, "hero")} />
      <StatsBarSection />

      {/* The problem */}
      <ProblemSection />

      {/* Four pillars — how we solve it */}
      <PlatformPillarsSection cms={sf(sections, "platform")} />

      <InlineCTASection
        title="See it in action — add your first site in 30 seconds."
        subtitle="Free tier. No credit card required."
        cta="Start Free Trial"
        href="/register"
        secondaryCta="View Pricing"
        secondaryHref="/pricing"
        tone="accent"
      />

      {/* AI Agent deep-dive */}
      <DifferentiatorSection cms={sf(sections, "differentiator")} />

      {/* Detection edge */}
      <SecurityEdgeSection />

      {/* All capabilities */}
      <FeatureGridSection cms={sf(sections, "features")} />

      {/* Side-by-side comparison */}
      <ComparisonSection />

      <InlineCTASection
        title="Replace your fragmented tool stack today."
        subtitle="One platform. One bill. Every capability."
        cta="Protect My Sites"
        href="/register"
        secondaryCta="Talk to Us"
        secondaryHref="/contact"
        tone="dark"
      />

      {/* Fun facts / key numbers */}
      <FunFactsSection />

      {/* Getting started steps */}
      <HowItWorksStepsSection />

      {/* Testimonials grid */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection cms={sf(sections, "faq")} />

      {/* Final CTA */}
      <FinalCTASection cms={sf(sections, "cta_banner")} />
    </main>
  );
}
