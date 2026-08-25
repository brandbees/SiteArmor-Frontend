"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Globe,
  LayoutDashboard,
  Loader2,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { cacheClear } from "@/lib/dataCache";
import { downloadPluginZip } from "@/lib/downloadPlugin";
import { parseSiteUrl } from "@/lib/setupUrl";
import { cn } from "@/lib/utils";
import { SetupWizard } from "@/components/setup/SetupWizard";
import {
  AgencyWelcomePreview,
  IndividualWelcomePreview,
  OnboardingScanPreview,
  SitePluginPreview,
  SiteUrlPreview,
} from "@/components/setup/SetupPreview";

interface NewSite {
  id: string;
  site_token: string;
  name: string;
  url: string;
}

type ScanState = "scanning" | "slow" | "ready" | "failed";

const SLOW_THRESHOLD_MS = 90_000;

const AGENCY_HEADLINES = [
  { lead: "Welcome aboard,", accent: "your agency dashboard." },
  { lead: "Begin by adding", accent: "your first client site." },
  { lead: "Connect the plugin", accent: "to start watching." },
  { lead: "Running your first", accent: "portfolio scan." },
] as const;

const INDIVIDUAL_HEADLINES = [
  { lead: "Welcome aboard,", accent: "your site dashboard." },
  { lead: "Begin by adding", accent: "your site." },
  { lead: "Connect the plugin", accent: "to start watching." },
  { lead: "Running your first", accent: "health scan." },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { agency, updateAgency } = useAuth();
  const isIndividual = agency?.account_type === "individual";

  const [step, setStep] = useState(1);
  const [site, setSite] = useState<NewSite | null>(null);
  const [url, setUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [connStatus, setConnStatus] = useState<"waiting" | "checking" | "connected">("waiting");
  const [scanState, setScanState] = useState<ScanState>("scanning");

  const pollConnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = parseSiteUrl(url);
  const urlOk = parsed.ok;
  const headlines = isIndividual ? INDIVIDUAL_HEADLINES : AGENCY_HEADLINES;
  const copy = headlines[step - 1];

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  async function markComplete() {
    try {
      await api.patch("/auth/complete-onboarding");
      updateAgency({ onboarding_complete: true });
    } catch {
      // proceed anyway
    }
    cacheClear("sites");
    router.replace("/dashboard");
  }

  async function handleAddSite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = parseSiteUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLoading(true);
    try {
      const name = siteName.trim() || result.name;
      const { data } = await api.post<{ site: NewSite }>("/sites", { name, url: result.url });
      setSite(data.site);
      cacheClear("sites");
      setStep(3);
      toast.success("Site added");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to add site. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const checkConnection = useCallback(
    async (manual = false) => {
      if (!site) return;
      if (manual) setConnStatus("checking");
      try {
        const { data } = await api.get<{ plugin_connected: boolean }>(
          `/sites/${site.id}/connection-status`
        );
        if (data.plugin_connected) {
          setConnStatus("connected");
          if (pollConnRef.current) clearInterval(pollConnRef.current);
          setTimeout(() => setStep(4), 900);
        } else if (manual) {
          setConnStatus("waiting");
        }
      } catch {
        if (manual) setConnStatus("waiting");
      }
    },
    [site]
  );

  useEffect(() => {
    if (step !== 3 || !site) return;
    pollConnRef.current = setInterval(() => checkConnection(false), 5000);
    return () => {
      if (pollConnRef.current) clearInterval(pollConnRef.current);
    };
  }, [step, site, checkConnection]);

  const checkAudit = useCallback(async () => {
    if (!site) return;
    try {
      const { data } = await api.get<{ audits: { status: string }[] }>(`/sites/${site.id}`);
      const audits = data.audits ?? [];
      if (audits.some((a) => a.status === "completed")) {
        setScanState("ready");
        if (pollScanRef.current) clearInterval(pollScanRef.current);
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      } else if (audits.length > 0 && audits.every((a) => a.status === "failed")) {
        setScanState("failed");
        if (pollScanRef.current) clearInterval(pollScanRef.current);
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      }
    } catch {
      // ignore poll errors
    }
  }, [site]);

  useEffect(() => {
    if (step !== 4 || !site) return;
    setScanState("scanning");
    pollScanRef.current = setInterval(checkAudit, 3000);
    scanTimeoutRef.current = setTimeout(() => setScanState((s) => (s === "scanning" ? "slow" : s)), SLOW_THRESHOLD_MS);
    return () => {
      if (pollScanRef.current) clearInterval(pollScanRef.current);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [step, site, checkAudit]);

  function copyToken() {
    if (!site?.site_token) return;
    navigator.clipboard.writeText(site.site_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPlugin() {
    setDownloading(true);
    try {
      await downloadPluginZip();
    } catch {
      toast.error("Plugin download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const preview =
    step === 1 ? (
      isIndividual ? (
        <IndividualWelcomePreview />
      ) : (
        <AgencyWelcomePreview />
      )
    ) : step === 2 ? (
      <SiteUrlPreview />
    ) : step === 3 ? (
      <SitePluginPreview />
    ) : (
      <OnboardingScanPreview />
    );

  const footer =
    step === 1 ? (
      <button
        type="button"
        onClick={() => setStep(2)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Get started
        <ArrowRight size={16} strokeWidth={1.5} />
      </button>
    ) : step === 2 ? (
      <button
        type="submit"
        form="onboarding-add-site"
        disabled={!urlOk || loading}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Continue
        <ArrowRight size={16} strokeWidth={1.5} />
      </button>
    ) : step === 3 ? (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void markComplete()}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <SkipForward size={14} />
          I&apos;ll do this later
        </button>
        <button
          type="button"
          onClick={() => checkConnection(true)}
          disabled={connStatus === "checking" || connStatus === "connected"}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {connStatus === "checking" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Verify connection
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => void markComplete()}
        disabled={scanState === "scanning"}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {scanState === "scanning" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <LayoutDashboard size={16} />
        )}
        {scanState === "ready"
          ? "Go to dashboard"
          : scanState === "failed" || scanState === "slow"
            ? "Go to dashboard"
            : "Scanning…"}
      </button>
    );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-200 bg-white px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/site-armor-icon.png" alt="Site Armor" className="h-7 w-7 object-contain" />
        <span className="font-portal-display text-sm font-bold text-zinc-900">Site Armor</span>
        <span className="ml-auto text-xs font-medium text-zinc-400">
          {isIndividual ? "Site setup" : "Agency setup"}
        </span>
      </header>

      <div className="min-h-0 flex-1">
        <SetupWizard
          step={step}
          total={4}
          headline={copy.lead}
          accent={copy.accent}
          preview={preview}
          footer={footer}
        >
          {step === 1 && (
            <div className="max-w-lg space-y-3 text-sm leading-relaxed text-zinc-500">
              {isIndividual ? (
                <>
                  <p>
                    Keep your WordPress site healthy, secure, and fast — without needing to be a
                    developer. We watch it around the clock and alert you before small issues become
                    big problems.
                  </p>
                  <p>Let&apos;s connect your site now. It only takes a few minutes.</p>
                </>
              ) : (
                <>
                  <p>
                    Monitor client WordPress sites, catch threats early, and send branded audit
                    reports — all from one agency dashboard.
                  </p>
                  <p>
                    Next we&apos;ll add your first client site, connect the plugin, and run a scan so
                    you can see scores land in real time.
                  </p>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <form id="onboarding-add-site" onSubmit={handleAddSite} className="flex max-w-lg flex-col gap-5">
              {!isIndividual && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="site-name" className="text-sm font-semibold text-zinc-900">
                    Client site name
                  </label>
                  <input
                    id="site-name"
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Acme Corp Website"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:font-extralight placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-0"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="site-url" className="text-sm font-semibold text-zinc-900">
                  {isIndividual ? "Your WordPress Site URL" : "WordPress Site URL"}
                  <span className="text-red-500"> *</span>
                </label>
                <div className="relative flex w-full items-center overflow-hidden rounded-lg bg-white">
                  <Globe
                    size={16}
                    strokeWidth={1}
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-950"
                  />
                  <input
                    id="site-url"
                    type="text"
                    autoComplete="off"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Eg: https://www.sample.com"
                    className={cn(
                      "h-10 w-full rounded-lg border border-zinc-200 bg-transparent py-2 pl-7 pr-3 text-sm outline-none placeholder:font-extralight placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-0",
                      error && "border-red-500"
                    )}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {isIndividual
                    ? "Enter your WordPress site URL so we can start monitoring it."
                    : "Enter the client WordPress URL you want to monitor first."}
                </p>
                {error ? <p className="text-xs text-red-600">{error}</p> : null}
              </div>
            </form>
          )}

          {step === 3 && site && (
            <div className="flex max-w-lg flex-col gap-4">
              {connStatus === "connected" ? (
                <p className="text-sm text-emerald-700">Plugin connected. Starting your first scan…</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadPlugin}
                    disabled={downloading}
                    className="inline-flex h-10 items-center justify-between gap-3 rounded-lg border border-accent bg-accent/5 px-4 text-sm font-medium text-accent hover:opacity-90 disabled:opacity-60"
                  >
                    {downloading ? "Downloading…" : "Download Site Armor plugin (.zip)"}
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                  <ol className="space-y-2.5 text-sm text-zinc-600">
                    {(isIndividual
                      ? [
                          "Log in to WordPress → Plugins → Add New → Upload Plugin",
                          "Install the zip, then activate Site Armor",
                          "Open Settings → Site Armor and paste the token below",
                        ]
                      : [
                          "In the client’s WordPress: Plugins → Add New → Upload Plugin",
                          "Install the zip, then activate Site Armor",
                          "Open Settings → Site Armor and paste the token below",
                        ]
                    ).map((item, i) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Site token
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-800">
                        {site.site_token}
                      </code>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-zinc-400" />
                    Checking automatically every 5 seconds
                  </p>
                </>
              )}
            </div>
          )}

          {step === 4 && site && (
            <div className="max-w-md space-y-3 text-sm leading-relaxed text-zinc-500">
              {scanState === "ready" && (
                <p className="text-zinc-700">
                  Your first report for <span className="font-medium text-zinc-900">{site.name}</span> is
                  ready. Head to the dashboard to review scores.
                </p>
              )}
              {scanState === "failed" && (
                <p>
                  We couldn&apos;t finish the audit on{" "}
                  <span className="font-medium text-zinc-900">{site.name}</span> right now. You can
                  rerun it from the dashboard once the site is reachable.
                </p>
              )}
              {(scanState === "scanning" || scanState === "slow") && (
                <p>
                  We&apos;re scanning <span className="font-medium text-zinc-900">{site.name}</span>.
                  {scanState === "slow"
                    ? " This is taking a little longer than usual — you can continue to the dashboard."
                    : " This usually takes 30–60 seconds."}
                </p>
              )}
            </div>
          )}
        </SetupWizard>
      </div>
    </div>
  );
}
