"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import type { Site } from "@/types";

interface AddSiteModalProps {
  onClose: () => void;
  onSuccess: (siteId: string) => void;
}

export function AddSiteModal({ onClose, onSuccess }: AddSiteModalProps) {
  const [step, setStep] = useState<"form" | "token">("form");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState<Site | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ site: Site }>("/sites", { name, url });
      setSite(data.site);
      setStep("token");
      toast.success("Site added successfully");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to add site.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (!site?.site_token) return;
    navigator.clipboard.writeText(site.site_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={step === "form" ? "Add a site" : "Install the plugin"}
      description={
        step === "form"
          ? "Connect a WordPress site to start monitoring."
          : "Paste this token into the Site Armor plugin settings."
      }
      footer={
        step === "form" ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-site-form"
              loading={loading}
            >
              Add site
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => onSuccess(site!.id)}>
              I&apos;ll do this later
            </Button>
            <Button onClick={() => onSuccess(site!.id)}>Done</Button>
          </>
        )
      }
    >
      {step === "form" ? (
        <form id="add-site-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Site name
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client Site Name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Site URL
            </label>
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://clientsite.com"
            />
          </div>
          {error ? <Alert variant="error">{error}</Alert> : null}
        </form>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
            <code className="flex-1 truncate font-mono text-xs text-foreground">
              {site?.site_token}
            </code>
            <button
              onClick={copyToken}
              className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              type="button"
            >
              {copied ? (
                <Check size={14} className="text-[var(--score-good)]" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <ol className="space-y-2">
            {[
              "Download the Site Armor plugin (.zip)",
              "Go to WordPress Admin → Plugins → Add New → Upload",
              "Install and activate the plugin",
              "Go to Settings → Site Armor",
              "Paste your site token and save",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[11px] font-bold text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}
