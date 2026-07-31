import { BarChart3, Users, FileText, Bot } from "lucide-react";
import { buildSimplePage } from "@/components/marketing/SimpleMarketingPage";

const built = buildSimplePage({
  pageKey: "for-agencies",
  path: "/for/agencies",
  defaultTitle: "WordPress management for agencies — SnapshotAI",
  defaultDescription:
    "Portfolio health, AI remediation, and white-label reports built for agencies managing 5–200 client WordPress sites.",
  eyebrow: "For agencies",
  title: "Margin per retained client starts with knowing first.",
  description:
    "Stop burning billable hours on manual audits. SnapshotAI monitors the portfolio, helps you fix issues with AI, and proves the retainer every month — under your brand.",
  heroDetail:
    "An agency's nightmare is the client calling about a problem first. SnapshotAI flips that: you know first, the AI agent often has already fixed it with your confirmation, and the monthly white-label report proves the retainer is earning its keep. Built for portfolios of 5 to 500 WordPress sites.",
  stats: [
    { value: "5–500", label: "Client sites per agency" },
    { value: "5", label: "Health pillars scored" },
    { value: "Auto", label: "White-label PDF reports" },
    { value: "14-day", label: "Free trial, no card" },
  ],
  beats: [
    {
      title: "Portfolio visibility",
      body: "One health score per site across five pillars, with rollups and trend history so you can see which sites need attention — at a glance.",
      icon: BarChart3,
    },
    {
      title: "Team scale",
      body: "Invite owners, admins, managers, and analysts with role-based permissions. Analysts see scores; admins configure white-label settings.",
      icon: Users,
    },
    {
      title: "Client-ready proof",
      body: "Scheduled white-label PDFs with AI narratives and a branded client portal so retainers feel tangible. Your logo, your colours, your name.",
      icon: FileText,
    },
    {
      title: "Remediation, not just alerts",
      body: "The AI agent investigates over SSH, applies server-level fixes with your confirmation, re-measures, and rolls back if needed. Ask it anything.",
      icon: Bot,
    },
  ],
  snapshots: ["dash", "agent", "reports"],
});

export const generateMetadata = built.generateMetadata;
export default built.Page;
