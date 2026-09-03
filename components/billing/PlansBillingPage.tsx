"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check, AlertCircle, X, Tag, CreditCard, Users, Globe, Zap,
  HardDrive, Receipt, CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { McAlert, McTag } from "@/components/shared/MalCareUI";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import { ScrollFadeRow } from "@/components/shared/ScrollFadeRow";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { PLAN_LABELS, PLAN_FEATURES, resolvePlanCode, getPlanPrice, getPlanLabel, effectiveSitesLimit, effectiveSeatsLimit } from "@/lib/constants";
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
  const unlimited = total >= 9999;
  const pct = unlimited ? 8 : Math.min(100, (used / Math.max(total, 1)) * 100);
  const isNearLimit = !unlimited && pct >= 80;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-700">{label}</span>
        <span className="text-base font-bold tabular-nums text-zinc-950">
          {used}
          <span className="mx-1 font-medium text-zinc-400">/</span>
          {unlimited ? "Unlimited" : total}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isNearLimit ? "bg-red-500" : "bg-accent"
          )}
          style={{ width: `${Math.max(pct, unlimited ? 8 : 4)}%` }}
        />
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
      // Verify the Stripe session - credits the purchase if the webhook hasn't fired yet
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
          // Webhook may have already processed it - still refresh history and show confirmation
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
    <div className="flex min-w-0 flex-col bg-zinc-50/50">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 sm:px-6">
        <ScrollFadeRow innerClassName="flex gap-1.5 py-3">
          {BILLING_TABS.map(({ id, label }) => {
            const active = billingTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBillingTab(id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
                )}
              >
                {label}
              </button>
            );
          })}
        </ScrollFadeRow>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {checkoutError && (
          <div className="relative">
            <McAlert variant="error" title="Checkout failed">
              {checkoutError}
            </McAlert>
            <button
              type="button"
              onClick={() => setCheckoutError(null)}
              className="absolute right-3 top-3 text-zinc-400 transition-colors hover:text-zinc-700"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {billingTab === "plans" && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current plan</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">{currentPlanLabel}</p>
                <p className="mt-1 text-base font-semibold text-zinc-600">
                  {currentPlanPrice.monthly === 0 ? "Free" : `$${currentPlanPrice.monthly}/month`}
                </p>
                {rawPlan !== "free" && (
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    Active
                  </span>
                )}
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
                <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Usage</p>
                <div className="space-y-5">
                  <UsageBar used={sites.length} total={sitesLimit} label="Sites" />
                  {!isIndividual && <UsageBar used={seatsUsed} total={seatsLimit} label="Team seats" />}
                </div>
              </div>
            </div>

            {isLegacyAgency && (
              <div className="flex flex-col gap-4 rounded-3xl border border-accent/30 bg-accent-light p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-accent shadow-sm">
                    Your current plan
                  </span>
                  <p className="mt-2 text-xl font-bold text-zinc-950">Agency (Legacy)</p>
                  <p className="mt-1 text-sm font-medium text-zinc-600">
                    ${currentPlanPrice.monthly}/mo - Unlimited sites & seats - SSH + full AI agent
                  </p>
                </div>
                <Button size="lg" onClick={() => handleUpgrade("agency_plus")} loading={checkoutLoading === "agency_plus"}>
                  Upgrade to Agency+
                </Button>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Choose your plan</h2>
                  <p className="mt-1 text-sm font-medium text-zinc-500">Upgrade anytime. Changes apply after checkout.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {PLANS.map((plan) => {
                  const isCurrent = rawPlan === plan;
                  const price = getPlanPrice(plan).monthly;
                  const isDowngrade = planRank(plan) < planRank(rawPlan);
                  const limits = planLimits[plan];
                  const features = PLAN_FEATURES[plan] ?? [];
                  const popular = plan === "premium";
                  return (
                    <div
                      key={plan}
                      className={cn(
                        "relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition-shadow",
                        isCurrent
                          ? "border-accent shadow-md ring-2 ring-accent/20"
                          : popular
                            ? "border-zinc-300 shadow-md"
                            : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                      )}
                    >
                      {popular && !isCurrent && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Most popular
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-lg font-bold text-zinc-950">{PLAN_LABELS[plan]}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
                        {price === 0 ? "Free" : `$${price}`}
                        {price > 0 && (
                          <span className="ml-1 text-base font-semibold text-zinc-500">/mo</span>
                        )}
                      </p>
                      {limits && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
                            {fmtTokens(limits.tokens)} tokens/mo
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
                            {formatBytes(limits.storage)}
                          </span>
                        </div>
                      )}
                      <ul className="mt-5 flex-1 space-y-2.5">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-zinc-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        {!isCurrent && !isDowngrade && plan !== "free" && (
                          <Button className="w-full" size="lg" onClick={() => handleUpgrade(plan)} loading={checkoutLoading === plan}>
                            Upgrade to {PLAN_LABELS[plan]}
                          </Button>
                        )}
                        {isCurrent && (
                          <div className="rounded-xl bg-accent/10 py-3 text-center text-sm font-bold text-accent">
                            Your current plan
                          </div>
                        )}
                        {isDowngrade && !isCurrent && (
                          <div className="rounded-xl bg-zinc-100 py-3 text-center text-sm font-semibold text-zinc-500">
                            Lower tier
                          </div>
                        )}
                        {plan === "free" && !isCurrent && !isDowngrade && (
                          <div className="rounded-xl bg-zinc-100 py-3 text-center text-sm font-semibold text-zinc-500">
                            Included free
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
                    className="flex items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-zinc-950">{title}</p>
                      <p className="mt-0.5 text-sm font-medium text-zinc-500">{sub}</p>
                    </div>
                  </div>
                ))}
            </div>

            {isIndividual && (
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                    <Users size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-950">Need clients or a team?</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-600">
                      Switch your account to Agency to unlock multi-site management, white-label branding, client portals, and team collaboration.
                    </p>
                    <a
                      href="mailto:support@brandbees.io?subject=Switch to Agency account"
                      className="mt-4 inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                      Contact us
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {billingTab === "tokens" && (
          currentPlan === "free" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Zap size={26} strokeWidth={2} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-zinc-950">Upgrade to buy tokens</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-zinc-500">
                AI token top-ups are available on paid plans. Choose a plan in the Plans tab to get started.
              </p>
              <Button className="mt-6" size="lg" onClick={() => setBillingTab("plans")}>
                View plans
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Zap size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-950">AI assistant tokens</h2>
                    <p className="text-sm font-medium text-zinc-500">Monthly allowance + optional top-ups</p>
                  </div>
                </div>

                {tokenState && (() => {
                  const monthlyBase = tokenState.monthly_limit ?? tokenState.tokens_limit;
                  const planUsed = Math.min(tokenState.tokens_used, monthlyBase);
                  const planPct = Math.min(100, (planUsed / Math.max(monthlyBase, 1)) * 100);
                  const extraTotal = tokenState.tokens_extra;
                  const extraLeft = Math.max(0, tokenState.extra_remaining ?? (extraTotal - (tokenState.extra_used ?? 0)));
                  const extraPct = extraTotal > 0 ? Math.min(100, ((extraTotal - extraLeft) / extraTotal) * 100) : 0;

                  return (
                    <div className="mt-6 space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-zinc-950">Plan allowance</p>
                            <p className="text-xs font-medium text-zinc-500">Refills monthly</p>
                          </div>
                          <p className="text-lg font-bold tabular-nums text-zinc-950">
                            {fmtTokens(planUsed)} / {fmtTokens(monthlyBase)}
                          </p>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${planPct}%` }} />
                        </div>
                      </div>

                      {extraTotal > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-zinc-950">Top-up balance</p>
                              <p className="text-xs font-medium text-zinc-500">One-time, does not refill</p>
                            </div>
                            <p className="text-lg font-bold tabular-nums text-zinc-950">
                              {fmtTokens(extraLeft)} left of {fmtTokens(extraTotal)}
                            </p>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                extraLeft <= extraTotal * 0.2 ? "bg-amber-500" : "bg-accent"
                              )}
                              style={{ width: `${extraPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <p className="text-sm font-medium leading-relaxed text-zinc-500">
                        Your plan allowance refills at the start of each month. Top-up tokens never expire and are used only after the monthly allowance runs out.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 className="mb-4 text-lg font-bold text-zinc-950">Buy more tokens</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {tokenPkgList.length > 0
                    ? tokenPkgList.map(({ key, tokens, price_cents, label }) => (
                        <div
                          key={key}
                          className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <p className="text-3xl font-bold tracking-tight text-zinc-950">{fmtCents(price_cents)}</p>
                          <p className="mt-2 text-lg font-bold text-zinc-950">{fmtTokens(tokens)} tokens</p>
                          <p className="mt-1 text-sm font-medium text-zinc-500">{label}</p>
                          <Button
                            className="mt-6 w-full"
                            size="lg"
                            onClick={() => handleAddonCheckout("tokens", key)}
                            loading={addonLoading === key}
                            disabled={addonLoading !== null && addonLoading !== key}
                          >
                            Buy now
                          </Button>
                        </div>
                      ))
                    : [1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100" />
                      ))}
                </div>
              </div>
            </div>
          )
        )}

        {billingTab === "storage" && (
          currentPlan === "free" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <HardDrive size={26} strokeWidth={2} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-zinc-950">Upgrade to buy storage</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-zinc-500">
                Storage add-ons are available on paid plans. Choose a plan in the Plans tab to get started.
              </p>
              <Button className="mt-6" size="lg" onClick={() => setBillingTab("plans")}>
                View plans
              </Button>
            </div>
          ) : (
            (() => {
              const storageExtra = agency?.storage_extra_bytes ?? 0;
              const storageUsed = agency?.storage_used_bytes ?? 0;
              const storageTotal = dynStorageLimit + storageExtra;
              const storagePct = Math.min(100, (storageUsed / Math.max(storageTotal, 1)) * 100);
              const storageWarn = storagePct >= 80;
              return (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <HardDrive size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-zinc-950">Storage</h2>
                        <p className="text-sm font-medium text-zinc-500">Plan quota + optional add-ons</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="flex items-end justify-between gap-3">
                        <p className="text-sm font-bold text-zinc-950">Used</p>
                        <p className="text-lg font-bold tabular-nums text-zinc-950">
                          {formatBytes(storageUsed)} / {formatBytes(storageTotal)}
                          {storageExtra > 0 && (
                            <span className="ml-2 text-sm font-bold text-accent">+{formatBytes(storageExtra)} extra</span>
                          )}
                        </p>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={cn("h-full rounded-full transition-all", storageWarn ? "bg-red-500" : "bg-accent")}
                          style={{ width: `${storagePct}%` }}
                        />
                      </div>
                      {storageWarn && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                          <AlertCircle size={14} />
                          Storage almost full - buy more to keep saving reports and backups.
                        </p>
                      )}
                      <p className="pt-2 text-sm font-medium leading-relaxed text-zinc-500">
                        Extra storage never expires and is applied on top of your plan allowance.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-bold text-zinc-950">Buy more storage</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {storagePkgList.length > 0
                        ? storagePkgList.map(({ key, bytes, price_cents, label }) => (
                            <div
                              key={key}
                              className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <p className="text-3xl font-bold tracking-tight text-zinc-950">{fmtCents(price_cents)}</p>
                              <p className="mt-2 text-lg font-bold text-zinc-950">{formatBytes(bytes)}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-500">{label}</p>
                              <Button
                                className="mt-6 w-full"
                                size="lg"
                                onClick={() => handleAddonCheckout("storage", key)}
                                loading={addonLoading === key}
                                disabled={addonLoading !== null && addonLoading !== key}
                              >
                                Buy now
                              </Button>
                            </div>
                          ))
                        : [1, 2, 3].map((i) => (
                            <div key={i} className="h-40 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100" />
                          ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )
        )}

        {billingTab === "history" && (
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Receipt size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Purchase history</h2>
                <p className="text-sm font-medium text-zinc-500">Plans, tokens, and storage purchases</p>
              </div>
            </div>
            {!historyLoaded ? (
              <p className="p-6 text-sm font-medium text-zinc-500">Loading...</p>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<Receipt size={26} className="text-zinc-300" />}
                title="No purchases yet"
                description="Plan upgrades, token top-ups, and storage add-ons will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wide text-zinc-500">
                      <th className="px-6 py-3.5 text-left">Type</th>
                      <th className="px-6 py-3.5 text-left">Details</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => {
                      const meta = TX_META[tx.type] ?? TX_META.subscription;
                      const Icon = meta.icon;
                      return (
                        <tr key={tx.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                          <td className="px-6 py-4">
                            <McTag tone={meta.tone} icon={<Icon size={10} strokeWidth={2.5} />}>
                              {meta.label}
                            </McTag>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-600">
                            {tx.type === "token_topup" && tx.tokens && `+${fmtTokens(tx.tokens)} tokens`}
                            {tx.type === "storage_addon" && tx.bytes && `+${formatBytes(tx.bytes)} storage`}
                            {tx.type === "subscription" && tx.plan && `${PLAN_LABELS[tx.plan] ?? tx.plan} plan`}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold tabular-nums text-zinc-950">
                            {fmtCents(tx.amount_cents, tx.currency)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-zinc-500">
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
          </div>
        )}

        {billingTab === "coupon" && (
          <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Tag size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Redeem coupon</h2>
                <p className="text-sm font-medium text-zinc-500">Unlock a plan or features with a code</p>
              </div>
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-600">
              Have a coupon code? Enter it below to upgrade your plan or unlock features.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENTER-COUPON-CODE"
                  className="h-12 rounded-xl pl-10 font-mono text-sm uppercase tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleCouponRedeem()}
                />
              </div>
              <Button size="lg" onClick={handleCouponRedeem} loading={redeemLoading} disabled={!couponCode.trim()}>
                Apply code
              </Button>
            </div>
          </div>
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
