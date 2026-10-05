"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Package, RefreshCw, RotateCcw, Upload } from "lucide-react";
import masterApi from "@/lib/masterApi";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type PublishedRelease = {
  version: string;
  filename: string;
  sha256: string;
  size_bytes: number;
  mtime: string;
  is_current: boolean;
};

type Manifest = {
  latest_version: string;
  zip_url: string;
  zip_sha256: string;
  min_push_version: string;
  release_notes: string;
  ready: boolean;
  repo_version?: string | null;
  selected_version?: string;
  published?: PublishedRelease[];
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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MasterPluginReleasePage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [fleet, setFleet] = useState<FleetRow[]>([]);
  const [summary, setSummary] = useState<{ outdated: number; push_ready: number; scanned: number } | null>(null);
  const [published, setPublished] = useState<PublishedRelease[]>([]);
  const [notes, setNotes] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState<PublishedRelease | null>(null);

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
      setPublished(m.data.published || []);
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
    const repoVersion = manifest?.repo_version;
    if (!repoVersion) {
      toast.error("Set BBSS_VERSION in the plugin before publishing");
      return;
    }
    setPublishing(true);
    try {
      const { data } = await masterApi.post<{ ok: boolean; manifest: Manifest }>(
        "/master/plugin-release/publish",
        { version: repoVersion, release_notes: notes }
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

  async function activateRollback() {
    if (!rollbackTarget) return;
    setActivating(true);
    try {
      const { data } = await masterApi.post<{ ok: boolean; manifest: Manifest }>(
        "/master/plugin-release/activate",
        {
          version: rollbackTarget.version,
          release_notes: notes || `Rolled fleet target back to ${rollbackTarget.version}`,
        }
      );
      setManifest(data.manifest);
      toast.success(`Fleet target set to ${data.manifest.latest_version}`);
      setRollbackTarget(null);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Rollback failed";
      toast.error(msg);
    } finally {
      setActivating(false);
    }
  }

  const outdated = fleet.filter((s) => s.plugin_outdated);
  const repoVersion = manifest?.repo_version || "";
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
            <div>
              <dt className="text-zinc-500">Repo code version</dt>
              <dd className="font-medium text-zinc-900">{manifest?.repo_version || "—"}</dd>
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
          Builds a ZIP from the current <code className="rounded bg-zinc-100 px-1">wp-plugin/</code>{" "}
          code using <code className="rounded bg-zinc-100 px-1">BBSS_VERSION</code>. To roll the
          fleet back to an older ZIP, use <span className="font-medium text-zinc-700">Set as current</span>{" "}
          below — do not republish an old version number.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="block flex-1 text-xs font-medium text-zinc-600">
            Version in repo
            <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900">
              {repoVersion || "—"}
            </p>
          </div>
          <label className="block flex-[2] text-xs font-medium text-zinc-600">
            Release notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Fleet self-update, …"
            />
          </label>
          <Button
            onClick={() => void publish()}
            loading={publishing}
            disabled={publishing || !repoVersion}
          >
            <Upload size={14} />
            Publish
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <History size={16} className="text-zinc-500" />
          Published packages / rollback
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Activate a previous package as the fleet target with Set as current. Sites still on an
          older build can update to it. Sites already on a newer version are not auto-downgraded.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-3 font-medium">Version</th>
                <th className="py-2 pr-3 font-medium">Size</th>
                <th className="py-2 pr-3 font-medium">Published</th>
                <th className="py-2 pr-3 font-medium">SHA-256</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {published.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400">
                    No published packages yet. Publish from repo first.
                  </td>
                </tr>
              )}
              {published.map((p) => (
                <tr key={p.version} className="border-b border-zinc-50">
                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-zinc-900">
                    {p.version}
                    {p.is_current && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600">{formatBytes(p.size_bytes)}</td>
                  <td className="py-2.5 pr-3 text-zinc-600">
                    {new Date(p.mtime).toLocaleString()}
                  </td>
                  <td className="max-w-[180px] truncate py-2.5 pr-3 font-mono text-[10px] text-zinc-500" title={p.sha256}>
                    {p.sha256.slice(0, 16)}…
                  </td>
                  <td className="py-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={p.is_current || activating}
                      onClick={() => setRollbackTarget(p)}
                    >
                      <RotateCcw size={13} />
                      {p.is_current ? "Active" : "Set as current"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <ConfirmDialog
        isOpen={!!rollbackTarget}
        title="Set fleet target version?"
        message={
          rollbackTarget
            ? `This sets Site Armor ${rollbackTarget.version} as the current fleet package (ZIP + checksum). Agencies will be offered this version for sites that are behind it. Sites already on a newer version will not auto-downgrade.`
            : ""
        }
        confirmText="Set as current"
        onConfirm={() => void activateRollback()}
        onCancel={() => setRollbackTarget(null)}
        isLoading={activating}
      />
    </div>
  );
}
