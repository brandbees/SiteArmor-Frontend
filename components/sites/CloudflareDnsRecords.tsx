"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Cloud, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McCard, McPill } from "@/components/shared/MalCareUI";
import { cn } from "@/lib/utils";
import {
  createDnsRecord,
  deleteDnsRecord,
  listDnsRecords,
  updateDnsRecord,
  type CloudflareDnsRecord,
  type DnsRecordInput,
} from "@/lib/api/cloudflare";

const TYPES = ["A", "AAAA", "CNAME", "TXT", "MX"] as const;

/** Cloudflare dashboard TTL options (seconds). Auto = 1 in the API. */
const TTL_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "60", label: "1 min" },
  { value: "120", label: "2 min" },
  { value: "300", label: "5 min" },
  { value: "600", label: "10 min" },
  { value: "900", label: "15 min" },
  { value: "1800", label: "30 min" },
  { value: "3600", label: "1 hr" },
  { value: "7200", label: "2 hr" },
  { value: "18000", label: "5 hr" },
  { value: "43200", label: "12 hr" },
  { value: "86400", label: "1 day" },
];

type FormState = {
  type: (typeof TYPES)[number];
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
  priority: string;
};

const emptyForm = (): FormState => ({
  type: "A",
  name: "@",
  content: "",
  ttl: "auto",
  proxied: true,
  priority: "10",
});

function ttlToFormValue(ttl: number): string {
  if (ttl === 1) return "auto";
  const match = TTL_OPTIONS.find((o) => o.value === String(ttl));
  return match ? match.value : String(ttl);
}

function recordToForm(r: CloudflareDnsRecord): FormState {
  return {
    type: (TYPES.includes(r.type as (typeof TYPES)[number])
      ? r.type
      : "A") as FormState["type"],
    name: r.name,
    content: r.content,
    ttl: ttlToFormValue(r.ttl),
    proxied: !!r.proxied,
    priority: r.priority != null ? String(r.priority) : "10",
  };
}

/** DKIM / mail CNAMEs must stay DNS-only. */
function shouldForceDnsOnly(type: string, name: string) {
  const n = name.toLowerCase();
  return (
    type === "MX" ||
    type === "TXT" ||
    n.includes("_domainkey") ||
    n.startsWith("mail.") ||
    n.includes(".mail.")
  );
}

