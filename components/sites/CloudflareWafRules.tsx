"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McCard, McPill } from "@/components/shared/MalCareUI";
import { cn } from "@/lib/utils";
import {
  applyWafStarterPack,
  createRateLimitRule,
  createWafRule,
  deleteRateLimitRule,
  deleteWafRule,
  getWafTemplates,
  listWafRules,
  updateWafRule,
  type CloudflareWafRule,
  type WafCondition,
} from "@/lib/api/cloudflare";

type CreateMode = null | "custom" | "rate_limit" | "templates";

const FIELDS = [
  { value: "path", label: "URI Path" },
  { value: "query", label: "URI Query" },
  { value: "host", label: "Hostname" },
  { value: "method", label: "Method" },
  { value: "user_agent", label: "User Agent" },
  { value: "ip", label: "IP source address" },
  { value: "country", label: "Country" },
] as const;

const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "ne", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
] as const;

const FIELD_CF: Record<string, { field: string; quote: boolean }> = {
  path: { field: "http.request.uri.path", quote: true },
  query: { field: "http.request.uri.query", quote: true },
  host: { field: "http.host", quote: true },
  method: { field: "http.request.method", quote: true },
  user_agent: { field: "http.user_agent", quote: true },
  ip: { field: "ip.src", quote: false },
  country: { field: "ip.src.country", quote: true },
};

