"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check, AlertCircle, X, Tag, CreditCard, Users, Globe, Zap,
  HardDrive, Receipt, Sparkles, CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { McAlert, McCard, McIconBox, McPill, McTag } from "@/components/shared/MalCareUI";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import { ScrollFadeRow } from "@/components/shared/ScrollFadeRow";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { PLAN_LABELS, PLAN_LIMITS, PLAN_SEATS, PLAN_PRICES, PLAN_FEATURES, resolvePlanCode, getPlanPrice, getPlanLabel, effectiveSitesLimit, effectiveSeatsLimit } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Site } from "@/types";

const PLANS = ["free", "freemium", "premium", "agency_plus"] as const;
type PlanKey = typeof PLANS[number];

interface TokenPackage  { tokens: number; price_cents: number; label: string; }
interface StoragePackage { bytes: number; price_cents: number; label: string; }
interface PlanLimits    { tokens: number; storage: number; }
interface BillingEvent  {
  id: string; type: "subscription" | "token_topup" | "storage_addon";
  plan: string | null; tokens: number | null; bytes: number | null;
  amount_cents: number; currency: string; created_at: string; stripe_session_id: string | null;
}
interface TokenState { tokens_used: number; tokens_limit: number; tokens_extra: number; monthly_limit: number; extra_used?: number; extra_remaining?: number; }