export function CloudflareDnsRecords({
  siteId,
  zoneName,
}: {
  siteId: string;
  zoneName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [records, setRecords] = useState<CloudflareDnsRecord[]>([]);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(200);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CloudflareDnsRecord | null>(null);
  const [mxConfirm, setMxConfirm] = useState<{
    mode: "save" | "delete";
    record?: CloudflareDnsRecord;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listDnsRecords(siteId);
      setRecords(data.records);
      setCount(data.count);
      setLimit(data.limit);
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

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.type.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
    );
  }, [records, filter]);

  const proxyable = form.type === "A" || form.type === "AAAA" || form.type === "CNAME";
  const isMx = form.type === "MX";

  const buildInput = (): DnsRecordInput => ({
    type: form.type,
    name: form.name.trim() || "@",
    content: form.content.trim(),
    ttl: form.ttl === "auto" ? "auto" : Number(form.ttl) || 1,
    proxied: proxyable ? form.proxied : false,
    priority: isMx ? Number(form.priority) : undefined,
  });

  const runSave = async (confirmMx: boolean) => {
    const input = buildInput();
    if (!input.content) {
      toast.error("Content is required");
      return;
    }
    if (isMx) input.confirm_mx = confirmMx;

    setBusy(true);
    try {
      if (editingId) {
        await updateDnsRecord(siteId, editingId, input);
        toast.success("Record updated");
      } else {
        await createDnsRecord(siteId, input);
        toast.success("Record created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      setMxConfirm(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveClick = () => {
    if (isMx || (editingId && records.find((r) => r.id === editingId)?.type === "MX")) {
      setMxConfirm({ mode: "save" });
      return;
    }
    runSave(false);
  };

  const handleDelete = async (confirmMx: boolean) => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteDnsRecord(siteId, deleteTarget.id, confirmMx);
      toast.success("Record deleted");
      setDeleteTarget(null);
      setMxConfirm(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (r: CloudflareDnsRecord) => {
    if (!TYPES.includes(r.type as (typeof TYPES)[number])) {
      toast.error(`${r.type} records are view-only in Site Armor`);
      return;
    }
    setEditingId(r.id);
    setForm(recordToForm(r));
    setShowForm(true);
  };

  const toggleProxied = async (r: CloudflareDnsRecord) => {
    if (!r.proxiable && !["A", "AAAA", "CNAME"].includes(r.type)) {
      toast.error("This record type cannot be proxied");
      return;
    }
    setBusy(true);
    try {
      await updateDnsRecord(siteId, r.id, {
        type: r.type,
        name: r.name,
        content: r.content,
        ttl: r.ttl,
        proxied: !r.proxied,
        priority: r.priority ?? undefined,
        confirm_mx: r.type === "MX" ? true : undefined,
      });
      await load();
      toast.success(!r.proxied ? "Proxied (orange cloud)" : "DNS only");
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
        isOpen={!!mxConfirm && mxConfirm.mode === "save"}
        title="Confirm MX change?"
        message="MX records control email. A wrong value can take mail offline for this domain. Continue only if you are sure."
        confirmText="Save MX record"
        isDangerous
        onConfirm={() => runSave(true)}
        onCancel={() => setMxConfirm(null)}
        isLoading={busy}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget && deleteTarget.type !== "MX"}
        title="Delete DNS record?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.type} ${deleteTarget.name} → ${deleteTarget.content}?`
            : ""
        }
        confirmText="Delete"
        isDangerous
        onConfirm={() => handleDelete(false)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={busy}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget && deleteTarget.type === "MX"}
        title="Delete MX record?"
        message="Deleting MX can break email for this domain. Only continue if you intend to remove this mail route."
        confirmText="Delete MX"
        isDangerous
        onConfirm={() => handleDelete(true)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={busy}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">DNS records</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Zone <span className="font-mono font-medium text-foreground">{zoneName}</span>
            {" · "}Editable: A, AAAA, CNAME, TXT, MX. Free plan max {limit} records.
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
          <Button size="sm" onClick={startCreate} disabled={busy || count >= limit}>
            <Plus size={13} />
            Add record
          </Button>
        </div>
      </div>

      {showForm && (
          <div className="overflow-visible rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgb(26_29_35/0.04)] sm:p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-[16px] font-bold text-foreground">
                {editingId ? "Edit record" : "Add record"}
              </h3>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-muted-foreground transition hover:border-zinc-300 hover:text-foreground"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
              {recordSummary(form, zoneName, proxyable)}
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value as FormState["type"];
                      setForm((f) => {
                        const forceDns = shouldForceDnsOnly(type, f.name);
                        const canProxy = ["A", "AAAA", "CNAME"].includes(type);
                        const proxied = forceDns ? false : canProxy ? (f.proxied || true) : false;
                        return {
                          ...f,
                          type,
                          proxied,
                          ttl: proxied ? "auto" : f.ttl,
                        };
                      });
                    }}
                    className={inputClass}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => {
                        const forceDns = shouldForceDnsOnly(f.type, name);
                        const proxied = forceDns ? false : f.proxied;
                        return {
                          ...f,
                          name,
                          proxied,
                          ttl: proxied ? "auto" : f.ttl,
                        };
                      });
                    }}
                    placeholder="Use @ for root"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div
                className={cn(
                  "grid grid-cols-1 gap-3",
                  isMx
                    ? "sm:grid-cols-[minmax(0,1fr)_100px_120px]"
                    : proxyable
                      ? "sm:grid-cols-[minmax(0,1.2fr)_minmax(160px,auto)_120px]"
                      : "sm:grid-cols-[minmax(0,1fr)_120px]"
                )}
              >
                <Field
                  label={
                    form.type === "A"
                      ? "IPv4 address"
                      : form.type === "AAAA"
                        ? "IPv6 address"
                        : form.type === "CNAME"
                          ? "Target"
                          : isMx
                            ? "Mail server"
                            : "Content"
                  }
                >
                  <input
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder={
                      form.type === "A"
                        ? "192.0.2.1"
                        : isMx
                          ? "mail.example.com"
                          : "Value"
                    }
                    className={inputClass}
                  />
                </Field>
                {isMx && (
                  <Field label="Priority">
                    <input
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      className={inputClass}
                    />
                  </Field>
                )}
                {proxyable && (
                  <Field label="Proxy status">
                    <ProxyToggle
                      proxied={form.proxied}
                      disabled={shouldForceDnsOnly(form.type, form.name)}
                      onChange={(proxied) =>
                        setForm((f) => ({
                          ...f,
                          proxied,
                          ttl: proxied ? "auto" : f.ttl,
                        }))
                      }
                    />
                  </Field>
                )}
                <Field label="TTL">
                  {proxyable && form.proxied ? (
                    <div
                      className="flex h-10 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-muted-foreground"
                      title="Cloudflare forces Auto TTL while the record is Proxied"
                    >
                      Auto
                      <span className="ml-auto text-[10px] font-medium">while Proxied</span>
                    </div>
                  ) : (
                    <TtlSelect
                      value={form.ttl}
                      onChange={(ttl) => setForm((f) => ({ ...f, ttl }))}
                    />
                  )}
                </Field>
              </div>
              {proxyable && form.proxied && (
                <p className="text-[11px] text-muted-foreground">
                  Turn Proxy off (DNS only) to choose a custom TTL — same as Cloudflare.
                </p>
              )}
              {shouldForceDnsOnly(form.type, form.name) && form.type === "CNAME" && (
                <p className="text-[11px] text-amber-700">
                  Mail/DKIM names should stay DNS only — proxy is turned off for this record.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={handleSaveClick} loading={busy} disabled={busy}>
                Save
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
      )}

      <McCard flush>
        <div className="border-b border-zinc-100 px-4 py-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by type, name, or content…"
            className={inputClass}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="bg-[#f7f8fa] text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Content</th>
                <th className="px-3 py-2.5">Proxy</th>
                <th className="px-3 py-2.5">TTL</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const editable = TYPES.includes(r.type as (typeof TYPES)[number]);
                return (
                  <tr key={r.id} className="border-t border-zinc-100 bg-white">
                    <td className="px-3 py-2.5">
                      <span className="rounded-[4px] border border-zinc-200 bg-[#fafafa] px-1.5 py-0.5 font-mono text-[11px] font-bold">
                        {r.type}
                      </span>
                      {r.priority != null && (
                        <span className="ml-1 text-[10px] text-muted-foreground">p{r.priority}</span>
                      )}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 font-mono text-foreground" title={r.name}>
                      {r.name}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2.5 font-mono text-muted-foreground" title={r.content}>
                      {r.content}
                    </td>
                    <td className="px-3 py-2.5">
                      {["A", "AAAA", "CNAME"].includes(r.type) ? (
                        <button
                          type="button"
                          disabled={busy || !editable}
                          onClick={() => toggleProxied(r)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-1 transition hover:border-zinc-300 disabled:opacity-40"
                          title={r.proxied ? "Proxied — click for DNS only" : "DNS only — click to proxy"}
                        >
                          <Cloud
                            size={14}
                            className={r.proxied ? "text-orange-500" : "text-zinc-400"}
                            fill={r.proxied ? "currentColor" : "none"}
                          />
                          <span
                            className={cn(
                              "text-[10px] font-bold",
                              r.proxied ? "text-orange-600" : "text-muted-foreground"
                            )}
                          >
                            {r.proxied ? "Proxied" : "DNS only"}
                          </span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {r.ttl === 1 ? "Auto" : TTL_OPTIONS.find((o) => o.value === String(r.ttl))?.label || r.ttl}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={!editable || busy}
                          onClick={() => startEdit(r)}
                          className="rounded-[4px] border border-zinc-200 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                          aria-label="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={!editable || busy}
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-[4px] border border-zinc-200 p-1.5 text-muted-foreground hover:text-[var(--score-bad)] disabled:opacity-40"
                          aria-label="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No DNS records match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </McCard>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] text-foreground outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function TtlSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (ttl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = TTL_OPTIONS.find((o) => o.value === value)?.label || value;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-ttl-select]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" data-ttl-select>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="text-[10px] leading-none text-muted-foreground">▴▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] max-h-56 overflow-y-auto rounded-md border border-zinc-300 bg-white py-1 shadow-lg"
        >
          {TTL_OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.value}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-zinc-50",
                  value === o.value && "bg-zinc-50 font-semibold"
                )}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
                {value === o.value ? <span className="text-accent">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProxyToggle({
  proxied,
  onChange,
  disabled,
}: {
  proxied: boolean;
  onChange: (proxied: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={proxied}
      disabled={disabled}
      onClick={() => !disabled && onChange(!proxied)}
      className={cn(
        "flex h-10 w-full items-center gap-2.5 rounded-md border border-zinc-300 bg-white px-2.5 transition hover:border-zinc-400",
        disabled && "cursor-not-allowed opacity-60 hover:border-zinc-300"
      )}
    >
      <span
        className={cn(
          "relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors",
          proxied ? "bg-[#2563eb]" : "bg-zinc-300"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform",
            proxied ? "left-[20px]" : "left-[2px]"
          )}
        />
      </span>
      <Cloud
        size={18}
        className={proxied ? "text-orange-500" : "text-zinc-400"}
        fill={proxied ? "currentColor" : "none"}
      />
      <span
        className={cn(
          "text-[12px] font-semibold",
          proxied ? "text-orange-600" : "text-muted-foreground"
        )}
      >
        {proxied ? "Proxied" : "DNS only"}
      </span>
    </button>
  );
}

function recordSummary(form: FormState, zoneName: string, proxyable: boolean) {
  const name =
    !form.name || form.name === "@"
      ? zoneName
      : form.name.includes(".")
        ? form.name
        : `${form.name}.${zoneName}`;
  const target = form.content.trim() || (form.type === "A" ? "[IPv4 address]" : "[value]");

  if (form.type === "A" || form.type === "AAAA") {
    return proxyable && form.proxied
      ? `${name} points to ${target} and has its traffic proxied through Cloudflare.`
      : `${name} points to ${target} (DNS only — traffic goes straight to the origin).`;
  }
  if (form.type === "CNAME") {
    return proxyable && form.proxied
      ? `${name} is an alias of ${target} and is proxied through Cloudflare.`
      : `${name} is an alias of ${target} (DNS only).`;
  }
  if (form.type === "MX") {
    return `${name} mail is handled by ${target} (priority ${form.priority || "10"}). MX is always DNS only.`;
  }
  return `${name} has a ${form.type} record with value ${target}.`;
}
