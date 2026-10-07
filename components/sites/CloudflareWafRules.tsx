"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Shield, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McAlert, McCard, McPill } from "@/components/shared/MalCareUI";
import {
  createWafRule,
  deleteWafRule,
  listWafRules,
  type CloudflareWafRule,
  type WafRuleInput,
} from "@/lib/api/cloudflare";

type Preset = "path" | "ip" | "country" | "advanced";

export function CloudflareWafRules({
  siteId,
  zoneName,
}: {
  siteId: string;
  zoneName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rules, setRules] = useState<CloudflareWafRule[]>([]);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(5);
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudflareWafRule | null>(null);

  const [preset, setPreset] = useState<Preset>("path");
  const [action, setAction] = useState<"block" | "managed_challenge">("block");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [ip, setIp] = useState("");
  const [country, setCountry] = useState("");
  const [expression, setExpression] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listWafRules(siteId);
      setRules(data.rules);
      setCount(data.count);
      setLimit(data.limit);
      setAllowlist(data.allowlist_ips || []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const resetForm = () => {
    setPreset("path");
    setAction("block");
    setDescription("");
    setPath("");
    setIp("");
    setCountry("");
    setExpression("");
    setShowForm(false);
  };

  const handleCreate = async () => {
    const input: WafRuleInput = {
      action,
      description: description.trim() || "Site Armor rule",
      preset,
    };
    if (preset === "path") input.path = path.trim();
    if (preset === "ip") input.ip = ip.trim();
    if (preset === "country") input.country = country.trim().toUpperCase();
    if (preset === "advanced") input.expression = expression.trim();

    setBusy(true);
    try {
      await createWafRule(siteId, input);
      toast.success("WAF rule created");
      resetForm();
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteWafRule(siteId, deleteTarget.id);
      toast.success("WAF rule deleted");
      setDeleteTarget(null);
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

  return (
    <div className="space-y-4">
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete WAF rule?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.description || deleteTarget.action}”? Traffic matching this rule will no longer be challenged or blocked.`
            : ""
        }
        confirmText="Delete rule"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={busy}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">WAF rules</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Zone <span className="font-mono font-medium text-foreground">{zoneName}</span>
            {" · "}Custom rules only (Free: max {limit}). Managed Free ruleset stays on at Cloudflare.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <McPill tone={count >= limit ? "bad" : "neutral"}>
            {count} / {limit}
          </McPill>
          <Button size="sm" variant="outline" onClick={() => { setLoading(true); load(); }} disabled={busy}>
            <RefreshCw size={13} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} disabled={busy || count >= limit || showForm}>
            <Plus size={13} />
            Add rule
          </Button>
        </div>
      </div>

      {allowlist.length > 0 ? (
        <McAlert variant="info" title="Site Armor IPs are allowlisted">
          New rules automatically skip: {allowlist.join(", ")}
        </McAlert>
      ) : (
        <McAlert variant="warning" title="No SITEARMOR_EGRESS_IPS configured">
          Set server egress IPs in env so new block rules do not lock out Site Armor scans.
        </McAlert>
      )}

      {showForm && (
        <div className="overflow-visible rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-[16px] font-bold text-foreground">Add rule</h3>
            <button
              type="button"
              disabled={busy}
              onClick={resetForm}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Match</span>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as Preset)}
                className={inputClass}
              >
                <option value="path">URI path contains</option>
                <option value="ip">IP equals</option>
                <option value="country">Country equals</option>
                <option value="advanced">Advanced expression</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Action</span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as "block" | "managed_challenge")}
                className={inputClass}
              >
                <option value="block">Block</option>
                <option value="managed_challenge">Managed Challenge</option>
              </select>
            </label>
          </div>

          <div className="mt-3 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Description</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Block wp-login probes"
                className={inputClass}
              />
            </label>

            {preset === "path" && (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">Path contains</span>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/wp-login.php"
                  className={inputClass}
                />
              </label>
            )}
            {preset === "ip" && (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">IP address</span>
                <input
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="203.0.113.10"
                  className={inputClass}
                />
              </label>
            )}
            {preset === "country" && (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">Country code</span>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="CN"
                  maxLength={2}
                  className={inputClass}
                />
              </label>
            )}
            {preset === "advanced" && (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium">Expression</span>
                <textarea
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  rows={3}
                  placeholder='http.request.uri.path contains "/xmlrpc.php"'
                  className={`${inputClass} h-auto py-2 font-mono text-[12px]`}
                />
              </label>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleCreate} loading={busy} disabled={busy}>
              <Shield size={14} />
              Save rule
            </Button>
            <Button variant="outline" disabled={busy} onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <McCard flush>
        <ul className="divide-y divide-zinc-100">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold text-foreground">
                    {r.description || "Untitled rule"}
                  </p>
                  <McPill tone={r.action === "block" ? "bad" : "warn"}>
                    {r.action === "managed_challenge" ? "Challenge" : "Block"}
                  </McPill>
                  {r.created_by_site_armor && (
                    <McPill tone="accent">Site Armor</McPill>
                  )}
                  {!r.enabled && <McPill tone="neutral">Disabled</McPill>}
                </div>
                <code className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">
                  {r.expression}
                </code>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeleteTarget(r)}
                className="inline-flex shrink-0 items-center gap-1 self-start rounded-[4px] border border-zinc-200 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-[var(--score-bad-border)] hover:text-[var(--score-bad)]"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </li>
          ))}
          {rules.length === 0 && (
            <li className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              No custom WAF rules yet. Add a rule to block or challenge matching requests.
            </li>
          )}
        </ul>
      </McCard>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] text-foreground outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20";
