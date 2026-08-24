"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Users, Globe, Building2, Trash2, Link2, Search,
  Pencil, Loader2, Send, CheckCircle2, Mail,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useRole } from "@/hooks/useRole";
import { AssignSitesModal } from "@/components/clients/AssignSitesModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricTile } from "@/components/shared/PortalPrimitives";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import type { Client } from "@/types";

const CLIENT_COLORS = [
  "#1a56db", "#0ea5e9", "#16a34a", "#d97706", "#dc2626", "#475569",
];

function clientColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: (updated: Client) => void;
}) {
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email ?? "");
  const [company, setCompany] = useState(client.company ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.put<{ client: Client }>(`/clients/${client.id}`, {
        name: name.trim(),
        email: email.trim() || null,
        company: company.trim() || null,
      });
      onSaved(data.client);
      toast.success("Client updated successfully.");
    } catch {
      setError("Failed to update client");
      toast.error("Failed to update client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Client"
      description="Update client details"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={saving} disabled={!name.trim()} onClick={handleSave}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Name *
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Email
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Company
          </label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
        </div>
        {error ? <Alert variant="error">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

function ClientRow({
  client,
  onDeleted,
  onSitesChanged,
  canManage,
}: {
  client: Client;
  onDeleted: () => void;
  onSitesChanged: () => void;
  canManage: boolean;
}) {
  const [local, setLocal] = useState(client);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const color = clientColor(local.name);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/clients/${local.id}`);
      toast.success("Client deleted.");
      onDeleted();
    } catch {
      toast.error("Failed to delete client.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleSendInvite() {
    setInviting(true);
    try {
      await api.post(`/clients/${local.id}/invite`);
      toast.success("Invite sent.");
      setLocal({ ...local, invite_token: "pending" });
      onSitesChanged();
    } catch {
      toast.error("Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  const portalBadge = local.invite_accepted ? (
    <Badge variant="success" dot>Portal active</Badge>
  ) : local.invite_token ? (
    <Badge variant="warning" dot>Invite pending</Badge>
  ) : (
    <Badge variant="muted">No invite</Badge>
  );

  return (
    <>
      <tr className="group border-b border-border last:border-0 hover:bg-muted/40">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-xs font-bold text-white"
              style={{ background: color }}
            >
              {initials(local.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{local.name}</p>
              {local.company ? (
                <p className="truncate text-xs text-muted-foreground">{local.company}</p>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail size={12} />
            <span className="truncate max-w-[180px]">{local.email || "—"}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {local.site_count ?? 0}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">sites</span>
        </td>
        <td className="px-4 py-3.5">{portalBadge}</td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAssign(true)}
                  className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-accent"
                  title="Manage sites"
                >
                  <Link2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                {!local.invite_accepted && (
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={inviting || !local.email}
                    className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-accent disabled:opacity-40"
                    title="Send portal invite"
                  >
                    {inviting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-[4px] p-2 text-muted-foreground hover:bg-[var(--destructive-light)] hover:text-destructive"
                  title={confirmDelete ? "Confirm delete" : "Delete"}
                >
                  {deleting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : confirmDelete ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {showAssign && (
        <AssignSitesModal
          clientId={local.id}
          clientName={local.name}
          onClose={() => setShowAssign(false)}
          onSaved={() => {
            setShowAssign(false);
            onSitesChanged();
          }}
        />
      )}
      {showEdit && (
        <EditClientModal
          client={local}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setLocal({ ...local, ...updated });
            setShowEdit(false);
          }}
        />
      )}
    </>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { clients, loading, error, refetch } = useClients();
  const { roleCanDo } = useRole();
  const canAdd = roleCanDo("add_site");

  const [search, setSearch] = useState("");

  const totalSites = useMemo(
    () => clients.reduce((sum, c) => sum + (c.site_count ?? 0), 0),
    [clients]
  );
  const withCompany = useMemo(() => clients.filter((c) => c.company).length, [clients]);
  const portalActive = useMemo(
    () => clients.filter((c) => c.invite_accepted).length,
    [clients]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        description="Manage relationships, assign sites, and send portal invites."
        icon={<Users size={22} />}
        action={
          <>
            <div className="relative min-w-[200px] sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients"
                className="h-11 w-full rounded-[4px] border border-border bg-muted/40 pl-9 pr-3 text-sm focus:border-accent focus:bg-surface focus:outline-none"
              />
            </div>
            {canAdd && (
              <Button onClick={() => router.push("/clients/add")}>
                <Plus size={15} strokeWidth={2.5} />
                Add Client
              </Button>
            )}
          </>
        }
      />

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && clients.length === 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            tone="brand"
            icon={<Users size={22} />}
            title="No clients found"
            description="Add your first client to group sites and send branded reports."
            action={
              canAdd ? (
                <Button onClick={() => router.push("/clients/add")}>
                  <Plus size={15} />
                  Add Client
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {!loading && !error && clients.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label="Total Clients" value={clients.length} icon={<Users size={16} />} />
            <MetricTile label="Sites Assigned" value={totalSites} icon={<Globe size={16} />} />
            <MetricTile label="With Company" value={withCompany} icon={<Building2 size={16} />} />
            <MetricTile label="Portal Active" value={portalActive} icon={<CheckCircle2 size={16} />} />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Search size={20} />}
                title="No clients match"
                description="Try a different search term."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Sites</th>
                      <th className="px-4 py-3">Portal</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <ClientRow
                        key={c.id}
                        client={c}
                        canManage={canAdd}
                        onDeleted={refetch}
                        onSitesChanged={refetch}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-border px-4 py-3 text-xs font-medium text-muted-foreground">
              {filtered.length} of {clients.length} clients
              {canAdd && (
                <button
                  type="button"
                  onClick={() => router.push("/clients/add")}
                  className="ml-3 font-bold text-accent hover:underline"
                >
                  + Add client
                </button>
              )}
            </div>
          </div>
        </>
        )}
    </div>
  );
}
