"use client";

/**
 * Token top-up modal for the Agent screen.
 * Opens Stripe checkout in a new tab so the chat stays mounted.
 */

import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface TokenPackage {
  tokens: number;
  price_cents: number;
  label: string;
}

const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n));
const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

export function TokenTopupModal({
  onClose,
  outOfCredits,
}: {
  onClose: () => void;
  outOfCredits?: boolean;
}) {
  const [packages, setPackages] = useState<Record<string, TokenPackage>>({});
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ packages: Record<string, TokenPackage> }>("/billing/tokens/packages")
      .then(({ data }) => setPackages(data.packages || {}))
      .catch(() => setErr("Could not load token packages. Please try again."))
      .finally(() => setLoadingPkgs(false));
  }, []);

  async function buy(pkgKey: string) {
    setLaunching(pkgKey);
    setErr(null);
    try {
      const { data } = await api.post<{ url: string }>("/billing/tokens/checkout", {
        package: pkgKey,
        source: "agent",
      });
      const tab = window.open(data.url, "_blank", "noopener");
      if (!tab) {
        setErr("Your browser blocked the checkout tab. Please allow pop-ups and try again.");
        setLaunching(null);
        return;
      }
      setWaiting(true);
    } catch {
      setErr("Failed to start checkout. Please try again.");
    } finally {
      setLaunching(null);
    }
  }

  const entries = Object.entries(packages).sort((a, b) => a[1].tokens - b[1].tokens);

  return (
    <Modal
      open
      onClose={onClose}
      title={outOfCredits ? "You're out of tokens" : "Top up AI tokens"}
      description={
        outOfCredits
          ? "Add tokens to continue this chat — your conversation stays as it is."
          : "Tokens never expire. Checkout opens in a new tab; your chat stays intact."
      }
    >
      {waiting ? (
        <div className="py-6 text-center">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-accent" />
          <p className="text-sm font-bold text-foreground">Waiting for your payment…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete checkout in the new tab. Tokens appear here automatically.
          </p>
          <Button variant="ghost" className="mt-4" onClick={() => setWaiting(false)}>
            Choose a different package
          </Button>
        </div>
      ) : loadingPkgs ? (
        <div className="py-8 text-center">
          <Loader2 size={24} className="mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {entries.map(([key, pkg]) => (
              <button
                key={key}
                type="button"
                onClick={() => buy(key)}
                disabled={launching !== null}
                className="flex items-center justify-between rounded-[4px] border border-border px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent/5 disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{fmtTokens(pkg.tokens)} tokens</p>
                  <p className="text-xs text-muted-foreground">{pkg.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {fmtPrice(pkg.price_cents)}
                  </span>
                  {launching === key ? (
                    <Loader2 size={14} className="animate-spin text-accent" />
                  ) : (
                    <ExternalLink size={13} className="text-muted-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
          {entries.length === 0 && !err && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No token packages are available right now.
            </p>
          )}
        </>
      )}
      {err ? (
        <Alert variant="error" className="mt-3">
          {err}
        </Alert>
      ) : null}
    </Modal>
  );
}
