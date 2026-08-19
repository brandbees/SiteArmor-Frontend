"use client";

import { ArrowRight } from "lucide-react";
import { Container } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { ButtonLink } from "@/components/marketing/ui/ButtonLink";
import { cn } from "@/lib/utils";

export function InlineCTASection({
  title,
  subtitle,
  cta = "Start Free Trial",
  href = "/register",
  secondaryCta,
  secondaryHref,
  tone = "accent",
}: {
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  tone?: "accent" | "dark";
}) {
  return (
    <section
      className={cn(
        "py-12 sm:py-14",
        tone === "accent"
          ? "bg-accent"
          : "bg-[#0f1d35]"
      )}
    >
      <Container>
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h3 className="font-[family-name:var(--font-marketing-display)] text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1.5 text-sm text-white/70">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ButtonLink href={href} variant="inverse" size="md">
                {cta}
                <ArrowRight size={14} />
              </ButtonLink>
              {secondaryCta && secondaryHref && (
                <ButtonLink
                  href={secondaryHref}
                  variant="ghost"
                  size="md"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {secondaryCta}
                </ButtonLink>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
