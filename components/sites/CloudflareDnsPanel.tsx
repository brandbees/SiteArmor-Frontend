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
  Shield,
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
import { CloudflareDnsRecords } from "@/components/sites/CloudflareDnsRecords";
import { CloudflareWafRules } from "@/components/sites/CloudflareWafRules";
import type { Site } from "@/types";
import { cn } from "@/lib/utils";

type ModePick = "choose" | "byo" | "hosted";
type SideNav = "connection" | "dns" | "waf";

export function CloudflareDnsPanel({ site }: { site: Site }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<CloudflareConnectionStatus | null>(null);
  const [modePick, setModePick] = useState<ModePick>("choose");
  const [sideNav, setSideNav] = useState<SideNav>("connection");
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
  const apex = status?.apex || status?.zone_name || "this domain";
  const statusTone =
    status?.status === "active" ? "good" : status?.status === "error" ? "bad" : "warn";
  /** DNS manageable as soon as a zone is linked; WAF waits for Active. */
  const dnsReady = connected && !!status?.zone_id;
  const zoneActive = connected && status?.status === "active";

  return (
    <div className="w-full space-y-4">
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

      {/* Full-width status strip */}
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
                Manage DNS and security rules for this site through Cloudflare.
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-foreground/80">
                Zone apex · {apex}
                {status?.zone_name ? ` · ${status.zone_name}` : ""}
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

      {/* Sidebar + main — full width */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_1px_2px_rgb(26_29_35/0.04)] lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Cloudflare
          </p>
          <nav className="space-y-0.5">
            <SideItem
              active={sideNav === "connection"}
              icon={<Server size={14} />}
              label="Connection"
              hint={connected ? (status?.status === "active" ? "Active" : "Pending") : "Setup"}
              onClick={() => setSideNav("connection")}
            />
            <SideItem
              active={sideNav === "dns"}
              icon={<Cloud size={14} />}
              label="DNS records"
              hint={dnsReady ? "Manage" : "Needs zone"}
              disabled={!dnsReady}
              onClick={() => dnsReady && setSideNav("dns")}
            />
            <SideItem
              active={sideNav === "waf"}
              icon={<Shield size={14} />}
              label="WAF rules"
              hint={zoneActive ? "Manage" : "Needs active zone"}
              disabled={!zoneActive}
              onClick={() => zoneActive && setSideNav("waf")}
            />
          </nav>
          <div className="mt-3 border-t border-zinc-100 px-2.5 pt-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Free plan: up to 5 custom security rules and 1 rate-limiting rule.
            </p>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {sideNav === "dns" && dnsReady && (
            <CloudflareDnsRecords
              siteId={site.id}
              zoneName={status?.zone_name || apex}
            />
          )}

          {sideNav === "waf" && zoneActive && (
            <CloudflareWafRules
              siteId={site.id}
              zoneName={status?.zone_name || apex}
            />
          )}

          {sideNav === "connection" && (
            <>
              {!connected && modePick === "choose" && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ModeCard
                    icon={<KeyRound size={18} />}
                    tone="accent"
                    title="Use an existing Cloudflare account"
                    body="Connect with a scoped API token for this zone. The client retains ownership of their Cloudflare account."
                    cta="Connect with token"
                    onClick={() => setModePick("byo")}
                  />
                  <ModeCard
                    icon={<Cloud size={18} />}
                    tone="good"
                    title="Hosted Free on Site Armor"
                    body={
                      status?.hosted_available === false
                        ? "Hosted Free is not available on this server yet. Contact support if you need it enabled."
                        : "Site Armor creates a Free Cloudflare zone. Update nameservers at the registrar to activate."
                    }
                    cta="Start Hosted Free"
                    disabled={status?.hosted_available === false}
                    onClick={() => setModePick("hosted")}
                  />
                </div>
              )}

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
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                    <div className="rounded-xl border border-zinc-200 bg-[#f7f8fa] px-3.5 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                        Token checklist
                      </p>
                      <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-foreground/90">
                        <li>1. Cloudflare → My Profile → API Tokens → Create Token</li>
                        <li>2. Permissions: Zone Read · DNS Edit · Zone WAF Edit</li>
                        <li>
                          3. Zone Resources → Include →{" "}
                          <span className="font-mono font-semibold">{apex}</span>
                        </li>
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-semibold text-foreground">API token</label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="Paste token — encrypted at rest, never shown again"
                          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                        />
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Same vault pattern as SSH credentials.
                        </p>
                      </div>
                      <Button onClick={handleByo} loading={busy} disabled={busy}>
                        Connect &amp; save token
                      </Button>
                    </div>
                  </div>
                </McCard>
              )}

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
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <ol className="space-y-2.5">
                      {[
                        { n: "1", t: "Create Free zone", d: `Site Armor adds ${apex} on our Cloudflare account.` },
                        { n: "2", t: "Copy nameservers", d: "Set the two Cloudflare NS values at the registrar." },
                        { n: "3", t: "Refresh until Active", d: "DNS and WAF tools unlock when the zone is active." },
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
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                      <McAlert variant="warning" title="Nameserver changes affect live traffic">
                        Incorrect nameservers can interrupt the website and email. Prefer testing on a non-production domain first.
                      </McAlert>
                      <Button onClick={handleHosted} loading={busy} disabled={busy}>
                        Create Free zone for {apex}
                      </Button>
                    </div>
                  </div>
                </McCard>
              )}

              {connected && status && (
                <>
                  {status.last_error && (
                    <McAlert variant="error" title="Connection issue">
                      {status.last_error}
                    </McAlert>
                  )}

                  {status.status === "active" ? (
                    <McAlert variant="success" title={`${status.zone_name} is active`}>
                      DNS records and security rules are available in the sidebar.
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
                        Replace the domain&apos;s nameservers at the registrar with the Cloudflare values below,
                        then click Refresh to verify.
                      </p>
                      <ul className="grid gap-2 sm:grid-cols-2">
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

                  <McCard title="Connection details" icon={<KeyRound size={14} />}>
                    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoCell label="Zone" value={status.zone_name || "—"} mono />
                      <InfoCell
                        label="Mode"
                        value={status.mode === "hosted" ? "Hosted Free" : "Client token"}
                      />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SideItem({
  active,
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
        active
          ? "bg-accent-light text-accent"
          : "text-foreground hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-45 hover:bg-transparent"
      )}
    >
      <span className={cn("shrink-0", active ? "text-accent" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold">{label}</span>
        <span
          className={cn(
            "block text-[10px] font-medium",
            active ? "text-accent/80" : "text-muted-foreground"
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

function ModeCard({
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
      className="flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-[0_1px_2px_rgb(26_29_35/0.04)] transition hover:border-zinc-300 hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <McIconBox icon={icon} tone={tone} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-foreground">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <span className="text-[12px] font-semibold text-accent">{cta} →</span>
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
