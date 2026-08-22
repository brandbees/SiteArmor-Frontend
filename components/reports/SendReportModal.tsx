"use client";

import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidEmail } from "@/lib/utils";
import type { ReportListItem } from "@/lib/reports";

export function SendReportModal({
  report,
  clientEmail,
  onClose,
  onSent,
}: {
  report: ReportListItem;
  clientEmail?: string | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const defaultEmail = report.sent_to ?? clientEmail ?? "";
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email.trim() || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.post(`/reports/send/${report.id}`, { email: email.trim() });
      onSent();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Failed to send"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Send Report"
      description="Email the client portal link to your client"
      icon={<Send size={18} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={sending} disabled={!email.trim()} onClick={handleSend}>
            <Send size={14} />
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-600">
          Recipient email
          {clientEmail && email === clientEmail && (
            <span className="ml-2 text-[10px] font-normal text-accent">· from client profile</span>
          )}
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
        />
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle size={12} /> {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
