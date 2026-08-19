import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandMark } from "@/components/marketing/BrandMark";
import { cmsField } from "@/lib/marketing/cms";

const LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "WordPress plugin", href: "/wordpress-plugin" },
    { label: "Security", href: "/trust" },
  ],
  Solutions: [
    { label: "For agencies", href: "/for/agencies" },
    { label: "For freelancers", href: "/for/freelancers" },
    { label: "Performance", href: "/features/performance-monitoring" },
    { label: "AI Agent", href: "/features/ai-agent" },
    { label: "Client reports", href: "/features/client-reports" },
    { label: "Backups", href: "/features/backups" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "BrandBees", href: "https://brandbees.net" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "GDPR", href: "/legal/gdpr" },
  ],
} as const;

export function MarketingFooter({
  cms = {},
}: {
  cms?: Record<string, string>;
}) {
  const c = cmsField(cms);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--mkt-inverse)] text-[var(--mkt-inverse-fg)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <BrandMark inverse className="mb-4" />
            <p className="mb-5 max-w-[240px] text-sm leading-relaxed text-white/55">
              {c(
                "tagline",
                "Monitor, fix, and report on every client WordPress site — automatically."
              )}
            </p>
            <a
              href="mailto:hello@brandbees.net"
              className="inline-flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-white/80"
            >
              <Mail size={12} />
              hello@brandbees.net
            </a>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  const external = link.href.startsWith("http");
                  const Comp = external ? "a" : Link;
                  return (
                    <li key={link.label}>
                      <Comp
                        href={link.href}
                        {...(external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Comp>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/35">
            {c(
              "copyright",
              `© ${year} Site Armor. All rights reserved.`
            )}
          </p>
          <p className="text-xs text-white/35">
            Built for agencies that maintain WordPress at scale.
          </p>
        </div>
      </div>
    </footer>
  );
}
