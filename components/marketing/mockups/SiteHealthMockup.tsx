"use client";

export function SiteHealthMockup() {
  const pillars = [
    { label: "Performance", score: 89, tone: "good" as const },
    { label: "SEO", score: 92, tone: "good" as const },
    { label: "Security", score: 81, tone: "warn" as const },
    { label: "Malware", score: 100, tone: "good" as const },
    { label: "Uptime", score: 99, tone: "good" as const },
  ];

  const toneColor = {
    good: "var(--score-good)",
    warn: "var(--score-warn)",
    bad: "var(--score-bad)",
  };

  const trend = [62, 68, 65, 74, 79, 84, 89];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-gradient-brand opacity-[0.12] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[var(--mkt-surface)] shadow-elevated-lg">
        <div className="flex items-center justify-between border-b border-[var(--mkt-border)] px-5 py-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-muted)]">
              Portfolio health
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--mkt-fg)]">
              client-site.com
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--score-good-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--score-good)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--score-good)]" />
            Healthy
          </span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="relative mx-auto flex h-[7.5rem] w-[7.5rem] items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--mkt-border)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(87 / 100) * 327} 327`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center">
              <p className="font-[family-name:var(--font-marketing-display)] text-4xl font-semibold tracking-tight text-[var(--mkt-fg)]">
                87
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--mkt-muted)]">
                Overall
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pillars.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className="w-[5.5rem] shrink-0 text-xs text-[var(--mkt-muted)]">
                  {p.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mkt-bg-muted)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${p.score}%`,
                      background: toneColor[p.tone],
                    }}
                  />
                </div>
                <span
                  className="w-7 text-right text-xs font-bold"
                  style={{ color: toneColor[p.tone] }}
                >
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--mkt-border)] px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] text-[var(--mkt-muted)]">
              Score trend · last 7 audits
            </p>
            <p className="text-[11px] font-semibold text-[var(--score-good)]">
              62 → 89
            </p>
          </div>
          <div className="flex h-14 items-end gap-1.5">
            {trend.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-accent/25 transition-all duration-500 hover:bg-accent/50"
                style={{
                  height: `${h}%`,
                  background:
                    i === trend.length - 1
                      ? "var(--accent)"
                      : `color-mix(in srgb, var(--accent) ${25 + i * 8}%, transparent)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
