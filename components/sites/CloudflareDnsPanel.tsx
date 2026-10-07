"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, Loader2, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  connectCloudflareByo,
  connectCloudflareHosted,
  disconnectCloudflare,
  getCloudflareStatus,
  verifyCloudflareConnection,
  type CloudflareConnectionStatus,
} from "@/lib/api/cloudflare";
import type { Site } from "@/types";

type ModePick = "choose" | "byo" | "hosted";

export function CloudflareDnsPanel({ site }: { site: Site }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<CloudflareConnectionStatus | null>(null);
  const [modePick, setModePick] = useState<ModePick>("choose");
  const [token, setToken] = useState("");
  const [showDisconnect, setShowDisconnect] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCloudflareStatus(site.id);
      setStatus(data);
      if (!data.connected) setModePick("choose");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [site.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const copyNs = async (ns: string) => {
    try {
      await navigator.clipboard.writeText(ns);
      toast.success("Copied nameserver");
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleByo = async () => {
    if (!token.trim()) {
      toast.error("Paste a Cloudflare API token");
      return;
    }
    setBusy(true);
    try {
      const data = await connectCloudflareByo(site.id, token.trim());
      setStatus(data);
      setToken("");
      toast.success(`Connected to zone ${data.zone_name}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleHosted = async () => {
    setBusy(true);
    try {
      const data = await connectCloudflareHosted(site.id);
      setStatus(data);
      toast.success(data.message || "Zone created — update nameservers at your registrar");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    try {
      const data = await verifyCloudflareConnection(site.id);
      setStatus(data);
      toast.success(
        data.status === "active" ? "Zone is active" : "Still waiting on nameservers"
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      const res = await disconnectCloudflare(site.id);
      toast.success(res.message);
      setShowDisconnect(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const connected = !!status?.connected;
  const nameservers = status?.nameservers || [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ConfirmDialog
        isOpen={showDisconnect}
        title="Disconnect Cloudflare?"
        message={
          status?.mode === "hosted"
            ? "Removes the link in Site Armor. The zone stays on Cloudflare (not deleted)."
            : "Removes the saved API token from the vault and disconnects this site."
        }
        confirmText="Disconnect"
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnect(false)}
        isLoading={busy}
      />

      <div>
        <h2 className="text-base font-semibold text-foreground">DNS / Cloudflare</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Connect a zone so Site Armor can manage DNS and WAF (DNS editor comes next).
          {status?.apex ? (
            <>
              {" "}
              Apex: <span className="font-medium text-foreground">{status.apex}</span>
            </>
          ) : null}
        </p>
      </div>

      {!connected && modePick === "choose" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setModePick("byo")}
            className="rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-foreground/30"
          >
            <p className="text-sm font-semibold text-foreground">Already on Cloudflare</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Paste a scoped API token for this domain.
            </p>
          </button>
          <button
            type="button"
            disabled={status?.hosted_available === false}
            onClick={() => setModePick("hosted")}
            className="rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="text-sm font-semibold text-foreground">Host on Site Armor (Free)</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {status?.hosted_available === false
                ? "Hosted Free is not configured on the server yet."
                : "We create the zone; you point nameservers at Cloudflare."}
            </p>
          </button>
        </div>
      )}

      {!connected && modePick === "byo" && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-4">
          <button
            type="button"
            className="text-[12px] text-muted-foreground hover:text-foreground"
            onClick={() => setModePick("choose")}
          >
            ← Back
          </button>
          <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Create token at Cloudflare</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>My Profile → API Tokens → Create Token</li>
              <li>
                Permissions: Zone → Zone → <strong>Read</strong>; Zone → DNS →{" "}
                <strong>Edit</strong>; Zone → Zone WAF → <strong>Edit</strong>
              </li>
              <li>
                Zone Resources: Include → specific zone (
                {status?.apex || "this domain"})
              </li>
            </ol>
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground">API token</label>
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token — it is encrypted and never shown again"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-foreground/40"
            />
          </div>
          <Button onClick={handleByo} loading={busy} disabled={busy}>
            <Shield size={14} />
            Connect &amp; save token
          </Button>
        </div>
      )}

      {!connected && modePick === "hosted" && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-4">
          <button
            type="button"
            className="text-[12px] text-muted-foreground hover:text-foreground"
            onClick={() => setModePick("choose")}
          >
            ← Back
          </button>
          <p className="text-[13px] text-muted-foreground">
            Creates a Free zone for{" "}
            <span className="font-medium text-foreground">{status?.apex || "this domain"}</span>{" "}
            on Site Armor&apos;s Cloudflare. You (or the client) must update nameservers at the
            registrar afterward.
          </p>
          <Button onClick={handleHosted} loading={busy} disabled={busy}>
            Create Free zone
          </Button>
        </div>
      )}

      {connected && status && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{status.zone_name}</p>
                <StatusPill status={status.status} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {status.mode === "hosted" ? "Hosted Free" : "Client token"}
                </span>
              </div>
              {status.last_error && (
                <p className="mt-1 text-[12px] text-[var(--score-bad)]">{status.last_error}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleVerify} disabled={busy} loading={busy}>
                <RefreshCw size={13} />
                Refresh status
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDisconnect(true)} disabled={busy}>
                Disconnect
              </Button>
            </div>
          </div>

          {status.status === "active" ? (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--score-good-border)] bg-[var(--score-good-bg)]/30 px-3 py-2.5">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--score-good)]" />
              <p className="text-[13px] text-foreground">
                Zone is active. DNS and WAF editors land in the next phases.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground">
                Point this domain&apos;s nameservers at Cloudflare at your registrar, then refresh.
              </p>
              <ul className="space-y-1.5">
                {nameservers.map((ns) => (
                  <li
                    key={ns}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2 font-mono text-[12px]"
                  >
                    <span>{ns}</span>
                    <button
                      type="button"
                      onClick={() => copyNs(ns)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Copy ${ns}`}
                    >
                      <Copy size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              {nameservers.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                  No nameservers returned yet — try Refresh status.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: CloudflareConnectionStatus["status"] }) {
  if (status === "active") {
    return (
      <span className="rounded-full bg-[var(--score-good-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--score-good)]">
        Active
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="rounded-full bg-[var(--score-bad-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--score-bad)]">
        Error
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      Pending nameservers
    </span>
  );
}
