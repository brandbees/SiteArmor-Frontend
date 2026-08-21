"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const authInputClass =
  "w-full rounded-[4px] border border-border bg-[#f7f9fc] px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.12)]";

export const authLabelClass =
  "mb-1.5 block text-[12px] font-semibold text-foreground";

type AuthVariant = "login" | "register" | "forgot" | "reset";

const PANEL: Record<
  AuthVariant,
  {
    eyebrow: string;
    title: string;
    stats: { icon: ReactNode; label: string; value: string; sub: string }[];
  }
> = {
  login: {
    eyebrow: "WordPress care, on autopilot",
    title: "Monitor, secure & fix every site you manage.",
    stats: [
      {
        icon: <Shield size={16} />,
        label: "Security",
        value: "24/7",
        sub: "Malware & uptime watch",
      },
      {
        icon: <Zap size={16} />,
        label: "Performance",
        value: "PSI",
        sub: "Scores that stay sharp",
      },
      {
        icon: <Activity size={16} />,
        label: "Agency ops",
        value: "1 hub",
        sub: "Clients, sites, reports",
      },
    ],
  },
  register: {
    eyebrow: "Built for agencies & owners",
    title: "Start protecting WordPress sites in minutes.",
    stats: [
      {
        icon: <Shield size={16} />,
        label: "Audits",
        value: "4-in-1",
        sub: "Perf · SEO · Security · Malware",
      },
      {
        icon: <Zap size={16} />,
        label: "Safe updates",
        value: "Auto",
        sub: "Rollback when health dips",
      },
      {
        icon: <Activity size={16} />,
        label: "Client portals",
        value: "White-label",
        sub: "Your brand, your reports",
      },
    ],
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "We'll get you back into your dashboard safely.",
    stats: [
      {
        icon: <Shield size={16} />,
        label: "Secure link",
        value: "1 hr",
        sub: "Single-use reset token",
      },
      {
        icon: <Zap size={16} />,
        label: "Fast",
        value: "Inbox",
        sub: "Usually arrives in seconds",
      },
      {
        icon: <Activity size={16} />,
        label: "Privacy",
        value: "Quiet",
        sub: "No account enumeration",
      },
    ],
  },
  reset: {
    eyebrow: "New credentials",
    title: "Choose a strong password and you're back in.",
    stats: [
      {
        icon: <Shield size={16} />,
        label: "Strength",
        value: "8+",
        sub: "Chars with mix recommended",
      },
      {
        icon: <Zap size={16} />,
        label: "Sessions",
        value: "Fresh",
        sub: "Sign in after reset",
      },
      {
        icon: <Activity size={16} />,
        label: "Support",
        value: "Ready",
        sub: "Help if the link expired",
      },
    ],
  },
};

export function AuthShell({
  variant,
  brandName = "Site Armor",
  logoUrl,
  title,
  subtitle,
  children,
  footer,
}: {
  variant: AuthVariant;
  brandName?: string;
  logoUrl?: string | null;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panel = PANEL[variant];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Form column */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-[46%] lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-9 w-auto object-contain" />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/site-armor-icon.png"
                  alt=""
                  className="h-9 w-9 object-contain"
                />
                <span className="font-portal-display text-[1.15rem] font-bold tracking-tight text-foreground">
                  {brandName}
                </span>
              </>
            )}
          </Link>

          <h1 className="font-portal-display text-[1.75rem] font-bold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </div>

      {/* Proof / atmosphere column */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:w-[54%] lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16"
        style={{
          background:
            "radial-gradient(120% 80% at 10% 0%, #dbe7ff 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, #e8eef8 0%, transparent 50%), linear-gradient(160deg, #f4f7fc 0%, #eef3fb 45%, #e8eef8 100%)",
        }}
      >
        {/* Soft grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(26 86 219 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(26 86 219 / 0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold text-accent">{panel.eyebrow}</p>
          <p className="mt-3 font-portal-display text-3xl font-bold leading-snug tracking-tight text-[#0f1d35] xl:text-4xl">
            {panel.title}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {panel.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[4px] border border-white/80 bg-white/90 p-4 shadow-[0_8px_24px_-12px_rgb(15_29_53/0.18)] backdrop-blur-sm"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[4px] bg-accent-light text-accent">
                {s.icon}
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-portal-display text-xl font-bold tabular-nums text-accent">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Decorative rings */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full border border-accent/15"
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-24 h-48 w-48 rounded-full border border-accent/10"
        />
      </aside>
    </div>
  );
}
