"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { connectSSH, SSHCredentials } from "@/lib/api/ssh";

interface SSHConnectModalProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export function SSHConnectModal({
  siteId,
  isOpen,
  onClose,
  onSuccess,
}: SSHConnectModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [formData, setFormData] = useState<SSHCredentials>({
    host: "",
    port: 22,
    username: "",
    password: "",
    privateKey: "",
  });

  const handleConnect = async () => {
    if (!formData.host || !formData.username) {
      toast.error("Host and username are required");
      return;
    }

    if (!usePrivateKey && !formData.password) {
      toast.error("Enter password or use private key");
      return;
    }

    setLoading(true);
    try {
      const result = await connectSSH(siteId, formData, saveCredentials);
      toast.success("SSH connected!");
      onSuccess(result.ssh_token);

      if (saveCredentials) {
        toast.success("Credentials saved for future use");
      }

      setFormData({ host: "", port: 22, username: "", password: "", privateKey: "" });
      setSaveCredentials(false);
      onClose();
    } catch (error) {
      toast.error("Connection failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Enter SSH Credentials"
      description="Connect securely to run remediations on this site."
      footer={
        <>
          <Button onClick={onClose} disabled={loading} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConnect} loading={loading}>
            Connect
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert variant="info">
          <span className="inline-flex items-center gap-1.5">
            <Shield size={14} />
            Credentials are encrypted with AES-256.
          </span>
        </Alert>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Host *
          </label>
          <Input
            type="text"
            placeholder="ssh.example.com"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Port
            </label>
            <Input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Username *
            </label>
            <Input
              type="text"
              placeholder="deploy"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <input
            type="checkbox"
            checked={usePrivateKey}
            onChange={(e) => setUsePrivateKey(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-sm font-semibold text-foreground">Use Private Key</span>
        </label>

        {usePrivateKey ? (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Private Key
            </label>
            <textarea
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
              value={formData.privateKey || ""}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.12)]"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Password *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--score-good-border)] bg-[var(--score-good-bg)] p-3">
          <input
            type="checkbox"
            checked={saveCredentials}
            onChange={(e) => setSaveCredentials(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-sm font-semibold text-[var(--score-good)]">
            Save credentials for future use (encrypted)
          </span>
        </label>
      </div>
    </Modal>
  );
}
