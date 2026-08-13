import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  FileText,
  Gauge,
  HardDrive,
  Link2,
  Package,
  Palette,
  Search,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Users,
  Zap,
} from "lucide-react";

export interface FeaturePageMeta {
  slug: string;
  href: string;
  title: string;
  shortTitle: string;
  description: string;
  pillar:
    | "performance"
    | "seo"
    | "security"
    | "malware"
    | "uptime"
    | "operations"
    | "ai"
    | "reporting";
  icon: LucideIcon;
}

export const FEATURE_PAGES: FeaturePageMeta[] = [
  {
    slug: "performance-monitoring",
    href: "/features/performance-monitoring",
    title: "Performance monitoring",
    shortTitle: "Performance",
    description:
      "Core Web Vitals and Lighthouse on every site — with AI Optimize that can fix regressions and roll back safely.",
    pillar: "performance",
    icon: Gauge,
  },
  {
    slug: "seo-monitoring",
    href: "/features/seo-monitoring",
    title: "SEO monitoring",
    shortTitle: "SEO",
    description:
      "Catch meta, heading, canonical, and indexability issues before they cost rankings — across the whole portfolio.",
    pillar: "seo",
    icon: Search,
  },
  {
    slug: "security-scanning",
    href: "/features/security-scanning",
    title: "Security scanning",
    shortTitle: "Security",
    description:
      "XML-RPC, login URL exposure, file permissions, SSL, and admin hygiene — checked continuously.",
    pillar: "security",
    icon: Shield,
  },
  {
    slug: "malware-detection",
    href: "/features/malware-detection",
    title: "Malware detection",
    shortTitle: "Malware",
    description:
      "File-integrity checks, injected-code detection, database threats, and Safe Browsing lookups.",
    pillar: "malware",
    icon: ShieldAlert,
  },
  {
    slug: "uptime-monitoring",
    href: "/features/uptime-monitoring",
    title: "Uptime monitoring",
    shortTitle: "Uptime",
    description:
      "Continuous availability pings, response-time tracking, and downtime incident history.",
    pillar: "uptime",
    icon: Activity,
  },
  {
    slug: "ai-agent",
    href: "/features/ai-agent",
    title: "AI agent",
    shortTitle: "AI Agent",
    description:
      "Investigate and remediate with real tools — it asks before it writes, and remembers what failed on each site.",
    pillar: "ai",
    icon: Bot,
  },
  {
    slug: "client-reports",
    href: "/features/client-reports",
    title: "AI client reports",
    shortTitle: "Reports",
    description:
      "AI-written PDF reports with score breakdowns, trends, and plain-English narratives.",
    pillar: "reporting",
    icon: FileText,
  },
  {
    slug: "white-label",
    href: "/features/white-label",
    title: "White-label branding",
    shortTitle: "White-label",
    description:
      "Your logo, colours, and name on every report and portal. Site Armor stays invisible.",
    pillar: "reporting",
    icon: Palette,
  },
  {
    slug: "client-portal",
    href: "/features/client-portal",
    title: "Client portal",
    shortTitle: "Client portal",
    description:
      "Branded, tokenized portal URLs so clients can view their own site health without friction.",
    pillar: "reporting",
    icon: Users,
  },
  {
    slug: "backups",
    href: "/features/backups",
    title: "Automated backups",
    shortTitle: "Backups",
    description:
      "Database, files, or full-site backups on a schedule — with one-click restore.",
    pillar: "operations",
    icon: HardDrive,
  },
  {
    slug: "plugin-updates",
    href: "/features/plugin-updates",
    title: "Safe plugin updates",
    shortTitle: "Updates",
    description:
      "Update from the dashboard with a pre-update snapshot and instant rollback if anything breaks.",
    pillar: "operations",
    icon: Package,
  },
  {
    slug: "broken-link-checker",
    href: "/features/broken-link-checker",
    title: "Broken link checker",
    shortTitle: "Broken links",
    description:
      "Weekly crawls that catch 404s and dead links before they hurt SEO.",
    pillar: "operations",
    icon: Link2,
  },
  {
    slug: "woocommerce-monitoring",
    href: "/features/woocommerce-monitoring",
    title: "WooCommerce monitoring",
    shortTitle: "WooCommerce",
    description:
      "Orders, revenue trends, failed payments, and average order value per store.",
    pillar: "operations",
    icon: ShoppingCart,
  },
];

export const HOME_FEATURE_GRID = FEATURE_PAGES;

export const PILLARS = [
  {
    key: "performance",
    label: "Performance",
    weight: "25%",
    desc: "Core Web Vitals, Lighthouse, page weight, server response.",
    icon: Gauge,
  },
  {
    key: "seo",
    label: "SEO",
    weight: "25%",
    desc: "Meta, headings, canonicals, indexability, broken links.",
    icon: Search,
  },
  {
    key: "security",
    label: "Security",
    weight: "20%",
    desc: "Hardening gaps, SSL, permissions, admin hygiene.",
    icon: Shield,
  },
  {
    key: "malware",
    label: "Malware",
    weight: "20%",
    desc: "Integrity checks, injected code, CVE cross-reference.",
    icon: ShieldAlert,
  },
  {
    key: "uptime",
    label: "Uptime",
    weight: "10%",
    desc: "Availability pings, response time, incident log.",
    icon: Activity,
  },
] as const;

export const CONNECTION_TIERS = [
  {
    step: "01",
    title: "URL only",
    time: "30 seconds",
    desc: "Add a site by URL. External scanning starts immediately — performance, SEO, uptime, SSL, broken links, and public-surface security.",
    icon: Zap,
  },
  {
    step: "02",
    title: "WordPress plugin",
    time: "2 minutes",
    desc: "Install Site Armor to unlock plugin/theme inventory, file integrity, malware scans, WooCommerce metrics, backups, and safe updates.",
    icon: Package,
  },
  {
    step: "03",
    title: "SSH credentials",
    time: "When you're ready",
    desc: "Vaulted SSH unlocks the autonomous AI agent — real file access, server-level fixes, hardening, and malware cleanup with backup-before-write.",
    icon: Bot,
  },
] as const;
