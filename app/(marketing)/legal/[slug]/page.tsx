import type { Metadata } from "next";
import { Container, Section } from "@/components/marketing/ui/Section";

type LegalSection = { heading: string; paragraphs: string[] };

type LegalPageDef = {
  title: string;
  summary: string;
  effective: string;
  sections: LegalSection[];
};

const PAGES: Record<string, LegalPageDef> = {
  privacy: {
    title: "Privacy Policy",
    summary:
      "How Site Armor by BrandBees collects, uses, stores, and protects personal data, including Google Analytics and Search Console data when you connect Google.",
    effective: "October 13, 2026",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          "Site Armor is a WordPress monitoring and remediation product operated by BrandBees (“BrandBees,” “we,” “us,” or “our”). This Privacy Policy explains how we process personal data when you visit https://www.sitearmor.io, use the Site Armor application, or connect third-party services such as Google.",
          "Contact for privacy questions: hello@brandbees.net.",
        ],
      },
      {
        heading: "2. Scope",
        paragraphs: [
          "This policy applies to agency and freelancer customers who create Site Armor accounts, users invited to an agency workspace, visitors to our marketing site, and end clients who view white-label client portals when an agency shares a portal link.",
          "It does not replace privacy notices your agency may owe to its own website visitors or end clients for those clients’ WordPress sites.",
        ],
      },
      {
        heading: "3. Data we collect",
        paragraphs: [
          "Account and profile data: name, email address, password or authentication identifiers, agency/workspace details, billing and plan information, and support communications.",
          "Site and service data: WordPress site URLs you add, audit and monitoring results (performance, SEO, security, malware, uptime, backups, reports), plugin/connection status, and configuration you set in Site Armor.",
          "Technical and usage data: IP address, device/browser type, approximate location derived from IP, log data, cookies and similar technologies needed to run the service, and product usage events.",
          "Credentials you choose to store: optional vaulted credentials (for example SSH or Cloudflare API tokens) are encrypted at rest and used only to perform the features you enable. We do not use vaulted secrets for advertising.",
          "Google account data (only if you connect Google): see Section 5.",
        ],
      },
      {
        heading: "4. How we use data",
        paragraphs: [
          "We use personal and service data to provide, secure, and improve Site Armor: account authentication, site monitoring and remediation workflows, alerts, backups, AI-assisted analysis and reports you request, customer support, billing, fraud and abuse prevention, and legal compliance.",
          "We do not sell personal data. We do not use Google user data for advertising, or for independent personalized advertising of any kind.",
        ],
      },
      {
        heading: "5. Google Analytics and Search Console (Connect Google)",
        paragraphs: [
          "If you choose “Connect Google” in Site Armor, we request OAuth access with read-only scopes so we can display analytics and search performance for sites you manage: Google Analytics (GA4) property metadata and metrics, and Google Search Console property metadata and search analytics. We do not request write access to modify your Google Analytics or Search Console settings through this connection.",
          "When you connect, Google may share with us identifiers needed for OAuth (such as tokens), the Google account email associated with the grant, lists of GA4 and Search Console properties you can access, the property you select in Site Armor, and metric/report data we retrieve to power dashboards, SEO tools, and reports inside Site Armor.",
          "We store OAuth tokens and selected property identifiers securely and use them only to retrieve and display that data for your workspace, refresh access as needed, and operate related Site Armor features you enable. You can disconnect Google in Site Armor; after disconnect we stop new Google API calls for that site/connection and remove or invalidate stored Google tokens associated with it according to our retention practices.",
          "Google user data Limited Use: Site Armor’s use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. We do not sell Google user data; we do not use it for advertising; and we do not allow humans to read Google user data except with your consent, for security/compliance investigation, or where required by law—and then only as permitted by Google’s policies.",
        ],
      },
      {
        heading: "6. Sharing and processors",
        paragraphs: [
          "We share data with service providers that help us host and operate Site Armor (for example cloud hosting, email delivery, error monitoring, and payment processors), under contracts that limit use to providing services to us.",
          "We may disclose data if required by law, to protect rights and safety, or in connection with a merger, acquisition, or asset sale, subject to appropriate safeguards.",
          "Agencies control what their invited users and client-portal recipients can see. Client portals expose site health and report content the agency chooses to share; they do not expose Google OAuth tokens.",
        ],
      },
      {
        heading: "7. Retention",
        paragraphs: [
          "We retain account and site data for as long as your account remains active and as needed to provide the service, resolve disputes, enforce agreements, and meet legal obligations. Monitoring history, backups, and logs may be retained according to your plan and our operational retention windows.",
          "Google OAuth tokens and connected analytics identifiers are retained while the Google connection remains active and are removed or invalidated when you disconnect or when the related site/account is deleted, subject to short-lived backups and security logs.",
        ],
      },
      {
        heading: "8. Security",
        paragraphs: [
          "We use administrative, technical, and organizational measures appropriate to the risk, including encryption in transit (TLS), encryption of sensitive secrets at rest where applicable, access controls, and audit logging for privileged operations. No method of transmission or storage is 100% secure; please use strong passwords and protect access to your agency workspace.",
        ],
      },
      {
        heading: "9. International transfers",
        paragraphs: [
          "Site Armor may be hosted and processed in countries other than where you are located. Where required, we use appropriate safeguards for cross-border transfers of personal data.",
        ],
      },
      {
        heading: "10. Your rights",
        paragraphs: [
          "Depending on your location, you may have rights to access, correct, delete, or export personal data, to object to or restrict certain processing, and to withdraw consent where processing is consent-based (including disconnecting Google). To exercise rights, email hello@brandbees.net. You may also lodge a complaint with your local supervisory authority.",
          "You can update account details in the product, remove sites, disconnect Google, and request account deletion by contacting support.",
        ],
      },
      {
        heading: "11. Children",
        paragraphs: [
          "Site Armor is a business service and is not directed to children under 16. We do not knowingly collect personal data from children.",
        ],
      },
      {
        heading: "12. Changes",
        paragraphs: [
          "We may update this Privacy Policy from time to time. We will post the updated version at https://www.sitearmor.io/legal/privacy and change the effective date. Material changes may also be communicated through the product or by email where appropriate.",
        ],
      },
      {
        heading: "13. Contact",
        paragraphs: [
          "BrandBees — Site Armor privacy inquiries: hello@brandbees.net. Website: https://www.sitearmor.io.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    summary: "Terms that govern use of the Site Armor service operated by BrandBees.",
    effective: "October 13, 2026",
    sections: [
      {
        heading: "1. Agreement",
        paragraphs: [
          "By accessing or using Site Armor (https://www.sitearmor.io and related applications), you agree to these Terms of Service with BrandBees (“BrandBees,” “we,” “us”). If you use Site Armor on behalf of an organization, you represent that you have authority to bind that organization.",
        ],
      },
      {
        heading: "2. The service",
        paragraphs: [
          "Site Armor provides WordPress monitoring, reporting, and related remediation features for agencies and professionals. Features available to you depend on your plan and the access tier you configure for each site (for example URL-only, plugin, or SSH).",
          "Optional integrations (including Google Analytics / Search Console, Cloudflare, or other third-party APIs) are provided so you can connect accounts you control. Your use of those third-party services remains subject to their terms and policies.",
        ],
      },
      {
        heading: "3. Accounts and acceptable use",
        paragraphs: [
          "You must provide accurate account information and keep credentials secure. You are responsible for activity under your workspace, including actions by invited users.",
          "You may only monitor and remediate sites and Google properties you are authorized to manage. You must not misuse the service, attempt unauthorized access, interfere with other customers, or use Site Armor to violate law or third-party rights.",
        ],
      },
      {
        heading: "4. Customer content and sites",
        paragraphs: [
          "You retain rights to your content and site data. You grant BrandBees a limited license to host, process, and display that data as needed to operate Site Armor features you use (including AI-assisted analysis and reports you request).",
          "Remediation and write actions that can change a site generally require your confirmation in-product where designed to do so. You remain responsible for reviewing proposed changes and for backups appropriate to your risk tolerance.",
        ],
      },
      {
        heading: "5. Plans, trials, and billing",
        paragraphs: [
          "Paid plans, free tiers, trials, usage allowances (such as AI tokens or storage), and overages are described in the product and pricing pages. Fees are non-refundable except where required by law or expressly stated otherwise. We may change plans with notice for renewing subscriptions.",
        ],
      },
      {
        heading: "6. Intellectual property",
        paragraphs: [
          "Site Armor software, branding, and documentation are owned by BrandBees or its licensors. Except for the limited rights to use the service under your plan, no IP rights are transferred to you.",
        ],
      },
      {
        heading: "7. Disclaimers",
        paragraphs: [
          "The service is provided “as is” and “as available.” Monitoring, malware detection, uptime checks, and AI suggestions improve visibility and workflows but do not guarantee that every issue will be detected or prevented, or that remediation will always succeed. Third-party platforms (hosts, Google, Cloudflare, WordPress plugins) may change or fail outside our control.",
        ],
      },
      {
        heading: "8. Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, BrandBees is not liable for indirect, incidental, special, consequential, or lost-profit damages, or for loss of data, goodwill, or business interruption. Our aggregate liability arising from the service is limited to the fees you paid to BrandBees for Site Armor in the three months before the claim.",
        ],
      },
      {
        heading: "9. Suspension and termination",
        paragraphs: [
          "You may stop using Site Armor and request account closure. We may suspend or terminate access for non-payment, abuse, legal risk, or material breach. Provisions that should survive (including IP, disclaimers, and liability limits) survive termination.",
        ],
      },
      {
        heading: "10. Changes",
        paragraphs: [
          "We may update these Terms by posting a revised version at https://www.sitearmor.io/legal/terms. Continued use after the effective date constitutes acceptance of the updated Terms.",
        ],
      },
      {
        heading: "11. Contact",
        paragraphs: [
          "Questions: hello@brandbees.net.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    summary: "How Site Armor uses cookies and similar technologies.",
    effective: "October 13, 2026",
    sections: [
      {
        heading: "1. What we use",
        paragraphs: [
          "We use essential cookies and similar storage for authentication, security, load balancing, and remembering preferences (such as theme). These are required to operate the product.",
          "We may use limited analytics or performance cookies on the marketing site or app to understand usage and improve Site Armor. Where required by law, non-essential cookies are used only with consent.",
        ],
      },
      {
        heading: "2. Managing cookies",
        paragraphs: [
          "You can control cookies through your browser settings. Blocking essential cookies may prevent login or core features from working. For questions, contact hello@brandbees.net.",
        ],
      },
    ],
  },
  gdpr: {
    title: "GDPR",
    summary: "How BrandBees approaches GDPR-aligned processing for Site Armor.",
    effective: "October 13, 2026",
    sections: [
      {
        heading: "1. Roles",
        paragraphs: [
          "For customer account data, BrandBees typically acts as a controller. For content and site-related data customers upload or connect (including monitoring results derived from customer sites, and Google Analytics / Search Console data retrieved on the customer’s instruction), BrandBees typically acts as a processor on behalf of the customer agency.",
        ],
      },
      {
        heading: "2. Legal bases and requests",
        paragraphs: [
          "We process personal data based on contract performance, legitimate interests in operating a secure B2B service, legal obligations, and consent where required (for example certain cookies or optional integrations).",
          "To exercise data subject rights, request a DPA, or ask about subprocessors, email hello@brandbees.net. See also our Privacy Policy at https://www.sitearmor.io/legal/privacy.",
        ],
      },
    ],
  },
};

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
    description: page.summary.slice(0, 155),
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
      <Section className="pt-28 sm:pt-32 pb-20">
        <Container>
          <article className="mx-auto max-w-2xl">
            <h1 className="font-[family-name:var(--font-marketing-display)] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[var(--mkt-fg)] sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--mkt-muted)]">
              Effective date: {page.effective}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--mkt-muted)]">
              {page.summary}
            </p>

            <div className="mt-10 space-y-10">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-[family-name:var(--font-marketing-display)] text-xl font-bold text-[var(--mkt-fg)]">
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((p) => (
                      <p
                        key={p.slice(0, 48)}
                        className="text-base leading-relaxed text-[var(--mkt-muted)]"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-12 text-sm text-[var(--mkt-muted)]">
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
