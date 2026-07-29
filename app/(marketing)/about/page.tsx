import { Users, Wrench, Palette, MessageSquare } from "lucide-react";
import { buildSimplePage } from "@/components/marketing/SimpleMarketingPage";

const built = buildSimplePage({
  pageKey: "about",
  path: "/about",
  defaultTitle: "About SnapshotAI by BrandBees",
  defaultDescription:
    "SnapshotAI is BrandBees' AI-powered WordPress operations platform for agencies — monitor, fix, and report under your brand.",
  eyebrow: "About BrandBees",
  title: "Built by an agency, for agencies.",
  description:
    "SnapshotAI exists because monitoring alone isn't enough. Agencies need remediation, proof, and white-label delivery — in one operations layer that scales.",
  heroDetail:
    "BrandBees is a digital agency and product team that lives in the same retainers and care plans our customers run. We built SnapshotAI because we needed it ourselves — a single platform that monitors five health pillars, uses AI to remediate with confirmation, and delivers branded reports that prove the retainer.",
  stats: [
    { value: "5", label: "Health pillars" },
    { value: "35+", label: "AI agent tools" },
    { value: "14", label: "Feature modules" },
    { value: "4", label: "Plan tiers" },
  ],
  beats: [
    {
      title: "Agency DNA",
      body: "We're a digital agency and product team that lives in the same retainers and care plans our customers run every day.",
      icon: Users,
    },
    {
      title: "Monitor + remediate",
      body: "The commercial distinction: we don't stop at alerts. The AI agent investigates, fixes, re-measures — with confirmation and rollback.",
      icon: Wrench,
    },
    {
      title: "White-label delivery",
      body: "Reports, portals, and dashboards carry your agency brand. SnapshotAI stays invisible to the end client.",
      icon: Palette,
    },
    {
      title: "Talk to us",
      body: "Questions about fit, security, or rollout? Reach us via hello@brandbees.net — no sales pitch, just answers.",
      icon: MessageSquare,
    },
  ],
});

export const generateMetadata = built.generateMetadata;
export default built.Page;
