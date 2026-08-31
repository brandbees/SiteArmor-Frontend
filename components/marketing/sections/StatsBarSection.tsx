"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/marketing/ui/Section";
import { CountUp } from "@/components/marketing/ui/Reveal";

const STATS = [
  { value: 5, suffix: "", label: "Health pillars", detail: "Performance · SEO · Security · Malware · Uptime" },
  { value: 30, suffix: "s", label: "URL-only setup", detail: "First audit without a plugin" },
  { value: 14, suffix: "", label: "Capabilities", detail: "Monitoring through white-label reports" },
  { value: 0, suffix: "", prefix: "$", label: "Free tier", detail: "One site" },
] as const;

export function StatsBarSection() {
  return (
    <section className="border-y border-[var(--mkt-border)] bg-[var(--mkt-surface)]">
      <Container className="max-w-7xl">
        <div className="grid grid-cols-2 divide-[var(--mkt-border)] md:grid-cols-4 md:divide-x">
          {STATS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.55,
                delay: 0.04 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="px-4 py-8 text-center sm:px-6 sm:py-10 md:py-12"
            >
              <p className="font-[family-name:var(--font-marketing-display)] text-4xl font-bold tracking-tight text-[var(--mkt-fg)] sm:text-5xl">
                <CountUp
                  value={item.value}
                  suffix={item.suffix}
                  prefix={"prefix" in item ? item.prefix : ""}
                />
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--mkt-fg)] sm:text-base">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-[var(--mkt-muted)] sm:text-sm">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
