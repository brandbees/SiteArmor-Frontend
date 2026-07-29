import { Puzzle, Plug, Shield, Zap } from "lucide-react";
import { buildSimplePage } from "@/components/marketing/SimpleMarketingPage";

const built = buildSimplePage({
  pageKey: "wordpress-plugin",
  path: "/wordpress-plugin",
  defaultTitle: "BrandBees Snapshot WordPress plugin",
  defaultDescription:
    "Install brandbees-snapshot to unlock plugin/theme inventory, file integrity, malware scanning, WooCommerce metrics, backups, and safe updates.",
  eyebrow: "WordPress plugin",
  title: "brandbees-snapshot — deeper access in about two minutes.",
  description:
    "URL-only scanning works immediately. The official WordPress plugin unlocks inside-the-site data for malware, inventory, backups, and safe updates.",
  heroDetail:
    "The brandbees-snapshot plugin is lightweight and designed for agencies managing many client sites. It bridges SnapshotAI to the WordPress internals — plugin and theme versions, core version, file-integrity hashes, database scanning, WooCommerce metrics, real-user performance metrics, and safe plugin update capabilities.",
  stats: [
    { value: "~2 min", label: "Install time" },
    { value: "10+", label: "Data channels unlocked" },
    { value: "Safe", label: "Plugin update flow" },
    { value: "WooCommerce", label: "Metrics included" },
  ],
  beats: [
    {
      title: "What it unlocks",
      body: "Plugin/theme inventory and versions, core version, file-integrity scanning, malware scanning, WooCommerce metrics, real-user JS metrics, backups, and safe plugin updates.",
      icon: Puzzle,
    },
    {
      title: "Simple installation",
      body: "Install from the WordPress admin, then connect from the SnapshotAI dashboard. Designed for agencies managing many client sites in sequence.",
      icon: Plug,
    },
    {
      title: "Pairs with SSH",
      body: "The plugin covers inside-WordPress data. Vaulted SSH unlocks server-level AI agent remediation — reading logs, fixing configs, cleaning malware.",
      icon: Zap,
    },
    {
      title: "Security posture",
      body: "The plugin doesn't grant write access on its own. Destructive agent actions still require SSH + confirmation. Backups and rollback remain first-class.",
      icon: Shield,
    },
  ],
});

export const generateMetadata = built.generateMetadata;
export default built.Page;
