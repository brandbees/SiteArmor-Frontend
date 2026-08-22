import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  ListTodo,
  TrendingUp,
  Shield,
  Zap,
  Bug,
  Wifi,
  Plug,
  HardDrive,
  ShoppingCart,
  CalendarClock,
  HeartPulse,
  Cloud,
  FileText,
  Activity,
  Settings,
  Wrench,
  Monitor,
  Bot,
} from "lucide-react";

export type SiteTab =
  | "overview"
  | "issues"
  | "seo"
  | "security"
  | "performance"
  | "malware"
  | "uptime"
  | "plugins"
  | "backups"
  | "woocommerce"
  | "cron"
  | "health"
  | "agent";

export type SiteNavLeaf = {
  id: string;
  label: string;
  icon: LucideIcon;
  tab?: SiteTab;
  /** External path template — use {siteId} */
  href?: string;
  badgeFrom?: "plugins";
};

export type SiteNavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: SiteNavLeaf[];
};

/** MalCare-style grouped site navigation */
export const SITE_NAV_GROUPS: SiteNavGroup[] = [
  {
    id: "manage",
    label: "Manage",
    icon: Wrench,
    defaultOpen: true,
    items: [
      { id: "plugins", label: "Plugins", tab: "plugins", icon: Plug, badgeFrom: "plugins" },
      { id: "seo", label: "SEO", tab: "seo", icon: TrendingUp },
      { id: "issues", label: "Issues", tab: "issues", icon: ListTodo },
      { id: "health", label: "Site Health", tab: "health", icon: HeartPulse },
    ],
  },
  {
    id: "backups",
    label: "Backups",
    icon: Cloud,
    defaultOpen: false,
    items: [
      { id: "backup-details", label: "Backup Details", tab: "backups", icon: HardDrive },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    defaultOpen: false,
    items: [
      { id: "security", label: "Security", tab: "security", icon: Shield },
      { id: "malware", label: "Malware Scan", tab: "malware", icon: Bug },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: Zap,
    defaultOpen: false,
    items: [{ id: "performance", label: "Performance", tab: "performance", icon: Zap }],
  },
  {
    id: "agent",
    label: "AI Agent",
    icon: Bot,
    defaultOpen: false,
    items: [{ id: "agent", label: "AI Agent", tab: "agent", icon: Bot }],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Monitor,
    defaultOpen: false,
    items: [
      { id: "uptime", label: "Uptime", tab: "uptime", icon: Wifi },
      { id: "cron", label: "Cron Events", tab: "cron", icon: CalendarClock },
    ],
  },
  {
    id: "reports",
    label: "Site Reports",
    icon: FileText,
    defaultOpen: false,
    items: [
      { id: "reports", label: "Reports History", href: "/reports/{siteId}", icon: FileText },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: ShoppingCart,
    defaultOpen: false,
    items: [
      { id: "woocommerce", label: "WooCommerce", tab: "woocommerce", icon: ShoppingCart },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: Activity,
    defaultOpen: false,
    items: [
      { id: "settings", label: "Activity Log", href: "/settings/activity", icon: Settings },
    ],
  },
];

export const SITE_TAB_LABELS: Record<SiteTab, string> = {
  overview: "Overview",
  issues: "Issues",
  seo: "SEO",
  security: "Security",
  performance: "Performance",
  malware: "Malware Scan",
  uptime: "Uptime",
  plugins: "Plugins",
  backups: "Backup Details",
  woocommerce: "WooCommerce",
  cron: "Cron Events",
  health: "Site Health",
  agent: "AI Agent",
};

export function siteTabHref(siteId: string, tab: SiteTab) {
  return tab === "overview" ? `/sites/${siteId}` : `/sites/${siteId}?tab=${tab}`;
}

export function resolveSiteNavHref(siteId: string, item: SiteNavLeaf): string {
  if (item.tab) return siteTabHref(siteId, item.tab);
  if (item.href) return item.href.replace("{siteId}", siteId);
  return `/sites/${siteId}`;
}

export function parseSiteTab(raw: string | null): SiteTab {
  const valid: SiteTab[] = [
    "overview",
    "issues",
    "seo",
    "security",
    "performance",
    "malware",
    "uptime",
    "plugins",
    "backups",
    "woocommerce",
    "cron",
    "health",
    "agent",
  ];
  return valid.includes(raw as SiteTab) ? (raw as SiteTab) : "overview";
}

export function isNavItemActive(activeTab: SiteTab, item: SiteNavLeaf, pathname: string, siteId: string): boolean {
  if (item.tab) return activeTab === item.tab;
  if (item.href) {
    const resolved = resolveSiteNavHref(siteId, item);
    return pathname === resolved || pathname.startsWith(resolved.split("?")[0]);
  }
  return false;
}

export function getSiteTabIcon(key: SiteTab): LucideIcon {
  const map: Record<SiteTab, LucideIcon> = {
    overview: LayoutGrid,
    issues: ListTodo,
    seo: TrendingUp,
    security: Shield,
    performance: Zap,
    malware: Bug,
    uptime: Wifi,
    plugins: Plug,
    backups: HardDrive,
    woocommerce: ShoppingCart,
    cron: CalendarClock,
    health: HeartPulse,
    agent: Bot,
  };
  return map[key];
}
