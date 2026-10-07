"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McAlert, McCard, McIconBox, McPill } from "@/components/shared/MalCareUI";
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

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const connected = !!status?.connected;
  const nameservers = status?.nameservers || [];
  const apex = status?.apex || "this domain";
  const statusTone =
    status?.status === "active" ? "good" : status?.status === "error" ? "bad" : "warn";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ConfirmDialog
        isOpen={showDisconnect}
        title="Disconnect Cloudflare?"
        message={
          status?.mode === "hosted"
            ? "Removes the link in Site Armor. The zone stays on Cloudflare (not deleted)."
            : "Removes the saved API token from the vault and disconnects this site."
        }
        confirmText="Disconnect"
        isDangerous
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnect(false)}
        isLoading={busy}
      />

      {/* Hero status */}
      <McCard flush>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <McIconBox
              icon={<Cloud size={17} />}
              tone={connected ? statusTone : "accent"}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-bold text-foreground">DNS / Cloudflare</h2>
                {!connected && <McPill tone="neutral" dot>Not connected</McPill>}
                {connected && status?.status === "active" && (
                  <McPill tone="good" icon={<CheckCircle2 size={11} />}>Active</McPill>
                )}
                {connected && status?.status === "pending_ns" && (
                  <McPill tone="warn" dot>Pending nameservers</McPill>
                )}
                {connected && status?.status === "error" && (
                  <McPill tone="bad" dot>Error</McPill>
                )}
                {connected && (
                  <McPill tone="neutral">
                    {status?.mode === "hosted" ? "Hosted Free" : "Client token"}
                  </McPill>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Put Cloudflare in front of this site so Site Armor can manage DNS and WAF.
                Records editor ships next.
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-foreground/80">
                Zone apex · {apex}
              </p>
            </div>
          </div>
          {connected && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleVerify} disabled={busy} loading={busy}>
                {!busy && <RefreshCw size={13} />}
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDisconnect(true)} disabled={busy}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </McCard>

      {/* Choose connection */}
      {!connected && modePick === "choose" && (
        <McCard title="Choose how to connect" icon={<Server size={14} />}>
          <div className="space-y-2.5">
            <ModeOption
              icon={<KeyRound size={17} />}
              tone="accent"
              title="Already on Cloudflare"
              body="Client keeps their account. Paste a scoped API token for this zone."
              cta="Connect with token"
              onClick={() => setModePick("byo")}
            />
            <ModeOption
              icon={<Cloud size={17} />}
              tone="good"
              title="Host on Site Armor (Free)"
              body={
                status?.hosted_available === false
                  ? "Hosted Free is not configured on the server yet."
                  : "We create the Free zone. You point nameservers at Cloudflare."
              }
              cta="Start Hosted Free"
              disabled={status?.hosted_available === false}
              onClick={() => setModePick("hosted")}
            />
          </div>
        </McCard>
      )}

      {/* BYO flow */}
      {!connected && modePick === "byo" && (
        <McCard
          title="Connect with client token"
          icon={<KeyRound size={14} />}
          action={
            <button
              type="button"
              onClick={() => setModePick("choose")}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} />
              Back
            </button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-[#f7f8fa] px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                Token checklist
              </p>
              <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-foreground/90">
                <li>1. Cloudflare → My Profile → API Tokens → Create Token</li>
                <li>
                  2. Permissions: Zone Read · DNS Edit · Zone WAF Edit
                </li>
                <li>
                  3. Zone Resources → Include → <span className="font-mono font-semibold">{apex}</span>
                </li>
              </ol>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground">API token</label>
              <input
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token — encrypted at rest, never shown again"
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-accent/0 transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Stored in the same vault pattern as SSH credentials.
              </p>
            </div>
            <Button onClick={handleByo} loading={busy} disabled={busy}>
              Connect &amp; save token
            </Button>
          </div>
        </McCard>
      )}

      {/* Hosted flow */}
      {!connected && modePick === "hosted" && (
        <McCard
          title="Host on Site Armor Free"
          icon={<Cloud size={14} />}
          action={
            <button
              type="button"
              onClick={() => setModePick("choose")}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} />
              Back
            </button>
          }
        >
          <div className="space-y-4">
            <ol className="space-y-2.5">
              {[
                { n: "1", t: "Create Free zone", d: `Site Armor adds ${apex} on our Cloudflare account.` },
                { n: "2", t: "Copy nameservers", d: "We show the two Cloudflare NS values to set at the registrar." },
                { n: "3", t: "Refresh until Active", d: "DNS and WAF tools unlock after the zone is active." },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex gap-3 rounded-xl border border-zinc-200/80 bg-[#fafafa] px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-accent-light text-[11px] font-bold text-accent">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{s.t}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <McAlert variant="warning" title="Nameserver change is live traffic">
              Wrong nameservers can break the site and email. Prefer a test domain first if unsure.
            </McAlert>
            <Button onClick={handleHosted} loading={busy} disabled={busy}>
              Create Free zone for {apex}
            </Button>
          </div>
        </McCard>
      )}

      {/* Connected */}
      {connected && status && (
        <>
          {status.last_error && (
            <McAlert variant="error" title="Connection issue">
              {status.last_error}
            </McAlert>
          )}

          {status.status === "active" ? (
            <McAlert variant="success" title="Zone is active">
              <span className="font-semibold">{status.zone_name}</span> is live on Cloudflare.
              DNS record and WAF editors arrive in the next phases.
            </McAlert>
          ) : (
            <McCard
              title="Update nameservers at your registrar"
              icon={<Server size={14} />}
              action={
                nameservers.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(nameservers.join("\n"), "Nameservers")}
                  >
                    <Copy size={13} />
                    Copy all
                  </Button>
                ) : null
              }
            >
              <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
                At GoDaddy, Namecheap, or your registrar, replace the current nameservers with
                these Cloudflare values, then click Refresh above.
              </p>
              <ul className="space-y-2">
                {nameservers.map((ns, i) => (
                  <li
                    key={ns}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-[#eef1f6] text-[10px] font-bold text-muted-foreground">
                      NS{i + 1}
                    </span>
                    <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground">
                      {ns}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText(ns, "Nameserver")}
                      className="inline-flex items-center gap-1 rounded-[4px] border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:border-zinc-300 hover:text-foreground"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
              {nameservers.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                  No nameservers returned yet — try Refresh.
                </p>
              )}
            </McCard>
          )}

          <McCard title="Connection" icon={<KeyRound size={14} />}>
            <dl className="grid gap-2 sm:grid-cols-2">
              <InfoCell label="Zone" value={status.zone_name || "—"} mono />
              <InfoCell label="Mode" value={status.mode === "hosted" ? "Hosted Free" : "Client token"} />
              <InfoCell
                label="Last verified"
                value={
                  status.last_verified_at
                    ? new Date(status.last_verified_at).toLocaleString()
                    : "—"
                }
              />
              <InfoCell label="Zone ID" value={status.zone_id || "—"} mono />
            </dl>
          </McCard>
        </>
      )}
    </div>
  );
}

function ModeOption({
  icon,
  tone,
  title,
  body,
  cta,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  tone: "accent" | "good";
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3.5 text-left transition hover:border-zinc-300 hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <McIconBox icon={icon} tone={tone} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <span className="shrink-0 text-[12px] font-semibold text-accent opacity-80 group-hover:opacity-100">
        {cta} →
      </span>
    </button>
  );
}

function InfoCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-[#fafafa] px-3 py-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-[12px] font-medium text-foreground ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
