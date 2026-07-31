import { Lock, CheckCheck, FileSearch, ShieldCheck } from "lucide-react";
import { buildSimplePage } from "@/components/marketing/SimpleMarketingPage";

const built = buildSimplePage({
  pageKey: "security",
  path: "/trust",
  defaultTitle: "Security & trust — SnapshotAI credential vault",
  defaultDescription:
    "Encrypted SSH vault, confirmation-before-write, audit logging, backup-before-change, RBAC, and GDPR posture.",
  eyebrow: "Security & trust",
  title: "Credentials stay vaulted. Writes stay confirmed.",
  description:
    "Agencies close deals when they trust how we handle SSH and client data. This page is for that conversation.",
  heroDetail:
    "SnapshotAI stores SSH credentials in an encrypted vault — never in plaintext, never exposed to the AI model. Master-key rotation, vault anomaly detection, and a dedicated vault audit log run behind every connection. Every destructive AI agent operation shows a preview and waits for your confirmation before writing.",
  stats: [
    { value: "AES-256", label: "Vault encryption" },
    { value: "100%", label: "Ops audit-logged" },
    { value: "1-click", label: "Rollback" },
    { value: "RBAC", label: "Team access control" },
  ],
  beats: [
    {
      title: "Encrypted credential vault",
      body: "SSH credentials are stored with AES-256 encryption. Master keys rotate on schedule. Vault anomaly detection alerts on unexpected access patterns.",
      icon: Lock,
    },
    {
      title: "Confirmation before every write",
      body: "Destructive operations show a preview of the write. You confirm before anything is applied. A snapshot is taken before changes so everything can be rolled back.",
      icon: CheckCheck,
    },
    {
      title: "Full audit trail",
      body: "Every SSH operation is logged with the actor, the command, and the result. The vault itself has a dedicated audit log separate from agent activity.",
      icon: FileSearch,
    },
    {
      title: "Access control & compliance",
      body: "Role-based access (owner, admin, manager, analyst) throughout. Email verification, password reset, Cloudflare Turnstile on public forms. GDPR-aligned data handling.",
      icon: ShieldCheck,
    },
  ],
  snapshots: ["security", "settings", "agent"],
});

export const generateMetadata = built.generateMetadata;
export default built.Page;