function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total >= 9999 ? 0 : Math.min(100, (used / total) * 100);
  const isNearLimit = pct >= 80;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums text-foreground">
          {used} / {total >= 9999 ? "∞" : total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[2px] bg-[#eef1f6]">
        {total < 9999 && (
          <div
            className="h-full rounded-[2px] transition-all duration-300"
            style={{ width: `${pct}%`, background: isNearLimit ? "var(--score-bad)" : "var(--accent)" }}
          />
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

const TX_META: Record<string, { label: string; tone: "accent" | "good" | "warn"; icon: React.ElementType }> = {
  subscription:  { label: "Plan",      tone: "accent", icon: CreditCard },
  token_topup:   { label: "AI Tokens", tone: "warn",   icon: Zap },
  storage_addon: { label: "Storage",   tone: "good",   icon: HardDrive },
};

const BILLING_TABS = [
  { id: "plans", label: "Plans" },
  { id: "tokens", label: "AI Tokens" },
  { id: "storage", label: "Storage" },
  { id: "history", label: "History" },
  { id: "coupon", label: "Coupon" },
] as const;

const AGENT_BY_PLAN: Record<string, string> = {
  free: "Locked — upgrade to Starter",
  freemium: "Chat & remediate",
  premium: "Chat, remediate & optimize",
  agency: "Full agent + SSH server control",
  agency_plus: "Full agent + SSH server control",
};

function planRank(code: string): number {
  const order = ["free", "freemium", "premium", "agency", "agency_plus"];
  const i = order.indexOf(code);
  return i === -1 ? 0 : i;
}
function BillingContent() {
  const { agency, refreshAgency } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sites, setSites]           = useState<Site[]>([]);
  const [seatsUsed, setSeatsUsed]   = useState(1);
  const [seatsLimit, setSeatsLimit] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [redeemLoading, setRedeemLoading]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [addonLoading, setAddonLoading]       = useState<string | null>(null);
  const [checkoutError,  setCheckoutError]    = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);

  // Live data from backend
  const [tokenPkgs, setTokenPkgs]     = useState<Record<string, TokenPackage>>({});
  const [storagePkgs, setStoragePkgs] = useState<Record<string, StoragePackage>>({});
  const [planLimits, setPlanLimits]   = useState<Record<string, PlanLimits>>({});
  const [history, setHistory]         = useState<BillingEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const sectionParam = searchParams.get("section");
  const validSection = BILLING_TABS.some((t) => t.id === sectionParam) ? sectionParam! : "plans";
  const [billingTab, setBillingTab] = useState(validSection);

  useEffect(() => {
    if (sectionParam && BILLING_TABS.some((t) => t.id === sectionParam)) {
      setBillingTab(sectionParam);
    }
  }, [sectionParam]);

  const rawPlan = agency?.plan ?? "free";
  const isLegacyAgency = rawPlan === "agency";
  const currentPlan = resolvePlanCode(rawPlan) as PlanKey;
  const currentPlanLabel = getPlanLabel(rawPlan);
  const currentPlanPrice = getPlanPrice(rawPlan);
  const sitesLimit = effectiveSitesLimit(rawPlan, agency?.sites_limit);
  const isIndividual = agency?.account_type === "individual";

  // Dynamic storage limit — live from API for the actual plan code
  const dynStorageLimit = planLimits[rawPlan]?.storage ?? planLimits[currentPlan]?.storage ?? 524_288_000;

  useEffect(() => {
    api.get<{ sites: Site[] }>("/sites").then(({ data }) => setSites(data.sites ?? [])).catch(() => {});
    api.get<{ seats_used: number; seats_limit: number }>("/team")
      .then(({ data }) => {
        setSeatsUsed(data.seats_used);
        setSeatsLimit(effectiveSeatsLimit(agency?.plan, data.seats_limit));
      })
      .catch(() => {});
    api.get<TokenState>("/agent/tokens").then(({ data }) => setTokenState(data)).catch(() => {});
    api.get<{ packages: Record<string, TokenPackage> }>("/billing/tokens/packages")
      .then(({ data }) => setTokenPkgs(data.packages)).catch(() => {});
    api.get<{ packages: Record<string, StoragePackage> }>("/billing/storage/packages")
      .then(({ data }) => setStoragePkgs(data.packages)).catch(() => {});
    api.get<{ limits: Record<string, PlanLimits> }>("/billing/limits")
      .then(({ data }) => setPlanLimits(data.limits)).catch(() => {});
    const fetchHistory = () =>
      api.get<{ history: BillingEvent[] }>("/billing/history")
        .then(({ data }) => { setHistory(data.history); setHistoryLoaded(true); })
        .catch(() => setHistoryLoaded(true));

    fetchHistory();
    refreshAgency();

    const sessionId      = searchParams.get("session_id");
    const tokensSuccess  = searchParams.get("tokens") === "success";
    const storageSuccess = searchParams.get("storage") === "success";
    const planSuccess    = searchParams.get("plan") === "success";

    // Persist the originating route so we can redirect back after payment
    const fromParam = searchParams.get("from");
    if (fromParam) sessionStorage.setItem("bbss_checkout_from", fromParam);

    function redirectAfterPurchase() {
      const from = sessionStorage.getItem("bbss_checkout_from");
      if (from) {
        sessionStorage.removeItem("bbss_checkout_from");
        setTimeout(() => router.push(from), 800);
      }
    }

    if ((tokensSuccess || storageSuccess || planSuccess) && sessionId) {
      // Verify the Stripe session â€” credits the purchase if the webhook hasn't fired yet
      api.post("/billing/verify-session", { session_id: sessionId })
        .then(async () => {
          if (tokensSuccess) {
            const { data: ts } = await api.get<TokenState>("/agent/tokens");
            setTokenState(ts);
          } else if (storageSuccess || planSuccess) {
            await refreshAgency();
          }

          // A plan change moves the monthly token and storage allowances, so pull both
          // again. Without this the new allowance only appeared after a reload or a
          // route switch, because these are otherwise fetched once on mount.
          if (planSuccess) {
            await Promise.all([
              api.get<TokenState>("/agent/tokens")
                .then(({ data }) => setTokenState(data))
                .catch(() => {}),
              api.get<{ limits: Record<string, PlanLimits> }>("/billing/limits")
                .then(({ data }) => setPlanLimits(data.limits ?? {}))
                .catch(() => {}),
            ]);
          }
          // Refresh history so new entry appears without page reload
          await fetchHistory();
          if (tokensSuccess)  toast.success("AI tokens added to your account! Your balance has been updated.");
          if (storageSuccess) toast.success("Storage added to your account! Your limit has been increased.");
          if (planSuccess)    toast.success("Plan upgraded successfully! Welcome to your new plan.");
          redirectAfterPurchase();
        })
        .catch(async () => {
          // Webhook may have already processed it â€” still refresh history and show confirmation
          await fetchHistory();
          if (tokensSuccess)  toast.success("AI tokens added to your account! Your balance has been updated.");
          if (storageSuccess) toast.success("Storage added to your account! Your limit has been increased.");
          if (planSuccess)    toast.success("Plan upgraded successfully! Welcome to your new plan.");
          redirectAfterPurchase();
        });
    } else if (tokensSuccess) {
      toast.success("AI tokens added to your account! Your balance has been updated.");
    } else if (storageSuccess) {
      toast.success("Storage added to your account! Your limit has been increased.");
    } else if (planSuccess) {
      toast.success("Plan upgraded successfully! Welcome to your new plan.");
    }
  }, []);

  async function handleAddonCheckout(type: "tokens" | "storage", pkg: string) {
    setAddonLoading(pkg); setCheckoutError(null);
    try {
      const endpoint = type === "tokens" ? "/billing/tokens/checkout" : "/billing/storage/checkout";
      const { data } = await api.post<{ url: string }>(endpoint, { package: pkg });
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Failed to start checkout. Please try again.";
      setCheckoutError(msg);
      toast.error(msg);
      setAddonLoading(null);
    }
  }

  async function handleUpgrade(plan: string) {
    setCheckoutLoading(plan); setCheckoutError(null);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout", { plan });
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Failed to start checkout. Please try again.";
      setCheckoutError(msg);
      toast.error(msg);
      setCheckoutLoading(null);
    }
  }

  async function handleCouponRedeem() {
    if (!couponCode.trim()) return;
    setRedeemLoading(true);
    try {
      const { data } = await api.post<{ plan: string; sites_limit: number }>("/billing/coupons/redeem", { code: couponCode.trim() });
      toast.success(`Coupon applied! Plan upgraded to ${PLAN_LABELS[data.plan]}.`);
      setCouponCode("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid coupon code.");
    } finally { setRedeemLoading(false); }
  }

  const tokenPkgList   = Object.entries(tokenPkgs).map(([key, pkg]) => ({ key, ...pkg }));
  const storagePkgList = Object.entries(storagePkgs).map(([key, pkg]) => ({ key, ...pkg }));

  return (
    <div className="flex min-w-0 flex-col">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 sm:px-6">
        <ScrollFadeRow innerClassName="flex gap-0">
          {BILLING_TABS.map(({ id, label }) => {
            const active = billingTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBillingTab(id)}
                className={cn(
                  "relative shrink-0 whitespace-nowrap px-4 py-3 text-[13px] font-semibold transition-colors",
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-t-[1px] bg-accent" aria-hidden />
                )}
              </button>
            );
          })}
        </ScrollFadeRow>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {checkoutError && (
          <div className="relative">
            <McAlert variant="error" title="Checkout failed">
              {checkoutError}
            </McAlert>
            <button
              type="button"
              onClick={() => setCheckoutError(null)}
              className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {billingTab === "plans" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <McCard bodyClassName="p-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Current plan</p>
                <div>
                  <p className="text-xl font-bold text-foreground">{currentPlanLabel}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {currentPlanPrice.monthly === 0
                      ? "Free"
                      : `$${currentPlanPrice.monthly}/month`}
                  </p>
                </div>
                {currentPlan !== "free" && (
                  <McPill tone="accent" dot>
                    Active
                  </McPill>
                )}
              </McCard>
              <McCard bodyClassName="p-4 space-y-4 sm:col-span-2" className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Usage</p>
                <UsageBar used={sites.length} total={sitesLimit} label="Sites" />
                {!isIndividual && <UsageBar used={seatsUsed} total={seatsLimit} label="Team seats" />}
              </McCard>
            </div>

            {rawPlan === "agency" && (
              <McAlert variant="info" title="Legacy Agency plan">
                You&apos;re on our legacy Agency plan. Your features remain active. Upgrade to Agency+ anytime for higher token limits and priority support.
              </McAlert>
            )}

            <div className="space-y-4">
              <p className="text-sm font-bold text-foreground">Available plans</p>

              {isLegacyAgency && (
                <div className="rounded-2xl border border-accent/35 bg-accent-light/25 p-5 ring-1 ring-inset ring-accent/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <McTag tone="accent">Your current plan</McTag>
                      <p className="mt-2 text-lg font-bold text-foreground">Agency (Legacy)</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ${currentPlanPrice.monthly}/mo · Unlimited sites & seats · SSH + full AI agent
                      </p>
                    </div>
                    <Button onClick={() => handleUpgrade("agency_plus")} loading={checkoutLoading === "agency_plus"}>
                      Upgrade to Agency+
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {PLANS.map((plan) => {
                  const isCurrent = rawPlan === plan;
                  const price = getPlanPrice(plan).monthly;
                  const isDowngrade = planRank(plan) < planRank(rawPlan);
                  const limits = planLimits[plan];
                  const features = PLAN_FEATURES[plan] ?? [];
                  return (
                    <div
                      key={plan}
                      className={cn(
                        "flex flex-col gap-4 rounded-2xl border p-5 shadow-[0_1px_2px_rgb(26_29_35/0.04)]",
                        isCurrent
                          ? "border-accent/35 bg-accent-light/25 ring-1 ring-inset ring-accent/10"
                          : "border-zinc-200 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">{PLAN_LABELS[plan]}</p>
                          <p className="mt-1 text-2xl font-bold text-foreground">
                            {price === 0 ? "Free" : `$${price}`}
                            {price > 0 && (
                              <span className="text-sm font-normal text-muted-foreground">/mo</span>
                            )}
                          </p>
                        </div>
                        {isCurrent && (
                          <McTag tone="accent">Current</McTag>
                        )}
                      </div>
                      {limits && (
                        <div className="flex flex-wrap gap-1.5">
                          <McTag tone="accent">{fmtTokens(limits.tokens)} tokens/mo</McTag>
                          <McTag tone="neutral">{formatBytes(limits.storage)} storage</McTag>
                        </div>
                      )}
                      <ul className="flex-1 space-y-2">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check size={12} className="mt-0.5 shrink-0 text-[var(--score-good)]" strokeWidth={2.5} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {!isCurrent && !isDowngrade && plan !== "free" && (
                        <Button className="w-full" onClick={() => handleUpgrade(plan)} loading={checkoutLoading === plan}>
                          Upgrade
                        </Button>
                      )}
                      {isCurrent && (
                        <p className="py-1 text-center text-xs font-medium text-muted-foreground">Your current plan</p>
                      )}
                      {isDowngrade && !isCurrent && (
                        <p className="py-1 text-center text-xs text-muted-foreground">Lower tier</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <McCard
              icon={<Sparkles size={16} strokeWidth={2} />}
              title="AI Agent by plan"
              bodyClassName="p-4"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan}
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      plan === rawPlan ? "border-accent/30 bg-accent-light/20" : "border-zinc-200 bg-zinc-50"
                    )}
                  >
                    <p className="text-xs font-bold text-foreground">{PLAN_LABELS[plan]}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{AGENT_BY_PLAN[plan] ?? AGENT_BY_PLAN.free}</p>
                  </div>
                ))}
              </div>
            </McCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Globe, title: `${sitesLimit >= 9999 ? "Unlimited" : sitesLimit} site${sitesLimit === 1 ? "" : "s"}`, sub: "Monitored and audited", show: true },
                { icon: Users, title: `${seatsLimit >= 9999 ? "Unlimited" : seatsLimit} seats`, sub: "Team members included", show: !isIndividual },
                { icon: Zap, title: "Scheduled audits", sub: rawPlan === "free" ? "Upgrade to enable" : "Weekly & monthly", show: true },
              ]
                .filter((s) => s.show)
                .map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)]"
                  >
                    <McIconBox icon={<Icon size={16} strokeWidth={2} />} tone="neutral" size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
            </div>

            {isIndividual && (
              <McCard
                icon={<Users size={16} strokeWidth={2} />}
                title="Need to manage clients or add team members?"
                bodyClassName="space-y-3 p-4"
              >
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Switch your account to Agency to unlock multi-site management, white-label branding, client portals, and team collaboration.
                </p>
                <a
                  href="mailto:support@brandbees.io?subject=Switch to Agency account"
                  className="mt-3 inline-flex items-center rounded-[4px] border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-[0_1px_2px_rgb(26_29_35/0.04)] transition-colors hover:bg-[#f7f9fc]"
                >
                  Contact us
                </a>
              </McCard>
            )}
          </>
        )}

        {billingTab === "tokens" && (
          currentPlan === "free" ? (
            <McAlert variant="info" title="Upgrade to buy tokens">
              AI token top-ups are available on paid plans. Choose a plan in the Plans tab to get started.
            </McAlert>
          ) : (
            <McCard
              title="AI assistant tokens"
              icon={<Zap size={16} strokeWidth={2} />}
              bodyClassName="space-y-5 p-4 sm:p-5"
            >
              {tokenState && (() => {
                const monthlyBase = tokenState.monthly_limit ?? tokenState.tokens_limit;
                const planUsed = Math.min(tokenState.tokens_used, monthlyBase);
                const planPct = Math.min(100, (planUsed / Math.max(monthlyBase, 1)) * 100);
                const extraTotal = tokenState.tokens_extra;
                const extraLeft = Math.max(0, tokenState.extra_remaining ?? (extraTotal - (tokenState.extra_used ?? 0)));
                const extraPct = extraTotal > 0 ? Math.min(100, ((extraTotal - extraLeft) / extraTotal) * 100) : 0;

                return (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Plan allowance <span className="opacity-70">Â· refills monthly</span>
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {fmtTokens(planUsed)} / {fmtTokens(monthlyBase)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-[2px] bg-[#eef1f6]">
                        <div
                          className="h-full rounded-[2px] bg-accent transition-all duration-300"
                          style={{ width: `${planPct}%` }}
                        />
                      </div>
                    </div>

                    {extraTotal > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Top-up balance <span className="opacity-70">Â· one-time, does not refill</span>
                          </span>
                          <span className="font-bold tabular-nums text-foreground">
                            {fmtTokens(extraLeft)} left of {fmtTokens(extraTotal)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-[2px] bg-[#eef1f6]">
                          <div
                            className={cn(
                              "h-full rounded-[2px] transition-all duration-300",
                              extraLeft <= extraTotal * 0.2 ? "bg-[var(--score-warn)]" : "bg-accent"
                            )}
                            style={{ width: `${extraPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Your plan allowance refills at the start of each month. Top-up tokens never expire and are used only after the monthly allowance runs out.
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {tokenPkgList.length > 0
                  ? tokenPkgList.map(({ key, tokens, price_cents, label }) => (
                      <div
                        key={key}
                        className="flex flex-col gap-3 rounded-[4px] border border-border bg-[#f7f9fc] p-4"
                      >
                        <div>
                          <p className="text-lg font-bold text-foreground">{fmtCents(price_cents)}</p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">{fmtTokens(tokens)} tokens</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                        </div>
                        <Button
                          className="mt-auto w-full"
                          onClick={() => handleAddonCheckout("tokens", key)}
                          loading={addonLoading === key}
                          disabled={addonLoading !== null && addonLoading !== key}
                        >
                          Buy
                        </Button>
                      </div>
                    ))
                  : [1, 2, 3].map((i) => (
                      <div key={i} className="h-28 animate-pulse rounded-[4px] border border-border bg-[#eef1f6]" />
                    ))}
              </div>
            </McCard>
          )
        )}

        {billingTab === "storage" && (
          currentPlan === "free" ? (
            <McAlert variant="info" title="Upgrade to buy storage">
              Storage add-ons are available on paid plans. Choose a plan in the Plans tab to get started.
            </McAlert>
          ) : (
            (() => {
              const storageExtra = agency?.storage_extra_bytes ?? 0;
              const storageUsed = agency?.storage_used_bytes ?? 0;
              const storageTotal = dynStorageLimit + storageExtra;
              const storagePct = Math.min(100, (storageUsed / Math.max(storageTotal, 1)) * 100);
              const storageWarn = storagePct >= 80;
              return (
                <McCard
                  title="Storage"
                  icon={<HardDrive size={16} strokeWidth={2} />}
                  bodyClassName="space-y-5 p-4 sm:p-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Used</span>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatBytes(storageUsed)} / {formatBytes(storageTotal)}
                        {storageExtra > 0 && (
                          <span className="ml-2 font-bold text-accent">+{formatBytes(storageExtra)} extra</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-[2px] bg-[#eef1f6]">
                      <div
                        className="h-full rounded-[2px] transition-all duration-300"
                        style={{
                          width: `${storagePct}%`,
                          background: storageWarn ? "var(--score-bad)" : "var(--accent)",
                        }}
                      />
                    </div>
                    {storageWarn && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--score-bad)]">
                        <AlertCircle size={11} />
                        Storage almost full â€” buy more to keep saving reports and backups.
                      </p>
                    )}
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Extra storage never expires and is applied on top of your plan allowance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {storagePkgList.length > 0
                      ? storagePkgList.map(({ key, bytes, price_cents, label }) => (
                          <div
                            key={key}
                            className="flex flex-col gap-3 rounded-[4px] border border-border bg-[#f7f9fc] p-4"
                          >
                            <div>
                              <p className="text-lg font-bold text-foreground">{fmtCents(price_cents)}</p>
                              <p className="mt-0.5 text-sm font-bold text-foreground">{formatBytes(bytes)}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                            </div>
                            <Button
                              className="mt-auto w-full"
                              onClick={() => handleAddonCheckout("storage", key)}
                              loading={addonLoading === key}
                              disabled={addonLoading !== null && addonLoading !== key}
                            >
                              Buy
                            </Button>
                          </div>
                        ))
                      : [1, 2, 3].map((i) => (
                          <div key={i} className="h-28 animate-pulse rounded-[4px] border border-border bg-[#eef1f6]" />
                        ))}
                  </div>
                </McCard>
              );
            })()
          )
        )}

        {billingTab === "history" && (
          <McCard
            title="Purchase history"
            icon={<Receipt size={16} strokeWidth={2} />}
            bodyClassName="p-0 sm:p-0"
            flush
          >
            {!historyLoaded ? (
              <p className="p-4 text-xs text-muted-foreground">Loadingâ€¦</p>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<Receipt size={26} className="text-muted-foreground/25" />}
                title="No purchases yet"
                description="Plan upgrades, token top-ups, and storage add-ons will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 text-left">Type</th>
                      <th className="px-4 py-2.5 text-left">Details</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => {
                      const meta = TX_META[tx.type] ?? TX_META.subscription;
                      const Icon = meta.icon;
                      return (
                        <tr key={tx.id} className="border-b border-border/60 transition-colors hover:bg-[#f7f9fc]/80">
                          <td className="px-4 py-3">
                            <McTag tone={meta.tone} icon={<Icon size={10} strokeWidth={2.5} />}>
                              {meta.label}
                            </McTag>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {tx.type === "token_topup" && tx.tokens && `+${fmtTokens(tx.tokens)} tokens`}
                            {tx.type === "storage_addon" && tx.bytes && `+${formatBytes(tx.bytes)} storage`}
                            {tx.type === "subscription" && tx.plan && `${PLAN_LABELS[tx.plan] ?? tx.plan} plan`}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-foreground">
                            {fmtCents(tx.amount_cents, tx.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </McCard>
        )}

        {billingTab === "coupon" && (
          <McCard
            title="Redeem coupon"
            icon={<Tag size={16} strokeWidth={2} />}
            bodyClassName="space-y-4 p-4 sm:p-5"
          >
            <p className="text-xs text-muted-foreground">
              Have a coupon code? Enter it below to upgrade your plan or unlock features.
            </p>
            <div className="flex max-w-md items-start gap-3">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENTER-COUPON-CODE"
                  className="rounded-[4px] pl-8 font-mono uppercase tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleCouponRedeem()}
                />
              </div>
              <Button onClick={handleCouponRedeem} loading={redeemLoading} disabled={!couponCode.trim()}>
                Apply
              </Button>
            </div>
          </McCard>
        )}
      </div>
    </div>
  );
}

export function PlansBillingPage({ showHeader = true }: { showHeader?: boolean }) {
  if (!showHeader) {
    return <BillingContent />;
  }

  return (
    <PortalPageShell
      title="Plans & Billing"
      description="Manage your plan, AI tokens, storage, and purchase history"
      icon={<CircleDollarSign size={22} strokeWidth={1.25} />}
    >
      <BillingContent />
    </PortalPageShell>
  );
}

export function PlansBillingPageSuspense() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}>
      <PlansBillingPage />
    </Suspense>
  );
}
