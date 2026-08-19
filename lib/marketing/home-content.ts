/** MalCare-style homepage copy — big, scannable, benefit-led */

export const HOME_STATS = [
  { value: "5", label: "Health pillars", detail: "Performance · SEO · Security · Malware · Uptime" },
  { value: "30s", label: "URL-only setup", detail: "First audit without a plugin" },
  { value: "14", label: "Capabilities", detail: "Monitoring through white-label reports" },
  { value: "$0", label: "Free tier", detail: "One site, forever" },
] as const;

export const HOME_PROBLEMS = [
  {
    stat: "47%",
    title: "Clients find issues first",
    desc: "Agencies learn about downtime, malware, or SEO drops from the client — not the dashboard.",
  },
  {
    stat: "6+",
    title: "Tools per portfolio",
    desc: "Uptime, security, backups, reports, and performance each live in a separate login and bill.",
  },
  {
    stat: "0",
    title: "Proof the retainer works",
    desc: "Invisible maintenance until something breaks. Clients question the fee; you scramble for screenshots.",
  },
] as const;

export const HOME_PILLARS = [
  {
    num: "01",
    label: "Monitor",
    title: "Every site scored. Every pillar covered.",
    stat: "5 pillars",
    statDetail: "weighted into one health score",
    bullets: [
      "Continuous audits across performance, SEO, security, malware, and uptime",
      "Portfolio roll-up plus per-site drill-down with trend history",
      "Alerts when scores drop — email or Slack, your thresholds",
    ],
  },
  {
    num: "02",
    label: "Remediate",
    title: "An agent that fixes — after you confirm.",
    stat: "AI Agent",
    statDetail: "with backup-before-write",
    bullets: [
      "Ask in plain English; answers grounded in live audit data",
      "Proposes fixes — you confirm before anything destructive runs",
      "AI Optimize re-measures and rolls back if a change hurts the score",
    ],
  },
  {
    num: "03",
    label: "Report",
    title: "White-label proof the retainer earns its keep.",
    stat: "PDF + portal",
    statDetail: "your brand, not ours",
    bullets: [
      "AI-written client reports with scores, trends, and plain-English narratives",
      "Branded client portal on tokenized URLs — no client login friction",
      "Logo, colours, and display name on every touchpoint",
    ],
  },
  {
    num: "04",
    label: "Scale",
    title: "From one site to five hundred — same workflow.",
    stat: "3 tiers",
    statDetail: "URL · plugin · SSH",
    bullets: [
      "Add a site by URL in 30 seconds; plugin unlocks deeper data in ~2 minutes",
      "Vaulted SSH when you're ready for server-level remediation",
      "Plans that grow with your book — no migration, no re-onboarding",
    ],
  },
] as const;
