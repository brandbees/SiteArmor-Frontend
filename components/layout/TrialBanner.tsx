"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const DISMISSED_KEY = "bb_trial_banner_dismissed";

function getDaysRemaining(trialEndsAt: string): number {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const { agency } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "1");
  }, []);

  if (!agency?.trial_ends_at || (agency.plan && agency.plan !== "free")) return null;

  const days = getDaysRemaining(agency.trial_ends_at);
  const isExpired = days === 0;

  if (!isExpired && dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  if (isExpired) {
    return (
      <div className="flex w-full shrink-0 items-center justify-between gap-3 bg-red-50 px-4 py-2.5 sm:px-6">
        <p className="text-sm font-medium text-red-800">
          Your trial has ended. Add a payment method to continue using Site Armor.
        </p>
        <Link
          href="/billing"
          className="shrink-0 text-sm font-semibold text-red-700 underline underline-offset-2 hover:no-underline"
        >
          Add payment method
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-3 bg-accent-light px-4 py-2.5 sm:px-6">
      <p className="text-sm text-accent">
        You have{" "}
        <span className="font-semibold">
          {days} day{days !== 1 ? "s" : ""}
        </span>{" "}
        left in your free trial.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/billing"
          className="text-sm font-semibold text-accent underline underline-offset-2 hover:no-underline"
        >
          Upgrade now
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss trial notice"
          className="flex size-7 items-center justify-center rounded-full text-accent/60 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
