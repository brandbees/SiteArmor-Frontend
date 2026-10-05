"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, RefreshCw, Upload } from "lucide-react";
import masterApi from "@/lib/masterApi";
import { Button } from "@/components/ui/Button";

type Manifest = {
  latest_version: string;
  zip_url: string;
  zip_sha256: string;
  min_push_version: string;
  release_notes: string;
  ready: boolean;
};

type FleetRow = {
  id: string;
  name: string;
  url: string;
  agency_name?: string;
  plugin_version?: string | null;
  plugin_outdated?: boolean;
  plugin_update_ready?: boolean;
  plugin_needs_manual_once?: boolean;
};

export default function MasterPluginReleasePage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [fleet, setFleet] = useState<FleetRow[]>([]);
  const [summary, setSummary] = useState<{ outdated: number; push_ready: number; scanned: number } | null>(null);
  const [version, setVersion] = useState("1.13.0");
  const [notes, setNotes] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, f] = await Promise.all([
        masterApi.get<Manifest>("/master/plugin-release/manifest"),
        masterApi.get<{
          sites: FleetRow[];
          summary: { outdated: number; push_ready: number; scanned: number };
          manifest: Manifest;
        }>("/master/plugin-release/fleet?limit=200"),
      ]);
      setManifest(m.data);
      setFleet(f.data.sites || []);
      setSummary(f.data.summary || null);
      if (m.data.latest_version) setVersion(m.data.latest_version);
      if (m.data.release_notes) setNotes(m.data.release_notes);
    } catch {
      toast.error("Failed to load plugin release data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish() {
    setPublishing(true);
    try {
      const { data } = await masterApi.post<{ ok: boolean; manifest: Manifest }>(
        "/master/plugin-release/publish",
        { version, release_notes: notes }
      );
      setManifest(data.manifest);
      toast.success(`Published Site Armor ${data.manifest.latest_version}`);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Publish failed";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }

  const outdated = fleet.filter((s) => s.plugin_outdated);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
            <Package size={22} className="text-amber-500" />
            Plugin release
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Publish a Site Armor ZIP for agency one-click fleet updates. Agencies confirm each push.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Current manifest</h2>
        {loading && !manifest ? (
          <p className="mt-2 text-sm text-zinc-500">Loading…</p>
        ) : (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Latest version</dt>
              <dd className="font-medium text-zinc-900">{manifest?.latest_version || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Ready for push</dt>
              <dd className="font-medium text-zinc-900">{manifest?.ready ? "Yes" : "No"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">ZIP URL</dt>
              <dd className="break-all font-mono text-xs text-zinc-700">{manifest?.zip_url || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">SHA-256</dt>
              <dd className="break-all font-mono text-xs text-zinc-700">{manifest?.zip_sha256 || "—"}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Publish from repo</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Zips <code className="rounded bg-zinc-100 px-1">wp-plugin/</code> as{" "}
          <code className="rounded bg-zinc-100 px-1">site-armor/</code>, hashes it, stores the
          package, and updates the manifest. Bump{" "}
          <code className="rounded bg-zinc-100 px-1">BBSS_VERSION</code> in the plugin first.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs font-medium text-zinc-600">
            Version
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="1.13.0"
            />
          </label>
          <label className="block flex-[2] text-xs font-medium text-zinc-600">
            Release notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Fleet self-update, …"
            />
          </label>
          <Button onClick={() => void publish()} loading={publishing} disabled={publishing}>
            <Upload size={14} />
            Publish
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Connected fleet (outdated)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {summary
            ? `${summary.outdated} outdated · ${summary.push_ready} push-ready · ${summary.scanned} connected scanned`
            : "—"}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-3 font-medium">Site</th>
                <th className="py-2 pr-3 font-medium">Agency</th>
                <th className="py-2 pr-3 font-medium">Version</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {outdated.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-400">
                    No outdated connected sites (or no release published yet).
                  </td>
                </tr>
              )}
              {outdated.map((s) => (
                <tr key={s.id} className="border-b border-zinc-50">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-zinc-900">{s.name}</div>
                    <div className="text-xs text-zinc-400">{s.url}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600">{s.agency_name || "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{s.plugin_version || "—"}</td>
                  <td className="py-2.5">
                    {s.plugin_update_ready
                      ? "Push-ready"
                      : s.plugin_needs_manual_once
                        ? "Manual once"
                        : "Outdated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
