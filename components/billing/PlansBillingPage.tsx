"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check, AlertCircle, X, Tag, CreditCard, Zap, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ScrollFadeRow } from "@/components/shared/ScrollFadeRow";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import {
  PLAN_LABELS,
  resolvePlanCode,
  getPlanPrice,
  getPlanLabel,
  effectiveSitesLimit,
  effectiveSeatsLimit,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Site } from "@/types";

const PLANS = ["free", "freemium", "premium", "agency_plus"] as const;
type PlanKey = typeof PLANS[number];

interface TokenPackage { tokens: number; price_cents: number; label: string; }
interface StoragePackage { bytes: number; price_cents: number; label: string; }
interface PlanLimits { tokens: number; storage: number; }
interface BillingEvent {
  id: string;
  type: "subscription" | "token_topup" | "storage_addon";
  plan: string | null;
  tokens: number | null;
  bytes: number | null;
  amount_cents: number;
  currency: string;
  created_at: string;
  stripe_session_id: string | null;
}
interface TokenState {
  tokens_used: number;
  tokens_limit: number;
  tokens_extra: number;
  monthly_limit: number;
  extra_used?: number;
  extra_remaining?: number;
}

const BILLING_TABS = [
  { id: "plans", label: "Plans" },
  { id: "tokens", label: "AI Tokens" },
  { id: "storage", label: "Storage" },
  { id: "history", label: "History" },
  { id: "coupon", label: "Coupon" },
] as const;

