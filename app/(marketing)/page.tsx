import type { Metadata } from "next";
import { getPageContent, field } from "@/lib/cms";
import { sf } from "@/lib/marketing/cms";
import { HeroSection } from "@/components/marketing/sections/HeroSection";
import { ProblemSection } from "@/components/marketing/sections/ProblemSection";
import { ProductTourSection } from "@/components/marketing/sections/ProductTourSection";
import { PillarsSection } from "@/components/marketing/sections/PillarsSection";
import { DifferentiatorSection } from "@/components/marketing/sections/DifferentiatorSection";
import { FeatureGridSection } from "@/components/marketing/sections/FeatureGridSection";
import { HowItWorksSection } from "@/components/marketing/sections/HowItWorksSection";
import { WhiteLabelSection } from "@/components/marketing/sections/WhiteLabelSection";
import { PricingPreviewSection } from "@/components/marketing/sections/PricingPreviewSection";
import {
  FAQSection,
  FaqJsonLd,
  HOME_FAQS,
} from "@/components/marketing/sections/FAQSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";
import { NewsletterSection } from "@/components/marketing/sections/NewsletterSection";

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
        logo: "/Brandbees-sas-x512.png",
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
      <HeroSection cms={sf(sections, "hero")} />
      <ProblemSection cms={sf(sections, "problem")} />
      <ProductTourSection cms={sf(sections, "product_tour")} />
      <PillarsSection cms={sf(sections, "pillars")} />
      <DifferentiatorSection cms={sf(sections, "differentiator")} />
      <FeatureGridSection cms={sf(sections, "features")} />
      <HowItWorksSection cms={sf(sections, "how_it_works")} />
      <WhiteLabelSection cms={sf(sections, "white_label")} />
      <PricingPreviewSection cms={sf(sections, "pricing")} />
      <FinalCTASection cms={sf(sections, "cta_banner")} />
      <FAQSection cms={sf(sections, "faq")} />
      <NewsletterSection cms={sf(sections, "newsletter")} />
    </main>
  );
}
