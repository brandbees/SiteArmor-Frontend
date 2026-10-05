"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, RefreshCw, Shield } from "lucide-react";
import api from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export type FleetSite = {
  id: string;
  name: string;
  url: string;
  plugin_connected: boolean;
  plugin_version?: string | null;
  plugin_outdated?: boolean;
  plugin_update_ready?: boolean;
  plugin_needs_manual_once?: boolean;
};

type FleetResponse = {
  manifest: {
    latest_version: string;
    min_push_version: string;
    release_notes?: string;
    ready: boolean;
  };
  sites: FleetSite[];
  summary: {
    total: number;
    connected: number;
    outdated: number;
    push_ready: number;
    needs_manual: number;
  };
};

type UpdateResult = {
  site_id: string;
  name?: string;
  status: string;
  error?: string | null;
  new_version?: string | null;
};

type Props = {
  /** When set, only offer update for this site (site detail). */
  siteId?: string;
  className?: string;
  onUpdated?: () => void;
};

export function PluginFleetBanner({ siteId, className = "", onUpdated }: Props) {
  const [fleet, setFleet] = useState<FleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<FleetResponse>("/plugin/fleet");
      setFleet(data);
    } catch {
      setFleet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !fleet?.manifest?.latest_version) return null;

  const sites = siteId
    ? fleet.sites.filter((s) => s.id === siteId)
    : fleet.sites.filter((s) => s.plugin_outdated);

  if (!sites.length) {
    if (siteId) {
      const mine = fleet.sites.find((s) => s.id === siteId);
      if (mine?.plugin_connected && !mine.plugin_outdated) {
        return (
          <p className={`text-[12px] text-muted-foreground ${className}`}>
            Site Armor {mine.plugin_version || "—"} · up to date
            {fleet.manifest.latest_version
              ? ` (latest ${fleet.manifest.latest_version})`
              : ""}
          </p>
        );
      }
    }
    return null;
  }

  const pushReady = sites.filter((s) => s.plugin_update_ready);
  const needsManual = sites.filter((s) => s.plugin_needs_manual_once);
  const latest = fleet.manifest.latest_version;

  function confirmTargetLabel(ids: string[]): string {
    const named = ids
      .map((id) => sites.find((s) => s.id === id)?.name?.trim())
      .filter((n): n is string => !!n);
    if (named.length === 1) return named[0];
    if (named.length > 1 && named.length <= 3) return named.join(", ");
    if (named.length > 3) {
      return `${named.slice(0, 2).join(", ")}, and ${named.length - 2} more`;
    }
    return `${ids.length} site${ids.length === 1 ? "" : "s"}`;
  }

  async function runUpdate(ids: string[]) {
    if (!ids.length) return;
    setUpdating(true);
    try {
      const { data } = await api.post<{
        updated: number;
        results: UpdateResult[];
        target_version: string;
      }>("/plugin/update-self", { site_ids: ids });
      const ok = data.updated ?? 0;
      const failed = (data.results || []).filter(
        (r) => r.status !== "success" && r.status !== "skipped"
      );
      if (ok > 0) {
        const successIds = (data.results || [])
          .filter((r) => r.status === "success")
          .map((r) => String(r.site_id));
        const who = confirmTargetLabel(successIds.length ? successIds : ids);
        toast.success(`Updated ${who} to Site Armor ${data.target_version}.`);
        // Refresh site detail / sidebar footer (plugin_version) across the app.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bb:refresh"));
        }
      }
      if (failed.length) {
        toast.warning(
          `${failed.length} site${failed.length === 1 ? "" : "s"} need attention — check results.`
        );
      }
      await load();
      onUpdated?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Update failed";
      toast.error(msg);
    } finally {
      setUpdating(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-950">
            <Shield size={15} className="shrink-0 text-amber-700" />
            {siteId
              ? `Site Armor update available (${latest})`
              : `${sites.length} site${sites.length === 1 ? "" : "s"} need Site Armor ${latest}`}
          </p>
          <p className="text-[12px] leading-relaxed text-amber-900/80">
            {pushReady.length > 0 && (
              <>
                {pushReady.length} ready for one-click update
                {needsManual.length > 0 ? " · " : ""}
              </>
            )}
            {needsManual.length > 0 && (
              <>
                {needsManual.length} need a one-time manual ZIP install
                (requires {fleet.manifest.min_push_version}+ for push)
              </>
            )}
            {fleet.manifest.release_notes
              ? ` — ${fleet.manifest.release_notes}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {needsManual.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`${API_BASE_URL}/plugin/release/package`, "_blank");
              }}
            >
              <Download size={13} />
              Download ZIP
            </Button>
          )}
          {pushReady.length > 0 && (
            <Button
              size="sm"
              disabled={updating}
              loading={updating}
              onClick={() => {
                setPendingIds(pushReady.map((s) => s.id));
                setConfirmOpen(true);
              }}
            >
              {updating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              {siteId
                ? "Update Site Armor"
                : `Update ${pushReady.length} site${pushReady.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Update Site Armor?"
        message={`This will download and install Site Armor ${latest} on ${confirmTargetLabel(pendingIds)}. A health check runs after each update; failures roll back.`}
        confirmText="Update now"
        onConfirm={() => void runUpdate(pendingIds)}
        onCancel={() => setConfirmOpen(false)}
        isLoading={updating}
      />
    </div>
  );
}