const PLAN_COPY: Record<PlanKey, { tagline: string; points: string[] }> = {
  free: {
    tagline: "One site to try the product.",
    points: [
      "1 WordPress site",
      "1 team seat",
      "1,000 AI tokens each month",
      "100 MB storage",
      "Manual audits",
      "Basic reports",
    ],
  },
  freemium: {
    tagline: "For freelancers running care plans.",
    points: [
      "10 WordPress sites",
      "3 team seats",
      "5,000 AI tokens each month",
      "500 MB storage",
      "Scheduled audits",
      "White-label reports",
      "AI agent chat",
    ],
  },
  premium: {
    tagline: "For agencies that need proof at scale.",
    points: [
      "50 WordPress sites",
      "10 team seats",
      "20,000 AI tokens each month",
      "1 GB storage",
      "Client portal",
      "Automated backups",
      "Safe plugin updates",
      "AI optimize",
    ],
  },
  agency_plus: {
    tagline: "Portfolio-scale operations, fully branded.",
    points: [
      "Unlimited sites",
      "Unlimited seats",
      "100,000 AI tokens each month",
      "5 GB storage",
      "SSH server control",
      "Custom domain",
      "Dedicated support",
    ],
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
function planRank(code: string): number {
  const order = ["free", "freemium", "premium", "agency", "agency_plus"];
  const i = order.indexOf(code);
  return i === -1 ? 0 : i;
}
function limitLabel(n: number) {
  return n >= 9999 ? "Unlimited" : String(n);
}
function defaultPreview(rawPlan: string, current: PlanKey): PlanKey {
  const next = PLANS.find((p) => p !== "free" && planRank(p) > planRank(rawPlan));
  return next ?? current;
}

export function PlansBillingPage() {
  const { agency, refreshAgency } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sites, setSites] = useState<Site[]>([]);
  const [seatsUsed, setSeatsUsed] = useState(1);
  const [seatsLimit, setSeatsLimit] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [addonLoading, setAddonLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [tokenPkgs, setTokenPkgs] = useState<Record<string, TokenPackage>>({});
  const [storagePkgs, setStoragePkgs] = useState<Record<string, StoragePackage>>({});
  const [planLimits, setPlanLimits] = useState<Record<string, PlanLimits>>({});
  const [history, setHistory] = useState<BillingEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<PlanKey | null>(null);
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
  const dynStorageLimit = planLimits[rawPlan]?.storage ?? planLimits[currentPlan]?.storage ?? 524_288_000;
  const focusedPlan = previewPlan ?? defaultPreview(rawPlan, currentPlan);
  const focusedCopy = PLAN_COPY[focusedPlan];
  const focusedPrice = getPlanPrice(focusedPlan).monthly;
  const focusedIsCurrent = rawPlan === focusedPlan;
  const focusedIsDowngrade = planRank(focusedPlan) < planRank(rawPlan);

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

    const sessionId = searchParams.get("session_id");
    const tokensSuccess = searchParams.get("tokens") === "success";
    const storageSuccess = searchParams.get("storage") === "success";
    const planSuccess = searchParams.get("plan") === "success";
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
      api.post("/billing/verify-session", { session_id: sessionId })
        .then(async () => {
          if (tokensSuccess) {
            const { data: ts } = await api.get<TokenState>("/agent/tokens");
            setTokenState(ts);
          } else if (storageSuccess || planSuccess) {
            await refreshAgency();
          }
          if (planSuccess) {
            await Promise.all([
              api.get<TokenState>("/agent/tokens").then(({ data }) => setTokenState(data)).catch(() => {}),
              api.get<{ limits: Record<string, PlanLimits> }>("/billing/limits")
                .then(({ data }) => setPlanLimits(data.limits ?? {})).catch(() => {}),
            ]);
          }
          await fetchHistory();
          if (tokensSuccess) toast.success("AI tokens added to your account! Your balance has been updated.");
          if (storageSuccess) toast.success("Storage added to your account! Your limit has been increased.");
          if (planSuccess) toast.success("Plan upgraded successfully! Welcome to your new plan.");
          redirectAfterPurchase();
        })
        .catch(async () => {
          await fetchHistory();
          if (tokensSuccess) toast.success("AI tokens added to your account! Your balance has been updated.");
          if (storageSuccess) toast.success("Storage added to your account! Your limit has been increased.");
          if (planSuccess) toast.success("Plan upgraded successfully! Welcome to your new plan.");
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
    setAddonLoading(pkg);
    setCheckoutError(null);
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
    setCheckoutLoading(plan);
    setCheckoutError(null);
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
    } finally {
      setRedeemLoading(false);
    }
  }

  const tokenPkgList = Object.entries(tokenPkgs).map(([key, pkg]) => ({ key, ...pkg }));
  const storagePkgList = Object.entries(storagePkgs).map(([key, pkg]) => ({ key, ...pkg }));
  const monthlyBase = tokenState?.monthly_limit ?? tokenState?.tokens_limit ?? 0;
  const planUsed = tokenState ? Math.min(tokenState.tokens_used, monthlyBase) : 0;
  const extraTotal = tokenState?.tokens_extra ?? 0;
  const extraLeft = tokenState
    ? Math.max(0, tokenState.extra_remaining ?? (extraTotal - (tokenState.extra_used ?? 0)))
    : 0;
  const storageExtra = agency?.storage_extra_bytes ?? 0;
  const storageUsed = agency?.storage_used_bytes ?? 0;
  const storageTotal = dynStorageLimit + storageExtra;
  const tokensLeft = Math.max(monthlyBase - planUsed, 0);

  const tabs = (
    <>
      {BILLING_TABS.map(({ id, label }) => {
        const active = billingTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setBillingTab(id)}
            className={cn(
              "relative shrink-0 text-left text-sm transition-colors lg:pl-3",
              active ? "font-semibold text-white" : "font-medium text-white/45 hover:text-white"
            )}
          >
            {label}
            {active && (
              <>
                <span className="absolute -bottom-1 left-0 h-px w-6 bg-white lg:hidden" />
                <span className="absolute left-0 top-1.5 hidden h-3 w-px bg-white lg:block" />
              </>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      <aside className="relative shrink-0 overflow-hidden bg-[#102850] text-white lg:flex lg:w-[300px] lg:flex-col xl:w-[340px]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(520px 280px at 0% 0%, rgb(26 86 219 / 0.35), transparent 58%)",
          }}
        />
        <div className="relative px-6 pb-5 pt-6 lg:flex lg:flex-1 lg:flex-col lg:px-8 lg:pb-8 lg:pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Your plan
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight xl:text-5xl">
            {currentPlanLabel}
          </h1>
          <p className="mt-2 text-lg text-white/55">
            {currentPlanPrice.monthly === 0 ? "Free" : `$${currentPlanPrice.monthly}`}
            {currentPlanPrice.monthly > 0 ? " / month" : ""}
            {isLegacyAgency ? " — legacy" : ""}
          </p>

          <div className="mt-8 flex gap-8 lg:flex-col lg:gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Sites</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {sites.length}
                <span className="ml-1.5 text-sm font-medium text-white/35">/ {limitLabel(sitesLimit)}</span>
              </p>
            </div>
            {!isIndividual && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Seats</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {seatsUsed}
                  <span className="ml-1.5 text-sm font-medium text-white/35">/ {limitLabel(seatsLimit)}</span>
                </p>
              </div>
            )}
          </div>

          <nav className="mt-8 hidden flex-col gap-3.5 lg:mt-auto lg:flex">
            {tabs}
          </nav>
        </div>

        <div className="relative border-t border-white/10 px-6 lg:hidden">
          <ScrollFadeRow fadeFrom="from-[#102850]" innerClassName="flex gap-5 py-3.5">
            {tabs}
          </ScrollFadeRow>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {checkoutError && (
            <div className="mb-8 flex items-start justify-between gap-3 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="flex items-center gap-2 font-medium">
                <AlertCircle size={16} />
                {checkoutError}
              </p>
              <button type="button" onClick={() => setCheckoutError(null)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}

          {billingTab === "plans" && (
            <div className="animate-fade-in">
              {isLegacyAgency && (
                <div className="mb-10 flex flex-col gap-4 border-b border-zinc-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">You&apos;re on a legacy Agency plan</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">Move to Agency+ for higher token limits</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => handleUpgrade("agency_plus")}
                    loading={checkoutLoading === "agency_plus"}
                  >
                    Upgrade to Agency+
                  </Button>
                </div>
              )}

              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Change plan
                  </p>
                  <ul className="mt-4">
                    {PLANS.map((plan) => {
                      const isCurrent = rawPlan === plan;
                      const price = getPlanPrice(plan).monthly;
                      const selected = focusedPlan === plan;
                      const recommended = plan === "premium" && planRank(rawPlan) < planRank("premium");
                      return (
                        <li key={plan}>
                          <button
                            type="button"
                            onClick={() => setPreviewPlan(plan)}
                            className={cn(
                              "flex w-full items-baseline gap-4 border-b border-zinc-200 py-5 text-left transition-colors",
                              selected ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-700"
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className={cn("text-lg", selected ? "font-semibold" : "font-medium")}>
                                  {PLAN_LABELS[plan]}
                                </span>
                                {isCurrent && (
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                                    Current
                                  </span>
                                )}
                                {recommended && !isCurrent && (
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                    Recommended
                                  </span>
                                )}
                              </span>
                            </span>
                            <span className={cn("text-2xl tabular-nums", selected ? "font-semibold" : "font-medium")}>
                              {price === 0 ? "Free" : `$${price}`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="lg:sticky lg:top-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    {PLAN_LABELS[focusedPlan]}
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
                    {focusedPrice === 0 ? "Free" : `$${focusedPrice}`}
                    {focusedPrice > 0 && (
                      <span className="ml-1 text-base font-medium text-zinc-400">/mo</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{focusedCopy.tagline}</p>
                  <ul className="mt-6 space-y-2.5">
                    {focusedCopy.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-800">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.5} />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    {focusedIsCurrent ? (
                      <p className="text-sm font-semibold text-accent">You&apos;re on this plan</p>
                    ) : focusedIsDowngrade || focusedPlan === "free" ? (
                      <p className="text-sm text-zinc-400">
                        {focusedPlan === "free" ? "Included with every account" : "Lower tier"}
                      </p>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => handleUpgrade(focusedPlan)}
                        loading={checkoutLoading === focusedPlan}
                      >
                        Upgrade to {PLAN_LABELS[focusedPlan]}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {isIndividual && (
                <p className="mt-12 text-sm text-zinc-500">
                  Need clients or a team?{" "}
                  <a href="mailto:support@brandbees.io?subject=Switch to Agency account" className="font-semibold text-accent hover:underline">
                    Contact us
                  </a>{" "}
                  to switch to an Agency account.
                </p>
              )}
            </div>
          )}

          {billingTab === "tokens" && (
            currentPlan === "free" ? (
              <LockedPanel
                title="Tokens are on paid plans"
                body="Upgrade to Starter or above to get a monthly AI token allowance and buy extra packs."
                onCta={() => setBillingTab("plans")}
              />
            ) : (
              <AddonPanel
                kicker="This month"
                amount={fmtTokens(tokensLeft)}
                caption={`remaining of ${fmtTokens(monthlyBase)} plan tokens`}
                used={planUsed}
                total={monthlyBase}
                extra={extraTotal > 0 ? `${fmtTokens(extraLeft)} top-up left` : null}
                note="Plan tokens refill each month. Top-ups never expire and are used after the monthly allowance runs out."
                rows={tokenPkgList}
                loading={tokenPkgList.length === 0}
                renderRow={({ key, tokens, price_cents, label }) => (
                  <AddonRow
                    key={key}
                    title={`${fmtTokens(tokens)} tokens`}
                    label={label}
                    price={fmtCents(price_cents)}
                    loading={addonLoading === key}
                    disabled={addonLoading !== null && addonLoading !== key}
                    onBuy={() => handleAddonCheckout("tokens", key)}
                  />
                )}
              />
            )
          )}

          {billingTab === "storage" && (
            currentPlan === "free" ? (
              <LockedPanel
                title="Storage add-ons need a paid plan"
                body="Upgrade to buy extra storage for reports and backups."
                onCta={() => setBillingTab("plans")}
              />
            ) : (
              <AddonPanel
                kicker="Storage used"
                amount={formatBytes(storageUsed)}
                caption={`of ${formatBytes(storageTotal)} total`}
                used={storageUsed}
                total={storageTotal}
                warn={storageUsed / Math.max(storageTotal, 1) >= 0.8}
                extra={storageExtra > 0 ? `${formatBytes(storageExtra)} extra purchased` : null}
                note="Extra storage never expires and stacks on top of your plan quota."
                rows={storagePkgList}
                loading={storagePkgList.length === 0}
                renderRow={({ key, bytes, price_cents, label }) => (
                  <AddonRow
                    key={key}
                    title={formatBytes(bytes)}
                    label={label}
                    price={fmtCents(price_cents)}
                    loading={addonLoading === key}
                    disabled={addonLoading !== null && addonLoading !== key}
                    onBuy={() => handleAddonCheckout("storage", key)}
                  />
                )}
              />
            )
          )}

          {billingTab === "history" && (
            <div className="animate-fade-in">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Purchases</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">History</h2>
              {!historyLoaded ? (
                <p className="mt-8 text-sm text-zinc-500">Loading...</p>
              ) : history.length === 0 ? (
                <p className="mt-10 text-sm text-zinc-500">No purchases yet.</p>
              ) : (
                <ul className="mt-8">
                  {history.map((tx) => {
                    const Icon =
                      tx.type === "token_topup" ? Zap : tx.type === "storage_addon" ? HardDrive : CreditCard;
                    const label =
                      tx.type === "token_topup"
                        ? tx.tokens
                          ? `+${fmtTokens(tx.tokens)} tokens`
                          : "AI tokens"
                        : tx.type === "storage_addon" && tx.bytes
                          ? `+${formatBytes(tx.bytes)} storage`
                          : `${PLAN_LABELS[tx.plan ?? ""] ?? tx.plan ?? "Plan"}`;
                    return (
                      <li key={tx.id} className="flex items-center gap-4 border-b border-zinc-200 py-5">
                        <Icon size={18} className="shrink-0 text-zinc-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-950">{label}</p>
                          <p className="text-sm text-zinc-500">
                            {new Date(tx.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-zinc-950">
                          {fmtCents(tx.amount_cents, tx.currency)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {billingTab === "coupon" && (
            <div className="animate-fade-in max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Redeem</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Have a coupon?</h2>
              <p className="mt-2 text-sm text-zinc-500">Enter a code to upgrade your plan or unlock features.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER-CODE"
                    className="h-12 rounded-md pl-10 font-mono text-sm uppercase tracking-[0.2em]"
                    onKeyDown={(e) => e.key === "Enter" && handleCouponRedeem()}
                  />
                </div>
                <Button size="lg" onClick={handleCouponRedeem} loading={redeemLoading} disabled={!couponCode.trim()}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedPanel({ title, body, onCta }: { title: string; body: string; onCta: () => void }) {
  return (
    <div className="animate-fade-in max-w-lg">
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
      <Button className="mt-6" size="lg" onClick={onCta}>
        View plans
      </Button>
    </div>
  );
}

function AddonPanel<T>({
  kicker,
  amount,
  caption,
  used,
  total,
  warn,
  extra,
  note,
  rows,
  loading,
  renderRow,
}: {
  kicker: string;
  amount: string;
  caption: string;
  used: number;
  total: number;
  warn?: boolean;
  extra: string | null;
  note: string;
  rows: T[];
  loading: boolean;
  renderRow: (row: T) => ReactNode;
}) {
  return (
    <div className="animate-fade-in grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{kicker}</p>
        <p className="mt-2 text-6xl font-semibold tracking-tight tabular-nums text-zinc-950">{amount}</p>
        <p className="mt-2 text-sm text-zinc-500">{caption}</p>
        <div className="mt-6 h-1 overflow-hidden bg-zinc-200">
          <div
            className={cn("h-full", warn ? "bg-red-500" : "bg-accent")}
            style={{ width: `${Math.min(100, (used / Math.max(total, 1)) * 100)}%` }}
          />
        </div>
        {extra && <p className="mt-4 text-sm font-medium text-zinc-700">{extra}</p>}
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-zinc-500">{note}</p>
      </div>
      <div>
        {loading
          ? [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse border-b border-zinc-100 bg-zinc-50" />)
          : rows.map(renderRow)}
      </div>
    </div>
  );
}

function AddonRow({
  title,
  label,
  price,
  loading,
  disabled,
  onBuy,
}: {
  title: string;
  label: string;
  price: string;
  loading: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-200 py-5">
      <div>
        <p className="text-lg font-semibold text-zinc-950">{title}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
      <Button onClick={onBuy} loading={loading} disabled={disabled}>
        {price}
      </Button>
    </div>
  );
}

export function PlansBillingPageSuspense() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><LoadingSpinner size="lg" /></div>}>
      <PlansBillingPage />
    </Suspense>
  );
}
