"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Globe, Mail, Plug, Shield, Users } from "lucide-react";

function useLoopScene(count: number, ms: number) {
  const reduce = useReducedMotion();
  const [scene, setScene] = useState(0);
  useEffect(() => {
    if (reduce || count < 2) return;
    const t = window.setInterval(() => setScene((s) => (s + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [count, ms, reduce]);
  return scene;
}

function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = duration * 1000;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - (1 - p) ** 3;
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  const shown = decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  return (
    <>
      {shown}
      {suffix}
    </>
  );
}

function SoftOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-16 top-10 size-56 rounded-full bg-accent/20 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 bottom-8 size-64 rounded-full bg-[#7dd3fc]/35 blur-3xl"
        animate={{ y: [0, -22, 0], x: [0, -12, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 size-40 rounded-full bg-emerald-300/25 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function LiveBars({ heights, colorClass }: { heights: number[]; colorClass: string }) {
  const track = 148;
  return (
    <div className="flex w-full items-end gap-2.5">
      {heights.map((h, i) => {
        const px = Math.max(18, Math.round((h / 100) * track));
        return (
          <div key={WEEK[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-end" style={{ height: track }}>
              <motion.div
                className={`w-full rounded-t-md ${colorClass}`}
                initial={{ height: 12 }}
                animate={{ height: [12, px, Math.max(18, px - 10), px] }}
                transition={{
                  duration: 2.6,
                  delay: i * 0.09,
                  repeat: Infinity,
                  repeatDelay: 1.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-accent/70">{WEEK[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col justify-between overflow-hidden bg-[linear-gradient(165deg,#dbeafe_0%,#eff6ff_42%,#ffffff_100%)] px-7 py-8">
      <SoftOrbs />
      <div className="relative z-10 flex h-full flex-col justify-between">{children}</div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-accent">
      {icon}
      {label}
    </div>
  );
}

function StatHero({
  value,
  decimals,
  suffix,
  label,
  trend,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl bg-white/85 px-5 py-5 shadow-[0_0_0_1px_rgb(26_86_219_/_0.1),0_18px_40px_-24px_rgb(26_86_219_/_0.45)] backdrop-blur-sm">
      <p className="font-portal-display text-[2.35rem] font-bold leading-none tracking-tight text-accent">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </p>
      <p className="mt-2 text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-xs font-medium text-emerald-600">{trend}</p>
    </div>
  );
}

function MiniStats(
  items: { n: number; label: string; decimals?: number; suffix?: string }[]
) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      {items.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-white/70 px-2 py-2.5 backdrop-blur-sm">
          <p className="font-portal-display text-lg font-bold text-accent">
            <CountUp value={stat.n} decimals={stat.decimals} suffix={stat.suffix} />
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function PulseShield() {
  return (
    <div className="relative mx-auto flex size-[7.5rem] items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-accent/30"
        animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-2 rounded-full border-2 border-accent/20"
        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
        transition={{ duration: 2.2, delay: 0.45, repeat: Infinity, ease: "easeOut" }}
      />
      <div className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgb(26_86_219_/_0.12),0_12px_28px_-12px_rgb(26_86_219_/_0.5)]">
        <Shield size={34} strokeWidth={1.4} className="text-accent" />
      </div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((label, i) => (
        <motion.div
          key={label}
          className="flex items-center gap-3 rounded-xl bg-white/90 px-4 py-3 text-sm text-zinc-600 shadow-[0_0_0_1px_rgb(26_86_219_/_0.08)]"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="flex size-5 items-center justify-center rounded-full bg-accent text-white"
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35 + i * 0.18, type: "spring", stiffness: 320, damping: 16 }}
          >
            <Check size={12} strokeWidth={2.5} />
          </motion.span>
          {label}
        </motion.div>
      ))}
    </div>
  );
}

export function SiteUrlPreview() {
  const scene = useLoopScene(3, 4200);
  return (
    <Stage>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="flex h-full flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene === 0 && (
            <>
              <Chip icon={<Shield size={16} strokeWidth={1.5} />} label="86 sites watched in one place" />
              <StatHero value={86} label="Sites monitored" trend="+12 this month" />
              {MiniStats([
                { n: 1840, label: "Audits" },
                { n: 99.9, label: "Uptime", decimals: 1, suffix: "%" },
                { n: 326, label: "Fixes" },
              ])}
              <LiveBars heights={[46, 62, 54, 78, 70, 88, 94]} colorClass="bg-gradient-to-t from-accent to-[#7dd3fc]" />
            </>
          )}
          {scene === 1 && (
            <>
              <Chip icon={<Globe size={16} strokeWidth={1.5} />} label="Add a URL. We start watching." />
              <PulseShield />
              <div className="rounded-2xl bg-white/85 px-5 py-4 text-center shadow-[0_0_0_1px_rgb(26_86_219_/_0.1)]">
                <p className="font-portal-display text-2xl font-bold text-accent">
                  <CountUp value={86} /> sites live
                </p>
                <p className="mt-1 text-sm text-zinc-500">Performance, SEO, security, malware</p>
              </div>
              <LiveBars heights={[38, 52, 47, 69, 61, 80, 86]} colorClass="bg-gradient-to-t from-accent to-emerald-300" />
            </>
          )}
          {scene === 2 && (
            <>
              <Chip icon={<Shield size={16} strokeWidth={1.5} />} label="Threats caught before clients notice" />
              <StatHero value={14820} label="Issues flagged this year" trend="Clean scans on every connected site" />
              {MiniStats([
                { n: 0, label: "Hacked" },
                { n: 14, label: "Warnings" },
                { n: 218, label: "Plugin updates" },
              ])}
              <LiveBars heights={[32, 44, 58, 50, 74, 66, 90]} colorClass="bg-gradient-to-t from-[#102850] to-accent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Stage>
  );
}

export function SitePluginPreview() {
  return (
    <Stage>
      <Chip icon={<Plug size={16} strokeWidth={1.5} />} label="One plugin. Scores start landing." />
      <PulseShield />
      <Checklist items={["Upload Site Armor", "Paste the site token", "First audit queued"]} />
    </Stage>
  );
}

export function SiteDonePreview() {
  return (
    <Stage>
      <Chip icon={<Check size={16} strokeWidth={1.5} />} label="First report on the way" />
      <StatHero value={86} label="Sites in the portfolio" trend="Uptime · Malware · SEO · Speed" />
      {MiniStats([
        { n: 92, label: "Health" },
        { n: 99.9, label: "Uptime", decimals: 1, suffix: "%" },
        { n: 0, label: "Threats" },
      ])}
      <LiveBars heights={[50, 58, 64, 72, 80, 86, 94]} colorClass="bg-gradient-to-t from-emerald-600 to-accent" />
    </Stage>
  );
}

export function ClientProfilePreview() {
  const scene = useLoopScene(2, 4000);
  const rows = [
    { name: "Studio", sites: 28 },
    { name: "Shop", sites: 19 },
    { name: "Press", sites: 34 },
  ];
  return (
    <Stage>
      <Chip icon={<Users size={16} strokeWidth={1.5} />} label="Clients, grouped cleanly" />
      {scene === 0 ? (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <motion.div
              key={row.name}
              className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-[0_0_0_1px_rgb(26_86_219_/_0.08)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {row.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-zinc-800">{row.name}</span>
              </div>
              <span className="text-xs text-zinc-400">{row.sites} sites</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <>
          <StatHero value={86} label="Sites under clients" trend="Reports stay branded to you" />
          {MiniStats([
            { n: 42, label: "Clients" },
            { n: 38, label: "Portals" },
            { n: 216, label: "Reports" },
          ])}
        </>
      )}
      <p className="relative z-10 text-xs leading-relaxed text-zinc-500">
        Keep every client’s sites and portal access in one row — not a pile of logins.
      </p>
    </Stage>
  );
}

export function ClientPortalPreview() {
  return (
    <Stage>
      <Chip icon={<Mail size={16} strokeWidth={1.5} />} label="They see scores. You keep the keys." />
      <div className="relative mx-auto flex size-24 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-accent/15"
          animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgb(26_86_219_/_0.12)]">
          <Mail size={28} strokeWidth={1.3} className="text-accent" />
        </div>
      </div>
      <div className="rounded-2xl bg-white/90 px-5 py-5 shadow-[0_0_0_1px_rgb(26_86_219_/_0.1)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-accent/70">Portal invite</p>
        <p className="mt-2 font-portal-display text-xl font-bold text-accent">View-only dashboard</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          White-label reports, no admin access, no extra WordPress logins.
        </p>
      </div>
    </Stage>
  );
}

export function ClientSitesPreview() {
  const hosts = ["site-one.com", "shop.example", "status.example"];
  return (
    <Stage>
      <Chip icon={<Globe size={16} strokeWidth={1.5} />} label="Assign sites in one tap" />
      <div className="flex flex-col gap-3">
        {hosts.map((host, i) => (
          <motion.div
            key={host}
            className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-[0_0_0_1px_rgb(26_86_219_/_0.08)]"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.14 }}
          >
            <motion.span
              className="flex size-5 items-center justify-center rounded-md bg-accent text-white"
              initial={{ scale: 0.5 }}
              animate={{ scale: i < 2 ? 1 : 0.85, opacity: i < 2 ? 1 : 0.45 }}
              transition={{ delay: 0.25 + i * 0.16, type: "spring" }}
            >
              {i < 2 ? <Check size={12} /> : null}
            </motion.span>
            <span className="text-sm text-zinc-700">{host}</span>
          </motion.div>
        ))}
      </div>
    </Stage>
  );
}
