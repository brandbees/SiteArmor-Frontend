"use client";

import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import api from "@/lib/api";
import { mapSite, type RawSite } from "@/lib/mappers";
import type { Site } from "@/types";
import { truncateUrl } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AssignSitesModalProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AssignSitesModal({
  clientId,
  clientName,
  onClose,
  onSaved,
}: AssignSitesModalProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [original, setOriginal] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ sites: RawSite[] }>("/sites").then(({ data }) => {
      const mapped = (data.sites ?? []).map(mapSite);
      setSites(mapped);
      const assigned = new Set(
        mapped.filter((s) => s.client_id === clientId).map((s) => s.id)
      );
      setSelected(new Set(assigned));
      setOriginal(new Set(assigned));
      setLoading(false);
    });
  }, [clientId]);

  function toggle(siteId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const toAssign = sites.filter((s) => selected.has(s.id) && !original.has(s.id));
    const toUnassign = sites.filter((s) => !selected.has(s.id) && original.has(s.id));

    await Promise.all([
      ...toAssign.map((s) =>
        api.patch(`/sites/${s.id}/client`, { client_id: clientId })
      ),
      ...toUnassign.map((s) =>
        api.patch(`/sites/${s.id}/client`, { client_id: null })
      ),
    ]);

    onSaved();
  }

  const hasChanges =
    [...selected].some((id) => !original.has(id)) ||
    [...original].some((id) => !selected.has(id));

  return (
    <Modal
      open
      onClose={onClose}
      title="Assign sites"
      description={clientName}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} disabled={!hasChanges} onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading sites…</p>
        ) : sites.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No sites added yet.</p>
        ) : (
          sites.map((site) => {
            const isSelected = selected.has(site.id);
            const takenByOther = site.client_id && site.client_id !== clientId;
            return (
              <button
                key={site.id}
                type="button"
                disabled={!!takenByOther}
                onClick={() => toggle(site.id)}
                className={`flex w-full items-center gap-3 rounded-[4px] border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-border hover:bg-muted"
                } ${takenByOther ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                    isSelected ? "border-accent bg-accent" : "border-border bg-background"
                  }`}
                >
                  {isSelected && <Check size={11} className="text-white" />}
                </div>
                <Globe size={13} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{site.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {truncateUrl(site.url)}
                  </p>
                </div>
                {takenByOther && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">Other client</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
