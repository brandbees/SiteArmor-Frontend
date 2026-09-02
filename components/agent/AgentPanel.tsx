"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, ChevronDown, Loader2, Globe, RotateCcw, Bot, Copy, Check,
         Zap, Play, FileText, Calendar, List, ShieldCheck, Plus, Database, X,
         AlertTriangle, CheckCircle2, Trash2, Wrench, Undo2,
         Terminal, Lock, KeyRound, ChevronUp, Wifi, WifiOff, Eye, EyeOff, Square,
         TrendingDown, Shield, Plug, Radio, ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { mapSite, type RawSite } from "@/lib/mappers";
import { useAuth } from "@/hooks/useAuth";
import type { Site, AgentMessage } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TokenTopupModal } from "@/components/agent/TokenTopupModal";
import { McIconBox, McAlert } from "@/components/shared/MalCareUI";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type AgentPanelProps = {
  /** When set, locks the assistant to this site and hides the site picker. */
  fixedSiteId?: string;
  /** Embedded inside site detail — uses MalCare card styling and omits the page header. */
  variant?: "standalone" | "embedded";
  /** Optional initial prompt (e.g. from ?prompt= on site agent tab). */
  initialPrompt?: string;
};

const ROUNDED = {
  standalone: "rounded-[4px]",
  embedded: "rounded-2xl",
} as const;

const SUGGESTIONS_GLOBAL = [
  { q: "Which site has the lowest overall score?", icon: TrendingDown },
  { q: "Are any sites under malware threat?", icon: Shield },
  { q: "Which sites have plugins needing updates?", icon: Plug },
  { q: "Is any site currently down?", icon: Radio },
];

const SUGGESTIONS_SITE = [
  { q: "What's the most urgent thing to fix?", icon: AlertTriangle },
  { q: "What are my biggest media files?", icon: ImageIcon },
  { q: "What plugins have known vulnerabilities?", icon: Shield },
  { q: "Show me the last 100 lines of my error log", icon: FileText },
];

// Kicks off the free-form, agent-driven optimization flow. It measures first, speaks
// in its own words, and takes a full backup (consented here) before any change.
const OPTIMIZE_PROMPT =
  "Start a performance optimization for this site. First measure the current PageSpeed and tell me — in your own words — what is actually slowing it down. Then we'll fix issues one at a time with my approval. I approve taking a full backup (database + files) before any changes are made.";

const UNDO_PROMPT =
  "Undo the optimization changes you made and restore the site to how it was before.";

// Two independent balances, deliberately never summed into one figure for display:
// the plan allowance refills every month, the purchased top-up never does.
interface TokenState {
  tokens_used:      number;   // this month's usage against the plan allowance
  tokens_limit:     number;   // base + total purchased (e.g. 270k)
  tokens_extra:     number;   // total extra purchased (e.g. 250k)
  extra_used?:      number;   // lifetime top-up consumed — never resets
  extra_remaining?: number;   // extra still available (e.g. 43k)
  monthly_limit?:   number;   // plan base limit, refilled monthly (e.g. 20k)
}

interface ToolCall {
  name:   string;
  args:   Record<string, unknown>;
  result: Record<string, unknown>;
}

// The agent's final answer — delivered either directly by the POST response or (when a
// long run outlasts the reverse-proxy timeout) fetched from GET /agent/progress/:id.
interface AgentReply {
  reply:            string;
  tool_calls?:      ToolCall[];
  tokens_used?:     number;
  tokens_limit?:    number;
  tokens_extra?:    number;
  extra_used?:      number;
  extra_remaining?: number;
  monthly_limit?:   number;
}

const TOOL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  run_audit:                { label: "Audit triggered",           icon: Play,        color: "#1f5fb8" },
  send_report:              { label: "Report queued",             icon: FileText,    color: "#0ea5e9" },
  update_schedule:          { label: "Schedule updated",          icon: Calendar,    color: "#10b981" },
  list_sites:               { label: "Sites fetched",             icon: List,        color: "#8b5cf6" },
  get_scores:               { label: "Scores retrieved",          icon: Zap,         color: "#f59e0b" },
  get_malware_status:       { label: "Malware status checked",    icon: ShieldCheck, color: "#ef4444" },
  analyze_malware_findings: { label: "AI malware analysis",       icon: Sparkles,    color: "#7c3aed" },
  analyze_plugin_usage:     { label: "Plugin usage analyzed",      icon: Sparkles,    color: "#7c3aed" },
  get_live_site_data:       { label: "Live data fetched",         icon: Database,    color: "#0891b2" },
  preview_write_operation:  { label: "Write preview ready",       icon: Wrench,      color: "#7c3aed" },
  ssh_read_file:            { label: "File read via SSH",          icon: Terminal,    color: "#0f766e" },
  ssh_list_directory:       { label: "Directory listed via SSH",   icon: Terminal,    color: "#0f766e" },
  ssh_find_pattern:         { label: "Pattern search via SSH",     icon: Terminal,    color: "#0f766e" },
  ssh_read_log:             { label: "Log read via SSH",           icon: Terminal,    color: "#0f766e" },
  ssh_check_permissions:    { label: "Permissions checked via SSH",icon: Terminal,    color: "#0f766e" },
  ssh_execute_command:      { label: "Command executed via SSH",   icon: Terminal,    color: "#0d6f5e" },
  ssh_write_file:           { label: "File written via SSH",       icon: Terminal,    color: "#0d6f5e" },
  ssh_delete_file:          { label: "File deleted via SSH",       icon: Terminal,    color: "#b91c1c" },
  ssh_backup_file:          { label: "Backup created via SSH",     icon: Terminal,    color: "#0d6f5e" },
};

interface WritePreview {
  write_preview:  boolean;
  operation:      string;
  site_id:        string;
  site_name:      string;
  risk_level:     "low" | "medium" | "high";
  risk_label:     string;
  risk_color:     string;
  description:    string;
  counts:         Record<string, unknown>;
  target_options: string[] | null;
  can_undo:       boolean;
  // Extra params for new operations
  plugin_path?:   string | null;
  user_id?:       number | null;
  constant?:      string | null;
  value?:         unknown;
}

const OP_LABELS: Record<string, string> = {
  delete_expired_transients: "Delete Expired Transients",
  fix_file_permissions:      "Fix File Permissions",
  delete_post_revisions:     "Delete Post Revisions",
  optimize_db_tables:        "Optimize DB Tables",
  delete_orphaned_options:   "Delete Orphaned Options",
  clear_all_transients:      "Clear All Transients",
};

