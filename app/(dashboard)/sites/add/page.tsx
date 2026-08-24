"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Copy, Download, Globe, Loader2, SkipForward } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { cacheClear } from "@/lib/dataCache";
import { parseSiteUrl } from "@/lib/setupUrl";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { SiteDonePreview, SitePluginPreview, SiteUrlPreview } from "@/components/setup/SetupPreview";
import { UpgradeBanner } from "@/components/shared/UpgradeBanner";
import type { Site } from "@/types";

const HEADLINES = [
  { lead: "Begin by adding", accent: "your site." },
  { lead: "Connect the plugin", accent: "to start watching." },
  { lead: "You're all set.", accent: "Let's go." },
] as const;

export default function AddSitePage() {
  const router = useRouter();
  const { agency } = useAuth();
  const { roleCanDo } = useRole();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState<Site | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"waiting" | "checking" | "connected">("waiting");

  const parsed = parseSiteUrl(url);
  const urlOk = parsed.ok;
  const atLimit = agency != null && agency.sites_count >= (agency.sites_limit ?? 1);

  useEffect(() => {
    if (agency?.is_client_portal) router.replace("/dashboard");
    else if (agency && !roleCanDo("add_site")) router.replace("/sites");
  }, [agency, roleCanDo, router]);

  const checkConnection = useCallback(
    async (manual = false) => {
      if (!site) return;
      if (manual) setStatus("checking");
      try {
        const { data } = await api.get<{ plugin_connected: boolean }>(`/sites/${site.id}/connection-status`);
        if (data.plugin_connected) {
          setStatus("connected");
          setTimeout(() => setStep(3), 900);
        } else if (manual) {
          setStatus("waiting");
        }
      } catch {
        if (manual) setStatus("waiting");
      }
    },
    [site]
  );

  useEffect(() => {
    if (step !== 2 || !site) return;
    const id = setInterval(() => checkConnection(false), 5000);
    return () => clearInterval(id);
  }, [step, site, checkConnection]);

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = parseSiteUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ site: Site }>("/sites", { url: result.url, name: result.name });
      setSite(data.site);
      cacheClear("sites");
      setStep(2);
      toast.success("Site added");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add site.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (!site?.site_token) return;
    navigator.clipboard.writeText(site.site_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function finish() {
    cacheClear("sites");
    router.push(site ? `/sites/${site.id}` : "/sites");
  }

  const preview = step === 1 ? <SiteUrlPreview /> : step === 2 ? <SitePluginPreview /> : <SiteDonePreview />;
  const copy = HEADLINES[step - 1];

  return (
    <form onSubmit={step === 1 ? handleUrlSubmit : (e) => e.preventDefault()} className="flex h-full min-h-0 flex-1 flex-col">
      <SetupWizard
        step={step}
        headline={copy.lead}
        accent={copy.accent}
        preview={preview}
        footer={
          step === 1 ? (
            <button
              type="submit"
              disabled={!urlOk || loading || atLimit}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Continue
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          ) : step === 2 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                <SkipForward size={14} />
                I&apos;ll do this later
              </button>
              <button
                type="button"
                onClick={() => checkConnection(true)}
                disabled={status === "checking"}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {status === "checking" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Verify connection
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Open site
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          )
        }
      >
        {atLimit && agency && (
          <UpgradeBanner message={`You've reached your site limit on the ${agency.plan} plan.`} />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="site-url" className="text-sm font-semibold text-zinc-900">
              Your WordPress Site URL<span className="text-red-500"> *</span>
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
            <p className="text-xs font-normal text-zinc-500">
              Enter your WordPress site URL. We&apos;ll check the format and save it to your account.
            </p>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        )}

        {step === 2 && site && (
          <div className="flex max-w-lg flex-col gap-4">
            {status === "connected" ? (
              <p className="text-sm text-emerald-700">Plugin connected. Wrapping up…</p>
            ) : (
              <>
                <a
                  href={`${API_BASE_URL}/plugin/download`}
                  download="site-armor.zip"
                  className="inline-flex h-10 items-center justify-between gap-3 rounded-lg border border-accent bg-accent/5 px-4 text-sm font-medium text-accent hover:opacity-90"
                >
                  Download Site Armor plugin (.zip)
                  <Download size={16} />
                </a>
                <ol className="space-y-2.5 text-sm text-zinc-600">
                  {[
                    "In WordPress go to Plugins → Add New → Upload Plugin",
                    "Install the zip, then activate Site Armor",
                    "Open Settings → Site Armor and paste the token below",
                  ].map((item, i) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Site token</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-800">{site.site_token}</code>
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

        {step === 3 && (
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            {site?.name ?? "Your site"} is in the dashboard. Open it to run an audit, or come back later to connect the
            plugin.
          </p>
        )}
      </SetupWizard>
    </form>
  );
}
