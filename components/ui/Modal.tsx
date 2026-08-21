"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

/** MalCare-clean dialog: soft white panel, icon header, quiet footer */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-[4px] border border-[rgb(15_23_42/0.08)] bg-white shadow-[0_24px_64px_-16px_rgb(15_23_42/0.28)] outline-none",
          sizeMap[size],
          className
        )}
      >
        {(title || description || icon) && (
          <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-5">
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-accent-light text-accent">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0 pt-0.5">
                {title ? (
                  <h2
                    id={titleId}
                    className="text-[15px] font-bold tracking-tight text-foreground"
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#f4f6f9] hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? (
          <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
