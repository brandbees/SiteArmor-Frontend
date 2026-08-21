"use client";

import { useState } from "react";
import { Shield, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface ConfirmationModalProps {
  site_url: string;
  psi_mobile_before: number;
  psi_desktop_before: number;
  tier: "low" | "medium" | "high";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  site_url,
  psi_mobile_before,
  psi_desktop_before,
  tier,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const riskLevel = tier === "low" ? "Low" : tier === "medium" ? "Medium" : "High";
  const riskVariant =
    tier === "low" ? "success" : tier === "medium" ? "warning" : "error";

  return (
    <Modal
      open
      onClose={() => {
        if (!isLoading) onCancel();
      }}
      size="lg"
      title="PSI Autonomous Optimization"
      description="Review & confirm optimization settings"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!termsAccepted || isLoading}
            loading={isLoading}
          >
            Start Optimization
          </Button>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-auto">
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-bold text-foreground">Site Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                URL
              </p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">{site_url}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current PSI Score
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-md bg-accent-light px-2.5 py-1 text-xs font-bold text-accent">
                  Mobile: {psi_mobile_before}
                </span>
                <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                  Desktop: {psi_desktop_before}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Alert variant={riskVariant} title={`${riskLevel} Risk`}>
          {tier === "low" && "Only CSS-only, no-risk optimizations will be applied."}
          {tier === "medium" && "Both CSS and isolated PHP changes will be deployed."}
          {tier === "high" &&
            "All optimizations including functionality changes may be deployed."}
        </Alert>

        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Shield size={15} className="text-accent" />
            How It Works
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              ["Deploy Fix", "A single optimization is deployed to your site"],
              ["Verify", "You review 6 quality checks to ensure nothing broke"],
              ["Approve or Rollback", "Either approve the change or instantly rollback"],
              ["Repeat", "Continue with next fix or stop optimization"],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-light text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-foreground">{title}</strong> — {body}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Alert variant="info" title="Your site is safe">
          If any fix causes issues, we automatically rollback within seconds. You maintain
          full control at every step.
        </Alert>

        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Clock size={15} />
            Estimated Duration
          </h3>
          <p className="text-sm text-muted-foreground">
            Each optimization iteration typically takes <strong className="text-foreground">2–5 minutes</strong> depending on your site size and complexity.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          <span className="text-sm text-muted-foreground">
            I understand the optimization process and risks involved. I authorize the agent
            to deploy fixes iteratively with my approval at each step.
          </span>
        </label>
      </div>
    </Modal>
  );
}
