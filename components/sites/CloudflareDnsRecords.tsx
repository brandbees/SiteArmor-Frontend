"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McCard, McPill } from "@/components/shared/MalCareUI";
import {
  createDnsRecord,
  deleteDnsRecord,
  listDnsRecords,
  updateDnsRecord,
  type CloudflareDnsRecord,
  type DnsRecordInput,
} from "@/lib/api/cloudflare";

const TYPES = ["A", "AAAA", "CNAME", "TXT", "MX"] as const;

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

function recordToForm(r: CloudflareDnsRecord): FormState {
  return {
    type: (TYPES.includes(r.type as (typeof TYPES)[number])
      ? r.type
      : "A") as FormState["type"],
    name: r.name,
    content: r.content,
    ttl: r.ttl === 1 ? "auto" : String(r.ttl),
    proxied: !!r.proxied,
    priority: r.priority != null ? String(r.priority) : "10",
  };
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

      <McCard
        title="DNS records"
        icon={<RefreshCw size={14} />}
        action={
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
        }
      >
        <p className="mb-3 text-[12px] text-muted-foreground">
          Zone <span className="font-mono font-medium text-foreground">{zoneName}</span>
          {" · "}Editable: A, AAAA, CNAME, TXT, MX. Free plan max {limit} records.
        </p>

        {showForm && (
          <div className="mb-4 space-y-3 rounded-xl border border-zinc-200 bg-[#fafafa] p-3.5">
            <p className="text-[12px] font-bold text-foreground">
              {editingId ? "Edit record" : "New record"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Type">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as FormState["type"],
                      proxied: ["A", "AAAA", "CNAME"].includes(e.target.value) ? f.proxied : false,
                    }))
                  }
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
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="@ or www"
                  className={inputClass}
                />
              </Field>
              <Field label={isMx ? "Mail server" : "Content"}>
                <input
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder={isMx ? "mail.example.com" : "Value"}
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
              <Field label="TTL">
                <select
                  value={form.ttl}
                  onChange={(e) => setForm((f) => ({ ...f, ttl: e.target.value }))}
                  className={inputClass}
                >
                  <option value="auto">Auto</option>
                  <option value="300">5 min</option>
                  <option value="3600">1 hour</option>
                  <option value="86400">1 day</option>
                </select>
              </Field>
              {proxyable && (
                <Field label="Proxy">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, proxied: !f.proxied }))}
                    className={`rounded-lg border px-3 py-2 text-left text-[12px] font-semibold ${
                      form.proxied
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-zinc-200 bg-white text-muted-foreground"
                    }`}
                  >
                    {form.proxied ? "Proxied (orange cloud)" : "DNS only"}
                  </button>
                </Field>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSaveClick} loading={busy} disabled={busy}>
                {editingId ? "Save changes" : "Create record"}
              </Button>
              <Button
                size="sm"
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

        <div className="mb-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by type, name, or content…"
            className={inputClass}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200">
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
                          className={`rounded-[4px] border px-2 py-0.5 text-[10px] font-bold ${
                            r.proxied
                              ? "border-orange-200 bg-orange-50 text-orange-700"
                              : "border-zinc-200 text-muted-foreground"
                          }`}
                        >
                          {r.proxied ? "Proxied" : "DNS only"}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {r.ttl === 1 ? "Auto" : r.ttl}
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
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