function WriteBatch({ writeCalls, siteId, onSuccess, isMulti }: {
  writeCalls: ToolCall[];
  siteId: string;
  onSuccess?: (operation: string, resultMsg: string, counts: Record<string, unknown>) => void;
  isMulti: boolean;
}) {
  const [bulkTrigger, setBulkTrigger] = useState(0);
  const [bulkFired, setBulkFired]     = useState(false);

  const confirmAll = () => {
    setBulkTrigger(t => t + 1);
    setBulkFired(true);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5" style={{ color: "#d97706" }}>
          <AlertTriangle size={11} />
          <span className="text-[11px] font-semibold tracking-wide uppercase">
            Action{isMulti ? "s require" : " requires"} confirmation
          </span>
        </div>
        {isMulti && !bulkFired && (
          <button
            onClick={confirmAll}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-[11px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #d97706, #b45309)", boxShadow: "0 1px 6px rgba(180,83,9,0.35)" }}
          >
            <CheckCircle2 size={11} />
            Confirm All ({writeCalls.length})
          </button>
        )}
      </div>
      {writeCalls.map((tc, j) => (
        <WriteConfirmCard key={j} call={tc} siteId={siteId} onSuccess={onSuccess} bulkTrigger={bulkTrigger} />
      ))}
    </div>
  );
}

function WriteConfirmCard({ call, siteId, onSuccess, bulkTrigger }: {
  call: ToolCall;
  siteId: string;
  onSuccess?: (operation: string, resultMsg: string, counts: Record<string, unknown>) => void;
  bulkTrigger?: number;
}) {
  const preview = call.result as unknown as WritePreview;
  const [phase, setPhase]         = useState<"idle" | "running" | "done" | "undo_running" | "undone" | "error">("idle");
  const [resultMsg, setResultMsg] = useState<string>("");
  const [snapshotId, setSnapshotId] = useState<string>("");
  const [canUndo, setCanUndo]     = useState<boolean>(false);
  const [dismissed, setDismissed] = useState(false);

  // Hoisted so useEffect can reference it before the early-return guard
  const confirm = useCallback(async () => {
    if (phase !== "idle") return;
    setPhase("running");
    try {
      const { data } = await api.post<{ success: boolean; snapshot_id: string; can_undo: boolean; message: string }>("/agent/write", {
        site_id:        siteId,
        operation:      preview.operation,
        target_options: preview.target_options  ?? undefined,
        plugin_path:    preview.plugin_path     ?? undefined,
        user_id:        preview.user_id         ?? undefined,
        constant:       preview.constant        ?? undefined,
        value:          preview.value           ?? undefined,
      });
      setSnapshotId(data.snapshot_id);
      setCanUndo(data.can_undo);
      const msg = data.message ?? "Operation completed.";
      setResultMsg(msg);
      setPhase("done");
      onSuccess?.(preview.operation, msg, (preview.counts ?? {}) as Record<string, unknown>);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setResultMsg(msg ?? "Operation failed. Please try again.");
      setPhase("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, siteId, preview.operation]);

  // Bulk-trigger: when parent increments bulkTrigger, fire confirm if still idle
  useEffect(() => {
    if (bulkTrigger && bulkTrigger > 0) confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkTrigger]);

  if (dismissed) return null;

  const riskIcon = preview.risk_level === "low"
    ? <CheckCircle2 size={13} className="text-green-600 shrink-0" />
    : preview.risk_level === "medium"
    ? <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
    : <AlertTriangle size={13} className="text-red-500 shrink-0" />;

  const undo = async () => {
    setPhase("undo_running");
    try {
      const { data } = await api.post<{ message: string }>("/agent/write/undo", { snapshot_id: snapshotId });
      setResultMsg(data.message ?? "Undo completed.");
      setPhase("undone");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setResultMsg(msg ?? "Undo failed.");
      setPhase("error");
    }
  };

  const borderColor = preview.risk_level === "low" ? "#16a34a" : preview.risk_level === "medium" ? "#d97706" : "#dc2626";
  const bgColor     = preview.risk_level === "low" ? "#f0fdf4" : preview.risk_level === "medium" ? "#fffbeb" : "#fef2f2";

  return (
    <div className="mt-2 rounded-xl border overflow-hidden text-xs" style={{ borderColor, background: bgColor }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-2">
          <Wrench size={12} style={{ color: preview.risk_color }} />
          <span className="font-semibold" style={{ color: preview.risk_color }}>
            {OP_LABELS[preview.operation] ?? preview.operation}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {riskIcon}
          <span className="font-medium" style={{ color: preview.risk_color }}>{preview.risk_label}</span>
          {phase === "idle" && (
            <button onClick={() => setDismissed(true)} className="ml-1 p-0.5 rounded hover:bg-black/10 text-muted-foreground">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 py-2.5 space-y-2.5">
        <p className="text-foreground leading-snug">{preview.description}</p>

        {/* Result / undo */}
        {phase === "done" && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 text-green-700">
              <Check size={11} />
              <span>{resultMsg}</span>
            </div>
            {canUndo && (
              <button onClick={undo}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
                <Undo2 size={10} /> Undo
              </button>
            )}
          </div>
        )}

        {(phase === "undo_running" || phase === "undone") && (
          <div className="flex items-center gap-1.5 text-foreground">
            {phase === "undo_running"
              ? <><Loader2 size={11} className="animate-spin" /> Undoing…</>
              : <><Check size={11} className="text-green-600" /> {resultMsg}</>
            }
          </div>
        )}

        {phase === "error" && (
          <p className="text-destructive">{resultMsg}</p>
        )}

        {/* Irreversible warning — shown before user confirms */}
        {phase === "idle" && !preview.can_undo && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertTriangle size={11} />
            <span>This action is irreversible — it cannot be undone.</span>
          </div>
        )}

        {/* Confirm / cancel buttons */}
        {phase === "idle" && (
          <div className="flex items-center gap-2 pt-0.5">
            <button onClick={confirm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
              style={{ background: preview.risk_color }}>
              <Trash2 size={11} /> Confirm
            </button>
            <button onClick={() => setDismissed(true)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 size={11} className="animate-spin" style={{ color: preview.risk_color }} />
            <span>Running…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SSH panel ─────────────────────────────────────────────────────────────────

interface SshStatus {
  active:       boolean;
  saved?:       boolean;
  host?:        string;
  username?:    string;
  connected_at?: string;
}

function SshPanel({ siteId, onStatusChange, refreshTrigger }: { siteId: string; onStatusChange: (active: boolean) => void; refreshTrigger?: number }) {
  const [status, setStatus]              = useState<SshStatus | null>(null);
  const [expanded, setExpanded]          = useState(false);
  const [authMode, setAuthMode]          = useState<"password" | "key">("password");
  const [host, setHost]                  = useState("");
  const [port, setPort]                  = useState("22");
  const [username, setUsername]          = useState("");
  const [password, setPassword]          = useState("");
  const [privateKey, setPrivateKey]      = useState("");
  const [showPw, setShowPw]              = useState(false);
  const [connecting, setConnecting]      = useState(false);
  const [connError, setConnError]        = useState<string | null>(null);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch session status when site changes or after modal-based connect
  useEffect(() => {
    if (!siteId) { setStatus(null); return; }
    api.get<SshStatus>(`/agent/ssh/status/${siteId}`)
      .then(({ data }) => { setStatus(data); onStatusChange(data.active); })
      .catch(() => { setStatus({ active: false }); onStatusChange(false); });
  }, [siteId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async () => {
    setConnecting(true);
    setConnError(null);
    try {
      await api.post("/agent/ssh/connect", {
        site_id:    siteId,
        host:       host.trim(),
        port:       Number(port) || 22,
        username:   username.trim(),
        password:   authMode === "password" ? password : undefined,
        privateKey: authMode === "key"      ? privateKey.trim() : undefined,
      });
      const { data } = await api.get<SshStatus>(`/agent/ssh/status/${siteId}`);
      setStatus(data);
      onStatusChange(data.active);
      setExpanded(false);
      // Clear credentials from state — they're in Redis now
      setPassword(""); setPrivateKey("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setConnError(msg ?? "Connection failed. Check credentials and try again.");
    } finally {
      setConnecting(false);
    }
  };

  const promptDisconnect = () => {
    if (status?.saved) {
      setShowConfirmDisconnect(true);
    } else {
      performDisconnect();
    }
  };

  const performDisconnect = async () => {
    setDisconnecting(true);
    try {
      if (status?.saved) {
        try {
          await api.delete(`/sites/${siteId}/ssh/credentials`);
        } catch { /* best-effort */ }
      }
      try {
        await api.delete(`/agent/ssh/disconnect/${siteId}`);
      } catch { /* best-effort */ }
      setStatus({ active: false });
      onStatusChange(false);
      setExpanded(false);
    } finally {
      setDisconnecting(false);
      setShowConfirmDisconnect(false);
    }
  };

  if (!siteId) return null;

  return (
    <>
      {status?.active ? (
        <div className="flex items-center justify-between px-6 py-2 bg-teal-50 border-b border-teal-100 text-[11px]">
          <div className="flex items-center gap-2 text-teal-700">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <Terminal size={11} className="shrink-0" />
            <span className="font-medium">SSH connected</span>
            {status.username && status.host && (
              <span className="text-teal-600">{status.username}@{status.host}</span>
            )}
            <span className="text-teal-500">{status.saved ? "· encrypted (AES-256-GCM) · full access" : "· full access"}</span>
          </div>
          <button onClick={promptDisconnect}
            className="flex items-center gap-1 text-teal-600 hover:text-red-600 transition-colors font-medium">
            <WifiOff size={10} /> Disconnect
          </button>
        </div>
      ) : (
        <div className="border-b border-border bg-white">
          {/* Collapsed row */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-6 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Terminal size={11} />
              <span>Connect SSH for live file analysis</span>
            </div>
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {expanded && (
            <div className="px-6 pb-4 pt-1 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] text-muted-foreground mb-1">Host</label>
                  <input value={host} onChange={e => setHost(e.target.value)}
                    placeholder="192.168.1.1 or example.com"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-[color:var(--accent)]" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Port</label>
                  <input value={port} onChange={e => setPort(e.target.value)}
                    placeholder="22"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-[color:var(--accent)]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="ubuntu, root, www-data…"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-[color:var(--accent)]" />
              </div>

              {/* Auth mode toggle */}
              <div className="flex items-center gap-1 text-[10px]">
                <button onClick={() => setAuthMode("password")}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${authMode === "password" ? "border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:var(--accent-light)]" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <span className="flex items-center gap-1"><Lock size={9} /> Password</span>
                </button>
                <button onClick={() => setAuthMode("key")}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${authMode === "key" ? "border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:var(--accent-light)]" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <span className="flex items-center gap-1"><KeyRound size={9} /> Private Key</span>
                </button>
              </div>

              {authMode === "password" ? (
                <div className="relative">
                  <label className="block text-[10px] text-muted-foreground mb-1">Password</label>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="SSH password"
                    className="w-full text-xs px-3 py-1.5 pr-8 rounded-lg border border-border bg-white focus:outline-none focus:border-[color:var(--accent)]" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-2 top-6 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Private Key (PEM)</label>
                  <textarea value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    rows={4}
                    className="w-full text-[10px] font-mono px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-[color:var(--accent)] resize-none" />
                </div>
              )}

              {connError && <p className="text-[11px] text-destructive">{connError}</p>}

              <div className="flex items-center gap-2">
                <button onClick={connect}
                  disabled={connecting || !host.trim() || !username.trim() || (authMode === "password" ? !password : !privateKey.trim())}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)" }}>
                  {connecting ? <Loader2 size={11} className="animate-spin" /> : <Wifi size={11} />}
                  {connecting ? "Connecting…" : "Connect"}
                </button>
                <button onClick={() => setExpanded(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <p className="text-[10px] text-muted-foreground ml-1">
                  Credentials are stored in memory only and expire after 30 min.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDisconnect}
        title="Disconnect SSH?"
        message="This removes the saved SSH credentials for this site. You'll need to re-enter them next time."
        confirmText="Disconnect"
        cancelText="Keep Connected"
        isDangerous={true}
        isLoading={disconnecting}
        onConfirm={performDisconnect}
        onCancel={() => setShowConfirmDisconnect(false)}
      />
    </>
  );
}

// Strip artifacts that Llama models sometimes emit as literal text:
//  - <function=... /> / <function>...</function> syntax
//  - Raw JSON lines that are tool call arguments (e.g. {"query":"...","site_id":"..."})
function sanitizeMessage(text: string): string {
  return text
    .replace(/<function[^>]*>[\s\S]*?<\/function>/g, '')
    .replace(/<function[^>]*\/>/g, '')
    .replace(/\[TOOL_CALL\][^\n]*/g, '')
    .replace(/^\s*\{"query":"[^"]*","site_id":"[^"]*"\}\s*$/gm, '')
    .trim();
}

// Parse inline markdown: **bold** and *italic* within a plain string → React nodes.
function renderInline(text: string, key?: number): React.ReactNode {
  // Split on **...** or *...* (non-greedy). Preserve the delimiter to know which tag to use.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  if (parts.length === 1) return text;
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </span>
  );
}

// Render agent text: converts "- item" / "1. item" lines to styled lists,
// prose lines become block spans. Inline **bold** and *italic* are rendered too.
function renderAgentText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  type Mode = 'prose' | 'ul' | 'ol';
  let mode: Mode = 'prose';
  let buffer: string[] = [];
  let k = 0;

  const commit = () => {
    if (!buffer.length) return;
    if (mode === 'ul') {
      out.push(
        <ul key={k++} style={{ listStyleType: 'disc', paddingLeft: '1.25em', margin: '2px 0 6px' }}>
          {buffer.map((t, i) => <li key={i} style={{ marginBottom: 1 }}>{renderInline(t)}</li>)}
        </ul>
      );
    } else if (mode === 'ol') {
      out.push(
        <ol key={k++} style={{ listStyleType: 'decimal', paddingLeft: '1.25em', margin: '2px 0 6px' }}>
          {buffer.map((t, i) => <li key={i} style={{ marginBottom: 1 }}>{renderInline(t)}</li>)}
        </ol>
      );
    } else {
      const t = buffer.join('\n').trim();
      if (t) out.push(<span key={k++} style={{ display: 'block', marginBottom: 4 }}>{renderInline(t)}</span>);
    }
    buffer = [];
  };

  for (const line of lines) {
    const ul = line.match(/^[-•]\s+(.*)/);
    const ol = line.match(/^\d+[.)]\s+(.*)/);
    // Blank lines inside a list block are ignored so LLM blank-line-separated
    // numbered items don't reset the counter by spawning separate <ol> elements.
    if (!ul && !ol && line.trim() === '' && (mode === 'ul' || mode === 'ol')) continue;
    const next: Mode = ul ? 'ul' : ol ? 'ol' : 'prose';
    if (next !== mode) { commit(); mode = next; }
    if (ul) buffer.push(ul[1]);
    else if (ol) buffer.push(ol[1]);
    else buffer.push(line);
  }
  commit();

  return out.length ? <>{out}</> : <>{text}</>;
}

// Consolidated tool call pills — deduplicates repeated calls (e.g. "Live data fetched ×3")
function ToolCallsSummary({ calls }: { calls: ToolCall[] }) {
  const grouped = calls.reduce<{ name: string; count: number; meta: typeof TOOL_META[string]; hasError: boolean }[]>((acc, tc) => {
    const meta = TOOL_META[tc.name] ?? { label: tc.name, icon: Zap, color: "#1f5fb8" };
    const existing = acc.find(g => g.name === tc.name);
    const hasError = typeof tc.result?.error === "string";
    if (existing) { existing.count++; if (hasError) existing.hasError = true; }
    else acc.push({ name: tc.name, count: 1, meta, hasError });
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {grouped.map((g, i) => {
        const Icon = g.meta.icon;
        const color = g.hasError ? "#dc2626" : g.meta.color;
        return (
          <span key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
            style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
            <Icon size={9} />
            {g.meta.label}{g.count > 1 ? <span className="opacity-60">×{g.count}</span> : null}
            {!g.hasError && <Check size={8} className="opacity-50" />}
          </span>
        );
      })}
    </div>
  );
}

function TokenBar({ state, onTopup }: { state: TokenState; onTopup?: () => void }) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);

  // Shown as two separate meters on purpose. Adding them together produced a single
  // "1802k / 2100k" in which a monthly refill of the plan allowance moved the bar by
  // under 5% — so a rollover that had genuinely happened looked like it never did.
  const monthlyBase   = state.monthly_limit ?? state.tokens_limit;
  const planUsed      = Math.min(state.tokens_used, monthlyBase);   // overflow is billed to top-up
  const planPct       = monthlyBase > 0 ? Math.min(100, (planUsed / monthlyBase) * 100) : 0;
  const planWarn      = planPct >= 80;

  const extraTotal    = state.tokens_extra;
  const extraLeft     = Math.max(0, state.extra_remaining ?? (extraTotal - (state.extra_used ?? 0)));
  const extraPct      = extraTotal > 0 ? Math.min(100, ((extraTotal - extraLeft) / extraTotal) * 100) : 0;
  const extraWarn     = extraTotal > 0 && extraLeft <= extraTotal * 0.2;

  const meter = (pct: number, warn: boolean) => (
    <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: warn ? "#ef4444" : "var(--accent)" }} />
    </div>
  );

  return (
    <div className="flex shrink-0 items-center gap-3 rounded-[4px] border border-border bg-white px-3 py-1.5 text-[11px]">
      <div className="flex items-center gap-1.5" title="Plan allowance — refills at the start of each month">
        <span className="font-semibold text-muted-foreground">Plan</span>
        {meter(planPct, planWarn)}
        <span className="tabular-nums whitespace-nowrap text-muted-foreground">
          {fmt(planUsed)} / {fmt(monthlyBase)}
        </span>
      </div>

      {extraTotal > 0 && (
        <>
          <span className="text-border select-none">·</span>
          <div className="flex items-center gap-1.5" title="One-time top-up — a fixed balance that does not refill">
            <span className="font-semibold text-muted-foreground">Top-up</span>
            {meter(extraPct, extraWarn)}
            <span
              className={cn(
                "tabular-nums whitespace-nowrap font-semibold",
                extraLeft <= 0
                  ? "text-[var(--score-bad)]"
                  : extraWarn
                    ? "text-[var(--score-warn)]"
                    : "text-[var(--score-good)]"
              )}
            >
              {fmt(extraLeft)} left
            </span>
          </div>
        </>
      )}
      {onTopup && (
        <button
          type="button"
          onClick={onTopup}
          title="Add tokens"
          className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-accent/25 bg-accent-light text-accent transition-colors hover:bg-accent hover:text-white"
        >
          <Plus size={10} />
        </button>
      )}
    </div>
  );
}

// ── Site selector dropdown — custom-styled (native <select> options can't be styled) ──

const SITE_AVATAR_COLORS = ["#1f5fb8", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
function siteAvatarColor(id: string): string {
  return SITE_AVATAR_COLORS[id.charCodeAt(0) % SITE_AVATAR_COLORS.length];
}

function SiteSelectorDropdown({ sites, selectedSiteId, onChange }: {
  sites: Site[]; selectedSiteId: string; onChange: (id: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selected = sites.find(s => s.id === selectedSiteId);
  const filtered = search.trim()
    ? sites.filter(s => (s.name || s.url).toLowerCase().includes(search.trim().toLowerCase()))
    : sites;

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-[130px] items-center gap-1.5 rounded-[4px] border border-border bg-white py-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground transition-colors hover:bg-[#f7f9fc] sm:min-w-[160px] sm:pr-2.5"
      >
        {selected ? (
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: siteAvatarColor(selected.id) }}>
            {(selected.name || selected.url).charAt(0).toUpperCase()}
          </span>
        ) : (
          <Globe size={13} className="text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 truncate text-left">{selected ? (selected.name || selected.url) : "All sites"}</span>
        <ChevronDown size={11} className={`text-muted-foreground shrink-0 transition-transform duration-fast ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-[4px] border border-border bg-white shadow-elevated-lg">
          {sites.length > 6 && (
            <div className="p-2 border-b border-border/60">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search sites…"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-muted/50 outline-none focus:bg-white focus:shadow-elevated-xs transition-all duration-fast"
              />
            </div>
          )}
          <div className="max-h-72 overflow-y-auto py-1">
            <button
              onClick={() => pick("")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                !selectedSiteId ? "bg-[var(--accent-light)] text-[var(--accent-hover)] font-semibold" : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Globe size={12} className="text-muted-foreground" />
              </span>
              All sites
              {!selectedSiteId && <Check size={13} className="ml-auto text-[var(--accent)]" />}
            </button>
            {filtered.map(s => {
              const isSelected = s.id === selectedSiteId;
              const label = s.name || s.url;
              return (
                <button
                  key={s.id}
                  onClick={() => pick(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                    isSelected ? "bg-[var(--accent-light)] text-[var(--accent-hover)] font-semibold" : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: siteAvatarColor(s.id) }}>
                    {label.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0 truncate">{label}</span>
                  {isSelected && <Check size={13} className="shrink-0 text-[var(--accent)]" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No sites match &quot;{search}&quot;</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Locked SSH bar — shown for non-SSH-eligible plans ────────────────────────

function LockedSshBar() {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-b border-border text-[11px]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock size={11} className="shrink-0" />
        <span className="font-medium">SSH Access</span>
        <span className="text-gray-400">· Upgrade to Agency+ for full SSH server control</span>
      </div>
      <Link href="/billing"
        className="text-[11px] font-semibold hover:underline"
        style={{ color: "var(--accent)" }}>
        Upgrade
      </Link>
    </div>
  );
}

// ── SSH Connect Modal — shown when needs_ssh: true and plan is SSH-eligible ──

function SshConnectModal({ siteId, onConnected, onClose }: {
  siteId:      string;
  onConnected: () => void;
  onClose:     () => void;
}) {
  const [authMode, setAuthMode]     = useState<"password" | "key">("password");
  const [host, setHost]             = useState("");
  const [port, setPort]             = useState("22");
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError]   = useState<string | null>(null);
  const [infoOpen, setInfoOpen]     = useState(false);

  const connect = async () => {
    setConnecting(true);
    setConnError(null);
    try {
      await api.post("/agent/ssh/connect", {
        site_id:    siteId,
        host:       host.trim(),
        port:       Number(port) || 22,
        username:   username.trim(),
        password:   authMode === "password" ? password : undefined,
        privateKey: authMode === "key"      ? privateKey.trim() : undefined,
      });
      setPassword(""); setPrivateKey("");
      onConnected();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setConnError(msg ?? "Connection failed. Check credentials and try again.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-50">
              <Terminal size={13} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-none">SSH Required</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Connect your server to continue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Collapsible info box */}
          <div className="rounded-lg border border-amber-100 bg-amber-50 overflow-hidden">
            <button
              onClick={() => setInfoOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-amber-800 hover:bg-amber-100/60 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={10} /> What SSH enables &amp; how it works
              </span>
              {infoOpen ? <ChevronUp size={11} className="text-amber-600" /> : <ChevronDown size={11} className="text-amber-600" />}
            </button>
            {infoOpen && (
              <div className="px-3 pb-3 text-[11px] text-amber-700 space-y-1.5 border-t border-amber-100">
                <p className="pt-2 text-amber-600">Grants the agent full read/write access to your server:</p>
                <ul className="space-y-0.5 ml-1">
                  <li>· Delete, edit, or create any file on the server</li>
                  <li>· Run WP-CLI, shell commands, manage packages</li>
                  <li>· Read logs, check configs, modify .htaccess</li>
                </ul>
                <p className="text-amber-600 pt-1">Files are auto-backed up before any modification. Credentials are kept in memory only (30 min) and never stored in the database.</p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] text-muted-foreground mb-1">Host</label>
              <input value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.1 or example.com"
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Port</label>
              <input value={port} onChange={e => setPort(e.target.value)} placeholder="22"
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="ubuntu, root, www-data…"
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-teal-500" />
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            {(["password", "key"] as const).map(mode => (
              <button key={mode} onClick={() => setAuthMode(mode)}
                className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${authMode === mode ? "border-teal-500 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {mode === "password" ? <><Lock size={9} /> Password</> : <><KeyRound size={9} /> Private Key</>}
              </button>
            ))}
          </div>

          {authMode === "password" ? (
            <div className="relative">
              <label className="block text-[10px] text-muted-foreground mb-1">Password</label>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="SSH password"
                className="w-full text-xs px-3 py-1.5 pr-8 rounded-lg border border-border bg-white focus:outline-none focus:border-teal-500" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-2 top-6 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Private Key (PEM)</label>
              <textarea value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" rows={3}
                className="w-full text-[10px] font-mono px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:border-teal-500 resize-none" />
            </div>
          )}

          {connError && <p className="text-[11px] text-destructive">{connError}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={connect}
              disabled={connecting || !host.trim() || !username.trim() || (authMode === "password" ? !password : !privateKey.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 bg-teal-600">
              {connecting ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
              {connecting ? "Connecting…" : "Connect SSH"}
            </button>
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SSH Upgrade Modal — shown when needs_ssh: true but plan is not eligible ──

function SshUpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-teal-50">
            <Lock size={24} className="text-teal-600" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">SSH Access Required</h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Advanced operations beyond the 27 predefined actions require SSH access, available on Agency+ plans.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left text-[11px] space-y-2">
            <p className="font-semibold text-foreground">Upgrade to unlock:</p>
            <div className="space-y-1.5 text-muted-foreground">
              {[
                "Delete malware files directly from the server",
                "Run any WP-CLI command",
                "Edit server files (wp-config.php, .htaccess)",
                "Execute any shell command via AI Agent",
                "Install and manage plugins via CLI",
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <Terminal size={9} className="mt-0.5 shrink-0 text-teal-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/billing"
            className="block w-full py-2.5 rounded-xl text-white text-sm font-semibold text-center mb-2 transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            Upgrade to Agency+
          </Link>
          <button onClick={onClose}
            className="w-full py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-gray-50 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentPanel({
  fixedSiteId,
  variant = "standalone",
  initialPrompt,
}: AgentPanelProps) {
  const embedded = variant === "embedded";
  const radius = ROUNDED[variant];
  const { agency } = useAuth();
  const searchParams = useSearchParams();
  const isFreePlan   = agency?.plan === 'free';
  const isIndividual = agency?.account_type === "individual";
  const canUseAgent  = !!agency && !isFreePlan;
  const canUseSsh    = agency?.plan === 'agency' || agency?.plan === 'agency_plus';

  const [sites, setSites]               = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(fixedSiteId ?? "");
  const [messages, setMessages]         = useState<AgentMessage[]>([]);
  const [toolCallsMap, setToolCallsMap] = useState<Record<number, ToolCall[]>>({});
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [workingStatus, setWorkingStatus] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);
  const [tokenState, setTokenState]     = useState<TokenState | null>(null);
  const [showSiteModal, setShowSiteModal]         = useState(false);
  const [showSshModal, setShowSshModal]           = useState(false);
  const [showSshUpgradeModal, setShowSshUpgradeModal] = useState(false);
  const [showTopupModal, setShowTopupModal]       = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  // Optimize mode routes chat to the thin, Cursor-style optimization loop (mode:'optimize').
  const optimizeModeRef = useRef(false);
  // Set by the in-flight send() to a halt function; the Stop button calls it. Cleared when done.
  const stopRef = useRef<(() => void) | null>(null);
  const [pendingMessage, setPendingMessage]       = useState("");
  // Message that failed on out-of-tokens; auto-resent once the balance is topped up.
  const pendingRetryRef = useRef<{ text: string; siteId: string } | null>(null);
  // Always points at the latest sendWithSite so the (mount-once) top-up listener
  // can retry with current state without re-subscribing.
  const sendWithSiteRef = useRef<((text: string, siteId: string, addUserMsg: boolean) => Promise<void>) | null>(null);
  const [sshActive, setSshActive]                 = useState(false);
  const [sshPanelRefresh, setSshPanelRefresh]     = useState(0);
  // Track whether URL params have been applied so we only do it once
  const urlParamsApplied = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fixedSiteId) setSelectedSiteId(fixedSiteId);
  }, [fixedSiteId]);

  useEffect(() => {
    api.get<{ sites: RawSite[] } | RawSite[]>("/sites")
      .then(({ data }) => {
        const raw: RawSite[] = Array.isArray(data) ? data : (data as { sites: RawSite[] }).sites ?? [];
        setSites(raw.map(mapSite));
      })
      .catch(() => {});
  }, []);

  // Apply URL params (site_id/site + prompt) once sites are loaded
  useEffect(() => {
    if (urlParamsApplied.current) return;
    const paramSiteId =
      fixedSiteId ??
      searchParams.get("site_id") ??
      searchParams.get("site");
    const paramPrompt = initialPrompt ?? searchParams.get("prompt");
    if (paramSiteId && sites.length > 0) {
      const match = sites.find((s) => s.id === paramSiteId);
      if (match) {
        setSelectedSiteId(paramSiteId);
        urlParamsApplied.current = true;
      }
    } else if (fixedSiteId) {
      urlParamsApplied.current = true;
    }
    if (paramPrompt) {
      setInput(paramPrompt);
      urlParamsApplied.current = true;
    }
  }, [sites, searchParams, fixedSiteId, initialPrompt]);

  useEffect(() => {
    api.get<TokenState>("/agent/tokens")
      .then(({ data }) => setTokenState(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendWithSite = useCallback(async (text: string, siteId: string, addUserMsg: boolean) => {
    const msgIndex = messages.length + (addUserMsg ? 1 : 0);
    if (addUserMsg) {
      setMessages(prev => [...prev, { role: "user", content: text, created_at: new Date().toISOString() }]);
    }
    setLoading(true);
    setError(null);

    // Live progress feed AND result delivery over one channel. A multi-round agent run
    // can outlast the reverse-proxy timeout (~60s), which kills/retries the POST
    // connection — so we do NOT rely on the POST response for the answer. The backend
    // also stores the finished result under the same progress id; we poll for it and
    // render whichever arrives first (POST or poll). This makes the proxy timeout
    // harmless and also handles a gateway retry (its "busy" reply is ignored — the
    // original run, same progress id, still delivers here).
    const progressId = crypto.randomUUID();
    setWorkingStatus(null);

    let delivered = false;
    const pollDeadline = Date.now() + 5 * 60 * 1000;
    // Aborts the POST locally; the Stop button also tells the backend to halt its loop.
    const controller = new AbortController();

    const stopWork = () => {
      clearInterval(progressTimer);
      stopRef.current = null;
      setWorkingStatus(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Stop button hook — halt the server loop (frees the lock, stops spending), abort the
    // local request, and close out the UI. Guarded by `delivered` so nothing races in after.
    stopRef.current = () => {
      if (delivered) return;
      delivered = true;
      api.post("/agent/stop", { progress_id: progressId }).catch(() => {});
      controller.abort();
      setMessages(prev => [...prev, { role: "assistant", content: "Stopped.", created_at: new Date().toISOString() }]);
      stopWork();
    };

    const finishDelivery = (data: AgentReply) => {
      if (delivered) return;
      delivered = true;
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, created_at: new Date().toISOString() }]);
      if (data.tool_calls?.length) {
        setToolCallsMap(prev => ({ ...prev, [msgIndex]: data.tool_calls! }));
      }
      if (data.tokens_used != null) {
        setTokenState({ tokens_used: data.tokens_used, tokens_limit: data.tokens_limit ?? 0, tokens_extra: data.tokens_extra ?? 0, extra_used: data.extra_used, extra_remaining: data.extra_remaining, monthly_limit: data.monthly_limit });
      }
      stopWork();
    };

    const progressTimer = setInterval(() => {
      if (delivered) { clearInterval(progressTimer); return; }
      if (Date.now() > pollDeadline) {
        setError("This is taking longer than usual. Your changes may still be applying — check the site, or try again in a moment.");
        stopWork();
        return;
      }
      api.get<{ label?: string | null; done?: boolean; result?: AgentReply }>(`/agent/progress/${progressId}`)
        .then(({ data }) => {
          if (delivered) return;
          if (data.done && data.result) finishDelivery(data.result);
          else if (data.label) setWorkingStatus(data.label);
        })
        .catch(() => {});
    }, 1500);

    try {
      const { data } = await api.post<AgentReply & {
        needs_site_selection?: boolean;
        needs_ssh?: boolean;
        can_ssh?:   boolean;
        busy?:      boolean;
      }>("/agent/chat", {
        message: text,
        site_id: siteId || undefined,
        history: messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
        progress_id: progressId,
        mode: optimizeModeRef.current ? "optimize" : undefined,
      }, { signal: controller.signal });

      if (delivered) return; // the poll already rendered the result, or the user stopped

      if (data.needs_site_selection && !fixedSiteId) {
        setPendingMessage(text);
        setShowSiteModal(true);
        stopWork();
        return;
      }

      if (data.needs_ssh) {
        setPendingMessage(text);
        if (data.reply) {
          setMessages(prev => [...prev, { role: "assistant", content: data.reply, created_at: new Date().toISOString() }]);
        }
        if (data.can_ssh) {
          setShowSshModal(true);
        } else {
          setShowSshUpgradeModal(true);
        }
        stopWork();
        return;
      }

      if (data.busy) {
        // A gateway retry hit the still-running original request. Don't render this —
        // the original run (same progress id) will deliver its result via the poll.
        return;
      }

      finishDelivery(data);
    } catch (err: unknown) {
      if (delivered) return;
      const resp = (err as { response?: { status?: number; data?: { error?: string; message?: string; tokens_used?: number; tokens_limit?: number; tokens_extra?: number; extra_used?: number; extra_remaining?: number; monthly_limit?: number } } })?.response;
      const errCode = resp?.data?.error;
      const errMsg  = resp?.data?.message;
      if (resp?.data?.tokens_used != null) {
        // Re-fetch from DB so the bar matches billing page (avoids showing stale limit-reached state)
        api.get<TokenState>("/agent/tokens").then(({ data }) => setTokenState(data)).catch(() => {
          setTokenState({ tokens_used: resp!.data!.tokens_used!, tokens_limit: resp!.data!.tokens_limit ?? 0, tokens_extra: resp!.data!.tokens_extra ?? 0, extra_used: resp!.data!.extra_used, extra_remaining: resp!.data!.extra_remaining, monthly_limit: resp!.data!.monthly_limit });
        });
        setError("Token limit reached. Purchase more tokens to continue.");
        pendingRetryRef.current = { text, siteId };
        setShowTopupModal(true);
        stopWork();
      } else if (errCode === 'rate_limit' || resp?.status === 429) {
        setError(errMsg ?? "AI service is temporarily rate-limited. Please try again in a few minutes.");
        stopWork();
      } else {
        // Most likely the reverse-proxy closed the connection while the agent is still
        // running (no HTTP response body). Do NOT error out — the result is coming over
        // the poll. Keep polling; finishDelivery or the deadline handles the rest.
      }
    }
  }, [messages]);

  // Keep the retry ref pointing at the freshest sendWithSite.
  useEffect(() => { sendWithSiteRef.current = sendWithSite; });

  // Listen for a successful token top-up from the checkout tab (BroadcastChannel,
  // with a localStorage-event fallback). Refresh the balance in place — the chat is
  // never remounted — and auto-resend the message that ran out of tokens.
  useEffect(() => {
    const onTopupSuccess = () => {
      api.get<TokenState>("/agent/tokens").then(({ data }) => setTokenState(data)).catch(() => {});
      setShowTopupModal(false);
      setError(null);
      const retry = pendingRetryRef.current;
      pendingRetryRef.current = null;
      if (retry) {
        toast.success("Tokens added — resuming your request…");
        // Let the balance settle before resending (no duplicate user bubble).
        setTimeout(() => { sendWithSiteRef.current?.(retry.text, retry.siteId, false); }, 400);
      } else {
        toast.success("Tokens added to your balance.");
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("bbss-tokens");
      bc.onmessage = (e) => { if (e.data?.type === "topup-success") onTopupSuccess(); };
    } catch { /* browser without BroadcastChannel */ }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bbss-topup-signal" && e.newValue) {
        try { if (JSON.parse(e.newValue).type === "topup-success") onTopupSuccess(); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => { bc?.close(); window.removeEventListener("storage", onStorage); };
  }, []);

  // Site lookup
  const selectedSite = sites.find(s => s.id === selectedSiteId);

  // PSI Optimization State

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    // Reset textarea height back to single line after send
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // All messages go to Agent (including PSI optimization requests)
    await sendWithSite(trimmed, selectedSiteId, true);
  }, [loading, selectedSiteId, sendWithSite]);

  // After a write operation confirms, auto-send a follow-up so the AI can report before/after
  const handleWriteSuccess = useCallback((operation: string, resultMsg: string, counts: Record<string, unknown>) => {
    // Build a hidden system-level prompt; no user bubble added (addUserMsg = false)
    const sizeOps: Record<string, { query: string; beforeKey: string; label: string }> = {
      optimize_db_tables:        { query: "db_table_sizes",  beforeKey: "total_mb",  label: "total database size" },
      delete_post_revisions:     { query: "revision_bloat",  beforeKey: "revisions", label: "post revision count" },
      delete_expired_transients: { query: "large_transients", beforeKey: "expired",  label: "expired transient count" },
      delete_orphaned_postmeta:  { query: "db_table_sizes",  beforeKey: "tables",    label: "database table count" },
    };
    const sizeOp = sizeOps[operation];
    let followUp: string;
    if (sizeOp && counts[sizeOp.beforeKey] != null) {
      followUp = `[SYSTEM — write operation complete] Operation "${operation}" just executed. ` +
        `Result: ${resultMsg}. Before: ${sizeOp.label} was ${counts[sizeOp.beforeKey]}. ` +
        `Now call get_live_site_data with query="${sizeOp.query}" to get the current (after) value, ` +
        `then give the user a concise before → after comparison. Keep it short.`;
    } else {
      followUp = `[SYSTEM — write operation complete] Operation "${operation}" just executed successfully. ` +
        `Result: ${resultMsg}. Give the user a brief confirmation of what was accomplished. Keep it to 1-2 sentences.`;
    }
    sendWithSite(followUp, selectedSiteId, false);
  }, [selectedSiteId, sendWithSite]);

  const handleSiteModalSelect = useCallback(async (siteId: string) => {
    setShowSiteModal(false);
    setSelectedSiteId(siteId);
    const msg = pendingMessage;
    setPendingMessage("");
    if (msg) {
      await sendWithSite(msg, siteId, false);
    }
  }, [pendingMessage, sendWithSite]);

  const handleSshConnected = useCallback(async () => {
    setShowSshModal(false);
    setSshActive(true);
    setSshPanelRefresh(v => v + 1);
    const msg = pendingMessage;
    setPendingMessage("");
    if (msg) {
      await sendWithSite(msg, selectedSiteId, false);
    }
  }, [pendingMessage, selectedSiteId, sendWithSite]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter while a run is in flight — one turn at a time (use Stop to interrupt).
    if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); send(input); }
  };

  const handleSiteChange = (id: string) => {
    // Disconnect SSH from previous site (best-effort, fire-and-forget)
    if (selectedSiteId && sshActive) {
      api.delete(`/agent/ssh/disconnect/${selectedSiteId}`).catch(() => {});
    }
    setSelectedSiteId(id);
    setSshActive(false);
    setMessages([]);
    setToolCallsMap({});
    setError(null);
  };

  const copyTranscript = () => {
    const context = selectedSite ? `Site: ${selectedSite.name || selectedSite.url}` : "All sites";
    const lines = [
      `AI Assistant transcript — ${context}`,
      `Date: ${new Date().toLocaleString()}`,
      "",
      ...messages.map(m => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`),
    ];
    navigator.clipboard.writeText(lines.join("\n\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isTokenLimitError = error === "Token limit reached. Purchase more tokens to continue.";
  const suggestions  = selectedSiteId ? SUGGESTIONS_SITE : SUGGESTIONS_GLOBAL;
  const isEmpty      = messages.length === 0;

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", embedded && "bg-transparent")}>

      {/* ── Top bar (standalone only — site detail uses SiteHeader) ─────────── */}
      {!embedded && (
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-3 py-3 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <McIconBox icon={<Bot size={16} strokeWidth={2.25} />} tone="accent" size="md" />
          <div className="min-w-0">
            <h1 className="font-portal-display truncate text-base font-bold leading-none text-foreground">
              AI Assistant
            </h1>
            <p className="mt-0.5 hidden text-[11px] text-muted-foreground xl:block">
              Powered by real audit &amp; scan data
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {tokenState && canUseAgent && <div className="hidden md:flex"><TokenBar state={tokenState} onTopup={() => setShowTopupModal(true)} /></div>}

          {messages.length > 0 && (
            <>
              {selectedSiteId && canUseAgent && (
                <button
                  onClick={() => { if (!loading) send(UNDO_PROMPT); }}
                  disabled={loading}
                  title="Undo the changes the assistant made"
                  className="flex items-center gap-1.5 rounded-[4px] border border-amber-200 px-2 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 lg:px-3"
                >
                  <Undo2 size={11} /><span className="hidden lg:inline">Undo</span>
                </button>
              )}
              <button
                onClick={copyTranscript}
                title="Copy transcript"
                className="flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3"
              >
                {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                <span className="hidden lg:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={() => {
                  if (selectedSiteId && sshActive) {
                    api.delete(`/agent/ssh/disconnect/${selectedSiteId}`).catch(() => {});
                    setSshActive(false);
                  }
                  setMessages([]); setToolCallsMap({}); setError(null);
                  optimizeModeRef.current = false;
                }}
                title="New chat"
                className="flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3"
              >
                <RotateCcw size={11} /><span className="hidden lg:inline">New chat</span>
              </button>
            </>
          )}
          {!fixedSiteId && (
            <SiteSelectorDropdown sites={sites} selectedSiteId={selectedSiteId} onChange={handleSiteChange} />
          )}
        </div>
      </div>
      )}

      {/* ── Embedded toolbar ─────────────────────────────────────────────────── */}
      {embedded && !isFreePlan && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <McIconBox icon={<Bot size={16} strokeWidth={2.25} />} tone="accent" size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">AI Agent</p>
              <p className="truncate text-xs text-zinc-500">Powered by live audit &amp; scan data</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {tokenState && canUseAgent && (
              <div className="hidden md:flex">
                <TokenBar state={tokenState} onTopup={() => setShowTopupModal(true)} />
              </div>
            )}
            {messages.length > 0 && (
              <>
                {selectedSiteId && canUseAgent && (
                  <button
                    onClick={() => { if (!loading) send(UNDO_PROMPT); }}
                    disabled={loading}
                    title="Undo the changes the assistant made"
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 px-2 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 lg:px-3"
                  >
                    <Undo2 size={11} /><span className="hidden lg:inline">Undo</span>
                  </button>
                )}
                <button
                  onClick={copyTranscript}
                  title="Copy transcript"
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 lg:px-3"
                >
                  {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  <span className="hidden lg:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedSiteId && sshActive) {
                      api.delete(`/agent/ssh/disconnect/${selectedSiteId}`).catch(() => {});
                      setSshActive(false);
                    }
                    setMessages([]); setToolCallsMap({}); setError(null);
                    optimizeModeRef.current = false;
                  }}
                  title="New chat"
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 lg:px-3"
                >
                  <RotateCcw size={11} /><span className="hidden lg:inline">New chat</span>
                </button>
              </>
            )}
            {!fixedSiteId && (
              <SiteSelectorDropdown sites={sites} selectedSiteId={selectedSiteId} onChange={handleSiteChange} />
            )}
          </div>
        </div>
      )}

      {/* ── SSH panel (site-specific, below top bar) ────────────────────────── */}
      {!isFreePlan && selectedSiteId && (
        canUseSsh
          ? <SshPanel siteId={selectedSiteId} onStatusChange={setSshActive} refreshTrigger={sshPanelRefresh} />
          : <LockedSshBar />
      )}

      {/* ── Free plan upgrade wall ───────────────────────────────────────────── */}
      {isFreePlan && (
        <div className="flex flex-1 items-center justify-center bg-[var(--background)] p-6">
          <div className="w-full max-w-md text-center">
            <McIconBox icon={<Bot size={20} strokeWidth={2.25} />} tone="accent" size="lg" className="mx-auto" />
            <h2 className="font-portal-display mb-2 mt-4 text-xl font-bold text-foreground">AI Assistant</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {isIndividual
                ? "AI Assistant is available on upgraded plans. Get plain-English explanations of your audit results, find out exactly what to fix, and take action — no technical knowledge needed."
                : "AI Assistant is available on upgraded plans. Ask questions about your sites, get audit insights, run audits, send reports, and more — all in plain English."}
            </p>
            <div className="mb-6 space-y-2 rounded-[4px] border border-border bg-white p-4 text-left">
              {(isIndividual ? [
                "\"What's wrong with my site right now?\"",
                "\"Is my WordPress version up to date?\"",
                "\"Why is my security score low and how do I fix it?\"",
                "\"Run a full audit and explain the results\"",
              ] : [
                "\"What's the most urgent issue on my site?\"",
                "\"Which plugins need updating?\"",
                "\"Run an audit and send me a report\"",
                "\"Why is my security score low?\"",
              ]).map(q => (
                <p key={q} className="text-sm italic text-muted-foreground">{q}</p>
              ))}
            </div>
            <Link href="/billing?from=%2Fagent">
              <Button>
                <Zap size={14} />
                Upgrade to unlock
              </Button>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              {isIndividual
                ? "Basic AI summaries on your audit reports are always free."
                : "AI summaries on your audit reports are always included — free for all plans."}
            </p>
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      {!isFreePlan && (
        <div className={cn("relative min-h-0 flex-1 overflow-y-auto", embedded ? "bg-transparent" : "bg-[var(--background)]")}>
          <div className={cn("relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10", embedded && "py-6 sm:py-8")}>

            {isEmpty ? (
              <div className="flex flex-col items-center text-center">
                <McIconBox icon={<Bot size={22} strokeWidth={2.25} />} tone="accent" size="lg" />

                <h2 className="mt-5 text-xl font-bold tracking-tight text-zinc-950">
                  {selectedSite ? `Let's look at ${selectedSite.name || selectedSite.url}` : "How can I help today?"}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                  Live access to your audit scores, security signals, malware scans, and plugin data.
                </p>

                {selectedSite && canUseAgent && (
                  <Button className="mt-6" size="sm" onClick={() => setShowOptimizeModal(true)}>
                    <Zap size={14} />
                    Start performance optimization
                  </Button>
                )}

                <div className={cn("mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2", embedded && "max-w-2xl")}>
                  {suggestions.map(({ q, icon: Icon }) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className={cn(
                        "flex items-start gap-3 border bg-white px-4 py-3.5 text-left text-sm transition-colors hover:border-accent/30 hover:bg-[#f7f9fc]",
                        embedded ? "rounded-2xl border-zinc-200" : "rounded-[4px] border-border"
                      )}
                    >
                      <McIconBox icon={<Icon size={14} strokeWidth={2.25} />} tone="accent" size="sm" className="mt-0.5" />
                      <span className="font-medium leading-snug text-zinc-900">{q}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-8 text-xs tracking-wide text-zinc-400">
                  Actions require your confirmation
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <McIconBox icon={<Bot size={14} strokeWidth={2.25} />} tone="accent" size="sm" className="mt-1" />
                    )}
                    <div className="flex max-w-[76%] flex-col gap-2">
                      {/* Write confirmation cards shown FIRST so user acts before reading result */}
                      {msg.role === "assistant" && toolCallsMap[i] && (() => {
                        const calls = toolCallsMap[i];
                        const writeCalls = calls.filter(tc => tc.name === "preview_write_operation" && (tc.result as unknown as WritePreview).write_preview);
                        if (!writeCalls.length) return null;
                        const isMulti = writeCalls.length > 1;
                        return (
                          <WriteBatch writeCalls={writeCalls} siteId={selectedSiteId} onSuccess={handleWriteSuccess} isMulti={isMulti} />
                        );
                      })()}

                      {/* Regular tool call pills shown BEFORE the text bubble so the answer is always visible at the bottom */}
                      {msg.role === "assistant" && toolCallsMap[i] && (() => {
                        const regularCalls = toolCallsMap[i].filter(tc => tc.name !== "preview_write_operation");
                        return regularCalls.length > 0 ? <ToolCallsSummary calls={regularCalls} /> : null;
                      })()}

                      <div
                        className={cn(
                          "text-sm leading-relaxed whitespace-pre-wrap",
                          msg.role === "user"
                            ? cn(radius, "rounded-br-sm bg-accent px-4 py-2.5 font-medium text-white shadow-[0_1px_2px_rgb(26_86_219/0.2)]")
                            : cn(radius, "rounded-bl-sm border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-[0_1px_2px_rgb(26_29_35/0.04)]")
                        )}
                      >
                        {msg.role === "assistant" ? renderAgentText(sanitizeMessage(msg.content)) : msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start gap-3">
                    <McIconBox icon={<Bot size={14} strokeWidth={2.25} />} tone="accent" size="sm" className="mt-1" />
                    <div className={cn("flex items-center gap-2 border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(26_29_35/0.04)]", radius)}>
                      <span className="flex items-center gap-1.5">
                        {[0, 160, 320].map(delay => (
                          <span
                            key={delay}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent opacity-70"
                            style={{ animationDelay: `${delay}ms`, animationDuration: "1.1s" }}
                          />
                        ))}
                      </span>
                      {workingStatus && (
                        <span className="animate-pulse text-xs font-medium text-muted-foreground" key={workingStatus}>
                          {workingStatus}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center px-2">
                    <McAlert variant="error" title="Something went wrong" className="max-w-sm w-full">
                      {error}
                      {isTokenLimitError && (
                        <button
                          type="button"
                          onClick={() => setShowTopupModal(true)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                        >
                          <Zap size={11} /> Add tokens &amp; continue
                        </button>
                      )}
                    </McAlert>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SSH Connect modal ────────────────────────────────────────────────── */}
      {showSshModal && selectedSiteId && (
        <SshConnectModal
          siteId={selectedSiteId}
          onConnected={handleSshConnected}
          onClose={() => setShowSshModal(false)}
        />
      )}

      {/* ── SSH Upgrade modal ─────────────────────────────────────────────────── */}
      {showSshUpgradeModal && (
        <SshUpgradeModal onClose={() => setShowSshUpgradeModal(false)} />
      )}

      {/* ── Token top-up modal (checkout opens in a new tab; chat stays intact) ── */}
      {showTopupModal && (
        <TokenTopupModal
          outOfCredits={isTokenLimitError}
          onClose={() => setShowTopupModal(false)}
        />
      )}

      {/* ── Start Performance Optimization modal (backup consent + flow) ───────── */}
      {showOptimizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowOptimizeModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Start Performance Optimization</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedSite?.name || selectedSite?.url}</p>
                </div>
              </div>
              <button onClick={() => setShowOptimizeModal(false)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>Here's how it works, step by step:</p>
              <ol className="space-y-3">
                {[
                  "Measures your live PageSpeed and explains, in plain words, what's actually slowing the site down.",
                  "Fixes issues one at a time — only with your approval. Nothing is applied in bulk.",
                  "Takes a full backup (database + files) before any change, so everything is recoverable.",
                  "You check the site after each change — and you can say “undo” at any time.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-semibold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ol>
              {!sshActive && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  Tip: connect SSH (below the top bar) so the assistant can make server-side fixes, not just measure.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                For a full restore in a worst-case scenario, a backup is always available under Site Details → Backups.
              </p>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setShowOptimizeModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { optimizeModeRef.current = true; setShowOptimizeModal(false); send(OPTIMIZE_PROMPT); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--accent)" }}
              >
                Start &amp; Back Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Choose Site modal ────────────────────────────────────────────────── */}
      {showSiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowSiteModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
                  <Database size={13} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-none">Choose a site</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Which site are you asking about?</p>
                </div>
              </div>
              <button onClick={() => setShowSiteModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto space-y-1">
              {sites.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No sites connected yet.</p>
              )}
              {sites.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSiteModalSelect(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                    {(s.name || s.url).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name || s.url}</p>
                    {s.name && <p className="text-[11px] text-muted-foreground truncate">{s.url}</p>}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.plugin_connected ? "bg-green-500" : "bg-gray-300"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────────── */}
      {!isFreePlan && (
        <div
          className={cn(
            "shrink-0 border-t px-4 pt-3 sm:px-6",
            embedded ? "border-zinc-100 bg-transparent" : "border-border bg-white"
          )}
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
        >
          <div className="mx-auto max-w-3xl">
            <div className={cn(
              "flex items-end gap-2 border bg-white px-3 py-2 shadow-[0_1px_2px_rgb(26_29_35/0.04)] focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10",
              embedded ? "rounded-2xl border-zinc-200" : "rounded-[4px] border-border"
            )}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 140) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  !canUseAgent
                    ? "Upgrade to unlock AI Assistant…"
                    : selectedSite
                    ? `Ask about ${selectedSite.name || selectedSite.url}…`
                    : "Ask anything about your sites…"
                }
                rows={1}
                disabled={!canUseAgent}
                className="no-focus-ring min-h-[28px] max-h-[140px] flex-1 resize-none border-0 bg-transparent py-1.5 text-sm text-foreground outline-none ring-0 disabled:cursor-not-allowed"
                style={{ overflowY: "auto", caretColor: "var(--accent)" }}
              />
              {loading ? (
                <button
                  type="button"
                  onClick={() => stopRef.current?.()}
                  className={cn("mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--score-bad)] text-white transition-opacity hover:opacity-90", radius)}
                  aria-label="Stop"
                  title="Stop"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!input.trim() || !canUseAgent}
                  className={cn("mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-accent text-white transition-opacity hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-35", radius)}
                  aria-label="Send"
                >
                  <Send size={14} />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-xs tracking-wide text-zinc-400">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
