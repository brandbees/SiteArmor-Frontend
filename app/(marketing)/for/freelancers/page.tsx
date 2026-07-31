import { Layers, Palette, Zap, Clock } from "lucide-react";
import { buildSimplePage } from "@/components/marketing/SimpleMarketingPage";

const built = buildSimplePage({
  pageKey: "for-freelancers",
  path: "/for/freelancers",
  defaultTitle: "WordPress care plan tools for freelancers — SnapshotAI",
  defaultDescription:
    "Consolidate uptime, security, backups, and white-label reports — look bigger than a solo shop without six separate tools.",
  eyebrow: "For freelancers",
  title: "Look like a team. Operate with one dashboard.",
  description:
    "Care plans need proof and polish. SnapshotAI consolidates monitoring, safe updates, backups, and white-label reports so solo WordPress pros can deliver agency-grade retainers.",
  heroDetail:
    "Running care plans as a solo dev means juggling uptime monitors, security scanners, backup services, and spreadsheet reports. SnapshotAI replaces all of that with a single dashboard that monitors five pillars, automates reports under your brand, and starts at $0 for your first site.",
  stats: [
    { value: "$0", label: "Free for 1 site" },
    { value: "6-in-1", label: "Tools consolidated" },
    { value: "Your brand", label: "On every report" },
    { value: "30 sec", label: "Setup for URL tier" },
  ],
  beats: [
    {
      title: "Tool consolidation",
      body: "Performance, SEO, security, malware, uptime, backups, and reports — one subscription instead of six. Fewer bills, fewer logins.",
      icon: Layers,
    },
    {
      title: "White-label presence",
      body: "Your logo and colours on every PDF and portal. Clients see a professional agency brand, not a random SaaS tool.",
      icon: Palette,
    },
    {
      title: "Start free, grow on demand",
      body: "Monitor one site on Free forever. Move to Starter for 10 sites as your care-plan book grows. Upgrade without migration.",
      icon: Zap,
    },
    {
      title: "Hours back each month",
      body: "Automated audits and scheduled reports replace manual checklists and copy-paste Word docs. Spend time on client work, not admin.",
      icon: Clock,
    },
  ],
  snapshots: ["sites", "reports", "site-dash"],
});

export const generateMetadata = built.generateMetadata;
export default built.Page;
