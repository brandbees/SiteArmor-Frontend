/**
 * Single source of truth for marketing pricing.
 * Set PLAN_PRICES values to flip the entire site from placeholders to live numbers.
 * Add-on prices are confirmed and safe to display.
 */

export type PlanCode = "free" | "freemium" | "premium" | "agency_plus";
export type BillingPeriod = "monthly" | "annual";

/** Public display names → internal Stripe/plan codes */
export const PLAN_CODES = {
  Free: "free",
  Starter: "freemium",
  Growth: "premium",
  Agency: "agency_plus",
} as const satisfies Record<string, PlanCode>;

/**
 * Prices in USD. Keep null until announced — cards render "—" + note.
 * When ready: { monthly: 49, annual: 39 } etc.
 */
export const PLAN_PRICES: Record<
  PlanCode,
  { monthly: number | null; annual: number | null }
> = {
  free: { monthly: 0, annual: 0 },
  freemium: { monthly: null, annual: null },
  premium: { monthly: null, annual: null },
  agency_plus: { monthly: null, annual: null },
};

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  tagline: string;
  siteLimit: number;
  siteLimitLabel: string;
  aiTokens: number;
  storage: string;
  backups: boolean;
  backupRetention: string | null;
  highlight: boolean;
  badge: string | null;
  cta: string;
  ctaHref: string;
  features: string[];
}

export const PLANS: PlanDefinition[] = [
  {
    code: "free",
    name: "Free",
    tagline: "Try SnapshotAI on a single site.",
    siteLimit: 1,
    siteLimitLabel: "1 site",
    aiTokens: 1_000,
    storage: "100 MB",
    backups: false,
    backupRetention: null,
    highlight: false,
    badge: null,
    cta: "Start Free",
    ctaHref: "/register?plan=free",
    features: [
      "1 WordPress site",
      "1,000 AI tokens / month",
      "100 MB storage",
      "Performance, SEO, security & uptime scores",
      "Manual audits",
    ],
  },
  {
    code: "freemium",
    name: "Starter",
    tagline: "For freelancers running care plans.",
    siteLimit: 10,
    siteLimitLabel: "10 sites",
    aiTokens: 5_000,
    storage: "500 MB",
    backups: false,
    backupRetention: "7 days",
    highlight: false,
    badge: null,
    cta: "Start Free Trial",
    ctaHref: "/register?plan=freemium",
    features: [
      "Up to 10 sites",
      "5,000 AI tokens / month",
      "500 MB storage",
      "All five health pillars",
      "Scheduled audits",
      "AI-written client reports",
    ],
  },
  {
    code: "premium",
    name: "Growth",
    tagline: "For agencies that need proof at scale.",
    siteLimit: 50,
    siteLimitLabel: "50 sites",
    aiTokens: 20_000,
    storage: "1 GB",
    backups: true,
    backupRetention: "14 days",
    highlight: true,
    badge: "Most popular",
    cta: "Start 14-day Trial",
    ctaHref: "/register?plan=premium",
    features: [
      "Up to 50 sites",
      "20,000 AI tokens / month",
      "1 GB storage",
      "Automated backups (14-day retention)",
      "White-label reports & portal",
      "Safe plugin updates + AI agent",
    ],
  },
  {
    code: "agency_plus",
    name: "Agency",
    tagline: "Portfolio-scale operations, fully branded.",
    siteLimit: 9_999,
    siteLimitLabel: "9,999 sites",
    aiTokens: 100_000,
    storage: "5 GB",
    backups: true,
    backupRetention: "30 days",
    highlight: false,
    badge: null,
    cta: "Start 14-day Trial",
    ctaHref: "/register?plan=agency_plus",
    features: [
      "Up to 9,999 sites (effectively unlimited)",
      "100,000 AI tokens / month",
      "5 GB storage",
      "Automated backups (30-day retention)",
      "Full white-label + team roles",
      "Priority portfolio operations",
    ],
  },
];

export const ADDONS = {
  tokens: [
    { amount: "50k", price: 5 },
    { amount: "200k", price: 15 },
    { amount: "500k", price: 30 },
  ],
  storage: [
    { amount: "1 GB", price: 2 },
    { amount: "5 GB", price: 8 },
    { amount: "20 GB", price: 25 },
  ],
} as const;

export function formatPlanPrice(
  code: PlanCode,
  period: BillingPeriod
): { display: string; announced: boolean } {
  const value = PLAN_PRICES[code][period];
  if (code === "free") return { display: "$0", announced: true };
  if (value === null) return { display: "—", announced: false };
  return { display: `$${value}`, announced: true };
}
