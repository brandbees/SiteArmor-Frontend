"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Globe, Loader2, Mail, SkipForward } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cacheClear } from "@/lib/dataCache";
import { mapSite, type RawSite } from "@/lib/mappers";
import { cn, truncateUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { SetupWizard } from "@/components/setup/SetupWizard";
import {
  ClientPortalPreview,
  ClientProfilePreview,
  ClientSitesPreview,
} from "@/components/setup/SetupPreview";
import type { Client, Site } from "@/types";

const HEADLINES = [
  { lead: "Begin by adding", accent: "your client." },
  { lead: "Invite them in", accent: "to the portal." },
  { lead: "Assign their sites.", accent: "Optional." },
] as const;

const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:font-extralight placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-0";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-zinc-900">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function AddClientPage() {
  const router = useRouter();
  const { agency } = useAuth();
  const { roleCanDo } = useRole();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sitesLoading, setSitesLoading] = useState(false);

  const canContinue = name.trim().length > 0;
  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    if (agency?.is_client_portal || agency?.account_type === "individual") {
      router.replace("/dashboard");
    } else if (agency && !roleCanDo("add_site")) {
      router.replace("/clients");
    }
  }, [agency, roleCanDo, router]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!emailOk) {
      setError("Enter a valid email, or leave it blank.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ client: Client }>("/clients", {
        name: name.trim(),
        email: email.trim() || null,
        company: company.trim() || null,
      });
      setClient(data.client);
      setStep(2);
      toast.success("Client added");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add client.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteContinue(skipInvite = false) {
    if (!client) return;
    setError("");
    setLoading(true);
    try {
      if (!skipInvite && sendInvite && email.trim()) {
        await api.post(`/clients/${client.id}/invite`);
        toast.success("Portal invite sent");
      }
      setSitesLoading(true);
      const { data } = await api.get<{ sites: RawSite[] }>("/sites");
      setSites((data.sites ?? []).map(mapSite));
      setStep(3);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not send invite.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setSitesLoading(false);
    }
  }

  function toggleSite(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const unassigned = useMemo(() => sites.filter((s) => !s.client_id), [sites]);

  async function handleAssign() {
    if (!client) return;
    setLoading(true);
    try {
      await Promise.all(
        [...selected].map((id) => api.patch(`/sites/${id}/client`, { client_id: client.id }))
      );
      cacheClear("sites");
      toast.success(selected.size ? "Sites assigned" : "Client ready");
      router.push("/clients");
    } catch {
      toast.error("Could not assign sites.");
    } finally {
      setLoading(false);
    }
  }

  const preview =
    step === 1 ? <ClientProfilePreview /> : step === 2 ? <ClientPortalPreview /> : <ClientSitesPreview />;
  const copy = HEADLINES[step - 1];

  return (
    <form onSubmit={step === 1 ? handleProfileSubmit : (e) => e.preventDefault()} className="flex h-full min-h-0 flex-1 flex-col">
      <SetupWizard
        step={step}
        headline={copy.lead}
        accent={copy.accent}
        preview={preview}
        footer={
          step === 1 ? (
            <button
              type="submit"
              disabled={!canContinue || !emailOk || loading}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Continue
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          ) : step === 2 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleInviteContinue(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                <SkipForward size={14} />
                Skip invite
              </button>
              <button
                type="button"
                onClick={() => void handleInviteContinue()}
                disabled={loading || (sendInvite && !email.trim())}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/clients")}
                className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => void handleAssign()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {selected.size ? "Assign & finish" : "Finish"}
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          )
        }
      >
        {step === 1 && (
          <div className="flex max-w-lg flex-col gap-5">
            <Field label="Client name" required>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                className={fieldClass}
              />
            </Field>
            <Field label="Company">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className={fieldClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@acme.com"
                className={cn(fieldClass, !emailOk && "border-red-500")}
              />
            </Field>
            <p className="text-xs text-zinc-500">
              Name is enough to start. Add an email if you want to send a portal invite next.
            </p>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        )}

        {step === 2 && (
          <div className="flex max-w-lg flex-col gap-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4">
              <input
                type="checkbox"
                checked={sendInvite}
                disabled={!email.trim()}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <Mail size={16} className="text-accent" />
                  Send a portal invite
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  {email.trim()
                    ? `We'll email ${email.trim()} a link to view their sites — no admin access.`
                    : "Add an email on the previous step to send an invite."}
                </span>
              </span>
            </label>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        )}

        {step === 3 && (
          <div className="flex max-w-lg flex-col gap-3">
            {sitesLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 size={16} className="animate-spin" /> Loading sites…
              </div>
            ) : unassigned.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No unassigned sites yet. You can attach sites later from the client list.
              </p>
            ) : (
              unassigned.map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSite(s.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors",
                      on ? "border-accent/40 ring-1 ring-accent/20" : "border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md",
                        on ? "bg-accent text-white" : "border border-zinc-200"
                      )}
                    >
                      {on ? <Check size={12} /> : null}
                    </span>
                    <Globe size={16} className="shrink-0 text-zinc-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-800">{s.name}</span>
                      <span className="block truncate text-xs text-zinc-400">{truncateUrl(s.url)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </SetupWizard>
    </form>
  );
}
