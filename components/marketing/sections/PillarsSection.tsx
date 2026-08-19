"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui/Section";
import { Reveal } from "@/components/marketing/ui/Reveal";
import { PILLARS } from "@/lib/marketing/features";
import { SNAPSHOTS, type SnapshotId } from "@/lib/marketing/snapshots";
import { cmsField } from "@/lib/marketing/cms";

const PILLAR_SHOTS: {
  id: SnapshotId;
  href: string;
}[] = [
  { id: "perf", href: "/features/performance-monitoring" },
  { id: "seo", href: "/features/seo-monitoring" },
  { id: "security", href: "/features/security-scanning" },
];

export function PillarsSection({ cms = {} }: { cms?: Record<string, string> }) {
  const c = cmsField(cms);

  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            size="hero"
            eyebrow={c("eyebrow", "Five pillars · one score")}
            title={c(
              "title",
              "Portfolio health, scored the way agencies think."
            )}
            description={c(
              "description",
              "Every site gets an overall health score (0–100) — a weighted composite of Performance, SEO, Security, Malware, and Uptime."
            )}
          />
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.key} delay={0.05 * i}>
                <div className="group relative h-full overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-5 shadow-elevated-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-md">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent">
                      <Icon size={16} />
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--mkt-muted)]">
                      {pillar.weight}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--mkt-fg)]">
                    {pillar.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--mkt-muted)]">
                    {pillar.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--mkt-fg)]">
              See each pillar in the product
            </p>
            <Link
              href="/features"
              className="hidden text-sm font-semibold text-accent hover:text-accent-hover sm:inline"
            >
              All features →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLAR_SHOTS.map(({ id, href }) => {
              const snap = SNAPSHOTS[id];
              return (
                <Link
                  key={id}
                  href={href}
                  className="group overflow-hidden rounded-2xl bg-[var(--mkt-surface)] p-2 shadow-elevated-sm ring-1 ring-[var(--mkt-border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated-md hover:ring-accent/25"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[var(--mkt-bg-muted)]">
                    <Image
                      src={snap.src}
                      alt={snap.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mkt-surface)]/90 text-[var(--mkt-muted)] opacity-0 shadow-elevated-xs backdrop-blur transition-all group-hover:opacity-100 group-hover:text-accent">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--mkt-fg)]">
                        {snap.label}
                      </p>
                      <p className="text-xs text-[var(--mkt-muted)]">{snap.caption}</p>
                    </div>
                    <span className="text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      Explore
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