function escapeStr(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function previewExpression(conditions: WafCondition[], combinator: "and" | "or") {
  const parts = conditions
    .filter((c) => c.field && c.operator && (c.value || c.operator === "eq"))
    .map((c) => {
      const meta = FIELD_CF[c.field];
      if (!meta) return "";
      const val = c.value.trim();
      if (c.field === "country") {
        const cc = val.toUpperCase();
        return `ip.src.country ${c.operator === "ne" ? "ne" : "eq"} "${cc}"`;
      }
      const rhs = meta.quote ? `"${escapeStr(val)}"` : val;
      if (c.operator === "not_contains") return `not (${meta.field} contains ${rhs})`;
      return `${meta.field} ${c.operator} ${rhs}`;
    })
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return `(${parts.join(combinator === "or" ? " or " : " and ")})`;
}

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
  const [rateLimits, setRateLimits] = useState<CloudflareWafRule[]>([]);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(5);
  const [rlCount, setRlCount] = useState(0);
  const [rlLimit, setRlLimit] = useState(1);
  const [allowlistConfigured, setAllowlistConfigured] = useState(false);
  const [starterApplied, setStarterApplied] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    rule: CloudflareWafRule;
    kind: "custom" | "rate_limit";
  } | null>(null);

  // Custom rule form
  const [description, setDescription] = useState("");
  const [action, setAction] = useState<"block" | "managed_challenge">("block");
  const [enabled, setEnabled] = useState(true);
  const [editRaw, setEditRaw] = useState(false);
  const [expression, setExpression] = useState("");
  const [combinator, setCombinator] = useState<"and" | "or">("and");
  const [conditions, setConditions] = useState<WafCondition[]>([
    { field: "path", operator: "contains", value: "" },
  ]);

  // Rate limit form
  const [rlDescription, setRlDescription] = useState("Rate-limit login");
  const [rlPath, setRlPath] = useState("/wp-login.php");
  const [rlAction, setRlAction] = useState<"block" | "managed_challenge">("managed_challenge");
  const [rlRequests, setRlRequests] = useState("20");

  // Templates
  const [templates, setTemplates] = useState<Awaited<
    ReturnType<typeof getWafTemplates>
  > | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listWafRules(siteId);
      setRules(data.rules);
      setRateLimits(data.rate_limit_rules || []);
      setCount(data.count);
      setLimit(data.limit);
      setRlCount(data.rate_limit_count ?? (data.rate_limit_rules || []).length);
      setRlLimit(data.rate_limit_limit ?? 1);
      setAllowlistConfigured(!!data.allowlist_configured);
      setStarterApplied(!!data.starter_applied);
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

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const builtPreview = useMemo(
    () => previewExpression(conditions, combinator),
    [conditions, combinator]
  );

  useEffect(() => {
    if (!editRaw) setExpression(builtPreview);
  }, [builtPreview, editRaw]);

  const resetCustomForm = () => {
    setDescription("");
    setAction("block");
    setEnabled(true);
    setEditRaw(false);
    setExpression("");
    setCombinator("and");
    setConditions([{ field: "path", operator: "contains", value: "" }]);
    setCreateMode(null);
  };

  const openTemplates = async () => {
    setCreateMode("templates");
    setMenuOpen(false);
    try {
      setTemplates(await getWafTemplates(siteId));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCreateCustom = async () => {
    const expr = editRaw ? expression.trim() : builtPreview;
    if (!expr) {
      toast.error("Add at least one complete condition, or edit the expression");
      return;
    }
    setBusy(true);
    try {
      await createWafRule(siteId, {
        action,
        description: description.trim() || "Custom security rule",
        enabled,
        preset: editRaw ? "expression" : "builder",
        expression: editRaw ? expr : undefined,
        conditions: editRaw ? undefined : conditions,
        combinator: editRaw ? undefined : combinator,
      });
      toast.success("Custom rule created");
      resetCustomForm();
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRateLimit = async () => {
    if (!rlPath.trim()) {
      toast.error("Path is required");
      return;
    }
    setBusy(true);
    try {
      await createRateLimitRule(siteId, {
        action: rlAction,
        description: rlDescription.trim() || "Rate limit rule",
        path: rlPath.trim(),
        requests_per_period: Number(rlRequests) || 20,
      });
      toast.success("Rate limiting rule created");
      setCreateMode(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleApplyStarter = async (force: boolean) => {
    setBusy(true);
    try {
      const data = await applyWafStarterPack(siteId, force);
      if (data.skipped) {
        toast.message(data.reason || "Starter pack already applied");
      } else {
        toast.success(`Applied ${data.created ?? 0} starter rule(s)`);
        if (data.errors?.length) toast.message(data.errors.slice(0, 2).join(" · "));
      }
      setCreateMode(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleEnabled = async (r: CloudflareWafRule) => {
    if (r.kind === "rate_limit") {
      toast.message("Toggle rate-limit status from Cloudflare if needed — custom toggle supports custom rules");
      return;
    }
    setBusy(true);
    try {
      await updateWafRule(siteId, r.id, { enabled: !r.enabled });
      await load();
      toast.success(!r.enabled ? "Rule activated" : "Rule disabled");
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
      if (deleteTarget.kind === "rate_limit") {
        await deleteRateLimitRule(siteId, deleteTarget.rule.id);
      } else {
        await deleteWafRule(siteId, deleteTarget.rule.id);
      }
      toast.success("Rule deleted");
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
        title="Delete security rule?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.rule.description || deleteTarget.rule.action}”?`
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
          <h2 className="text-[15px] font-bold text-foreground">Security rules</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Zone <span className="font-mono font-medium text-foreground">{zoneName}</span>
            {" · "}Up to {limit} custom rules and {rlLimit} rate-limiting rule on Free.
            {allowlistConfigured ? " Site Armor scanners are excluded from new rules." : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setLoading(true); load(); }} disabled={busy}>
            <RefreshCw size={13} />
            Refresh
          </Button>
          <div className="relative" ref={menuRef}>
            <Button
              size="sm"
              onClick={() => setMenuOpen((o) => !o)}
              disabled={busy}
            >
              <Plus size={13} />
              Create rule
              <ChevronDown size={13} />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                <MenuItem
                  label="Custom rules"
                  hint={`${count}/${limit} used`}
                  disabled={count >= limit}
                  onClick={() => {
                    setCreateMode("custom");
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  label="Rate limiting rules"
                  hint={`${rlCount}/${rlLimit} used · Free: 10s window`}
                  disabled={rlCount >= rlLimit}
                  onClick={() => {
                    setCreateMode("rate_limit");
                    setMenuOpen(false);
                  }}
                />
                <div className="my-1 border-t border-zinc-100" />
                <MenuItem
                  label="Templates"
                  hint="Starter pack for WP / bots"
                  onClick={openTemplates}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!starterApplied && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Recommended: apply starter protection</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Three custom rules and one rate limit for common WordPress and bot abuse. Uses 3 of {limit} custom slots.
            </p>
          </div>
          <Button size="sm" onClick={() => handleApplyStarter(false)} loading={busy} disabled={busy}>
            Apply starter pack
          </Button>
        </div>
      )}

      {createMode === "custom" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-[16px] font-bold text-foreground">Create custom rule</h3>
            <button
              type="button"
              disabled={busy}
              onClick={resetCustomForm}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <label className="mb-3 block space-y-1.5">
            <span className="text-[12px] font-medium">Rule name</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Block wp-login probes"
              className={inputClass}
            />
          </label>

          <p className="mb-2 text-[13px] font-semibold text-foreground">
            When incoming requests match…
          </p>

          {!editRaw ? (
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <FieldSelect
                    label={i === 0 ? "Field" : undefined}
                    value={c.field}
                    onChange={(field) =>
                      setConditions((prev) =>
                        prev.map((row, idx) => (idx === i ? { ...row, field } : row))
                      )
                    }
                    options={FIELDS.map((f) => ({ value: f.value, label: f.label }))}
                  />
                  <FieldSelect
                    label={i === 0 ? "Operator" : undefined}
                    value={c.operator}
                    onChange={(operator) =>
                      setConditions((prev) =>
                        prev.map((row, idx) => (idx === i ? { ...row, operator } : row))
                      )
                    }
                    options={OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                  <label className="min-w-[140px] flex-1 space-y-1.5">
                    {i === 0 && <span className="text-[12px] font-medium">Value</span>}
                    <input
                      value={c.value}
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((row, idx) =>
                            idx === i ? { ...row, value: e.target.value } : row
                          )
                        )
                      }
                      placeholder={c.field === "country" ? "CN" : "/admin"}
                      className={inputClass}
                    />
                  </label>
                  {conditions.length > 1 && (
                    <button
                      type="button"
                      className="mb-0.5 rounded-md border border-zinc-200 p-2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setConditions((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Remove condition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCombinator("and");
                    setConditions((prev) => [
                      ...prev,
                      { field: "path", operator: "contains", value: "" },
                    ]);
                  }}
                >
                  And
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCombinator("or");
                    setConditions((prev) => [
                      ...prev,
                      { field: "path", operator: "contains", value: "" },
                    ]);
                  }}
                >
                  Or
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-zinc-200 bg-[#f7f8fa] p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Expression preview
              </span>
              <button
                type="button"
                className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                onClick={() => {
                  if (!editRaw) setExpression(builtPreview);
                  setEditRaw((v) => !v);
                }}
              >
                {editRaw ? "Use visual builder" : "Edit expression"}
              </button>
            </div>
            {editRaw ? (
              <textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                placeholder='http.request.uri.path contains "/xmlrpc.php"'
              />
            ) : (
              <code className="block break-all font-mono text-[12px] text-foreground">
                {builtPreview || "—"}
              </code>
            )}
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {(editRaw ? expression : builtPreview).length} / 4096 characters
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Then take action…</span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as "block" | "managed_challenge")}
                className={inputClass}
              >
                <option value="block">Block</option>
                <option value="managed_challenge">Managed Challenge</option>
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium">Status</span>
              <div className="flex h-10 items-center gap-4 rounded-md border border-zinc-300 px-3">
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    checked={!enabled}
                    onChange={() => setEnabled(false)}
                  />
                  Disabled
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    checked={enabled}
                    onChange={() => setEnabled(true)}
                  />
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleCreateCustom} loading={busy} disabled={busy}>
              <Shield size={14} />
              Deploy rule
            </Button>
            <Button variant="outline" disabled={busy} onClick={resetCustomForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {createMode === "rate_limit" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Create rate limiting rule</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Free plan allows one rule with a 10-second window, counted by client IP.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreateMode(null)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[12px] font-medium">Rule name</span>
              <input
                value={rlDescription}
                onChange={(e) => setRlDescription(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">URI path contains</span>
              <input
                value={rlPath}
                onChange={(e) => setRlPath(e.target.value)}
                placeholder="/wp-login.php"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Requests per 10 seconds</span>
              <input
                value={rlRequests}
                onChange={(e) => setRlRequests(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium">Action</span>
              <select
                value={rlAction}
                onChange={(e) =>
                  setRlAction(e.target.value as "block" | "managed_challenge")
                }
                className={inputClass}
              >
                <option value="managed_challenge">Managed Challenge</option>
                <option value="block">Block</option>
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleCreateRateLimit} loading={busy} disabled={busy}>
              Deploy rate limit
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setCreateMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {createMode === "templates" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Templates</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Recommended Free starter pack: 3 custom rules and 1 rate-limiting rule.
                Two custom rule slots remain available afterward.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreateMode(null)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
          {templates ? (
            <ul className="mb-4 space-y-2">
              {templates.custom.map((t) => (
                <li
                  key={t.key}
                  className="rounded-lg border border-zinc-100 bg-[#fafafa] px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold">{t.description}</span>
                    <McPill tone={t.action === "block" ? "bad" : "warn"}>
                      {t.action === "managed_challenge" ? "Challenge" : "Block"}
                    </McPill>
                  </div>
                  <code className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">
                    {t.expression}
                  </code>
                </li>
              ))}
              <li className="rounded-lg border border-zinc-100 bg-[#fafafa] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold">
                    {templates.rate_limit.description}
                  </span>
                  <McPill tone="warn">Rate limit · {templates.rate_limit.requests_per_period}/10s</McPill>
                </div>
                <code className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">
                  {templates.rate_limit.expression}
                </code>
              </li>
            </ul>
          ) : (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleApplyStarter(starterApplied)}
              loading={busy}
              disabled={busy}
            >
              {starterApplied ? "Re-apply missing templates" : "Apply starter pack"}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setCreateMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold text-foreground">Custom rules</h3>
          <McPill tone={count >= limit ? "bad" : "neutral"}>
            {count}/{limit} rules
          </McPill>
        </div>
        <McCard flush>
          <RuleList
            rules={rules}
            empty="No custom rules created"
            busy={busy}
            onToggle={handleToggleEnabled}
            onDelete={(r) => setDeleteTarget({ rule: r, kind: "custom" })}
          />
        </McCard>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold text-foreground">Rate limiting rules</h3>
          <McPill tone={rlCount >= rlLimit ? "bad" : "neutral"}>
            {rlCount}/{rlLimit} rules
          </McPill>
        </div>
        <McCard flush>
          <RuleList
            rules={rateLimits}
            empty="No rate limiting rules created"
            busy={busy}
            showRateMeta
            onToggle={handleToggleEnabled}
            onDelete={(r) => setDeleteTarget({ rule: r, kind: "rate_limit" })}
          />
        </McCard>
      </section>
    </div>
  );
}

function MenuItem({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start px-3 py-2 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </button>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[130px] space-y-1.5">
      {label ? <span className="text-[12px] font-medium">{label}</span> : null}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RuleList({
  rules,
  empty,
  busy,
  showRateMeta,
  onToggle,
  onDelete,
}: {
  rules: CloudflareWafRule[];
  empty: string;
  busy: boolean;
  showRateMeta?: boolean;
  onToggle: (r: CloudflareWafRule) => void;
  onDelete: (r: CloudflareWafRule) => void;
}) {
  if (!rules.length) {
    return (
      <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{empty}</p>
    );
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {rules.map((r) => (
        <li
          key={r.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">
                {r.description || "Untitled rule"}
              </p>
              <McPill tone={r.action === "block" ? "bad" : "warn"}>
                {r.action === "managed_challenge" ? "Challenge" : "Block"}
              </McPill>
              {showRateMeta && r.ratelimit?.requests_per_period != null && (
                <McPill tone="neutral">
                  {r.ratelimit.requests_per_period}/{r.ratelimit.period ?? 10}s
                </McPill>
              )}
              {r.created_by_site_armor && <McPill tone="accent">Site Armor</McPill>}
              {!r.enabled && <McPill tone="neutral">Disabled</McPill>}
              {r.enabled && <McPill tone="good">Active</McPill>}
            </div>
            <code className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">
              {r.expression}
            </code>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {!showRateMeta && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onToggle(r)}
                className="rounded-[4px] border border-zinc-200 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                {r.enabled ? "Disable" : "Enable"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(r)}
              className="inline-flex items-center gap-1 rounded-[4px] border border-zinc-200 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-[var(--score-bad-border)] hover:text-[var(--score-bad)]"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] text-foreground outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20";
