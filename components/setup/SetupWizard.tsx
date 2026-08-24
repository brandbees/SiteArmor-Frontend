"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SetupStepper({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex w-full items-start">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const lit = n <= step;
        return (
          <div key={n} className="flex grow items-center justify-center gap-1 pt-2">
            {n > 1 && <div className="h-0 w-full border-t border-zinc-200" />}
            <div
              className={cn(
                "flex items-center justify-center rounded-2xl p-1 transition-colors duration-300",
                lit ? "bg-accent/15" : "bg-zinc-50"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-xl text-xs font-semibold transition-colors duration-300",
                  lit ? "bg-accent text-white" : "bg-zinc-300 text-zinc-400"
                )}
              >
                {n}
              </div>
            </div>
            {n < total && <div className="h-0 w-full border-t border-zinc-200" />}
          </div>
        );
      })}
    </div>
  );
}

export function SetupHeadline({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h1 className="flex flex-col text-3xl leading-none xl:text-4xl">
      <span className="font-portal-display font-bold text-accent">{lead}</span>
      <span className="font-setup-accent italic text-accent-deep">{accent}</span>
    </h1>
  );
}

export function SetupWizard({
  step,
  total = 3,
  headline,
  accent,
  preview,
  footer,
  children,
}: {
  step: number;
  total?: number;
  headline: string;
  accent: string;
  preview: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <SetupStepper step={step} total={total} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${headline}-${accent}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="pb-2"
              >
                <SetupHeadline lead={headline} accent={accent} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 pt-6 pb-4"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2.5 border-t border-zinc-100 pt-4">
            {footer}
          </div>
        </div>
      </div>

      <div className="relative h-[min(42vh,22rem)] w-full shrink-0 lg:h-auto lg:w-[min(52vw,46rem)] lg:max-w-[52%]">
        <div className="absolute inset-3 overflow-hidden rounded-[28px] border border-zinc-200 bg-accent-light shadow-xs lg:inset-4 lg:rounded-[36px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="h-full w-full"
            >
              {preview}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
