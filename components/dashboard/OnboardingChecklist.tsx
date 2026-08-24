"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, ListChecks, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Agency, Site } from "@/types";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  hrefLabel?: string;
}

interface OnboardingChecklistProps {
  agency: Agency;
  sites: Site[];
}

function buildItems(agency: Agency, sites: Site[]): ChecklistItem[] {
  const hasPlugin = sites.some((s) => s.plugin_connected);
  const hasBranding = !!(agency.logo_url || agency.brand_name);
  const hasSchedule = sites.some((s) => s.scan_schedule !== "manual");
  const isIndividual = agency.account_type === "individual";

  const items: ChecklistItem[] = [
    {
      id: "add_site",
      label: isIndividual ? "Add your site" : "Add your first site",
      done: sites.length > 0,
      href: "/sites/add",
      hrefLabel: "Add a site",
    },
    {
      id: "install_plugin",
      label: "Connect the WordPress plugin",
      done: hasPlugin,
      href: "/connect",
      hrefLabel: "Connect plugin",
    },
  ];

  if (!isIndividual) {
    items.push(
      {
        id: "white_label",
        label: "Set up white-label branding",
        done: hasBranding,
        href: "/settings/white-label",
        hrefLabel: "Open branding",
      },
      {
        id: "add_client",
        label: "Add a client",
        done: false,
        href: "/clients/add",
        hrefLabel: "Add a client",
      }
    );
  }

  items.push({
    id: "schedule_report",
    label: "Schedule a report",
    done: hasSchedule,
    href: sites[0] ? `/sites/${sites[0].id}` : "/sites",
    hrefLabel: "Open site settings",
  });

  if (!isIndividual) {
    items.push({
      id: "invite_team",
      label: "Invite a team member",
      done: false,
      href: "/settings/team",
      hrefLabel: "Manage team",
    });
  }

  return items;
}

export function OnboardingChecklist({ agency, sites }: OnboardingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => buildItems(agency, sites));
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const isNew = (() => {
    if (!agency.created_at) return true;
    const age = Date.now() - new Date(agency.created_at).getTime();
    return age < 30 * 24 * 3600 * 1000;
  })();

  useEffect(() => {
    const isIndividual = agency.account_type === "individual";
    if (isIndividual) return;

    async function fetchAsyncState() {
      try {
        const [clientsRes, teamRes] = await Promise.all([
          api.get<{ clients: unknown[] } | unknown[]>("/clients"),
          api.get<{ members: unknown[] } | unknown[]>("/team"),
        ]);
        const clients = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : (clientsRes.data as { clients: unknown[] }).clients ?? [];
        const members = Array.isArray(teamRes.data)
          ? teamRes.data
          : (teamRes.data as { members: unknown[] }).members ?? [];

        setItems((prev) =>
          prev.map((item) => {
            if (item.id === "add_client") return { ...item, done: clients.length > 0 };
            if (item.id === "invite_team") return { ...item, done: members.length > 1 };
            return item;
          })
        );
      } catch {
        // non-critical
      }
    }
    fetchAsyncState();
  }, [agency.account_type]);

  useEffect(() => {
    setItems((prev) => {
      const next = buildItems(agency, sites);
      return next.map((item) => {
        const existing = prev.find((p) => p.id === item.id);
        if (item.id === "add_client" || item.id === "invite_team") return existing ?? item;
        return item;
      });
    });
  }, [agency, sites]);

  useEffect(() => {
    if (localStorage.getItem("bbss_checklist_dismissed") === "true") setDismissed(true);
    if (localStorage.getItem("bbss_checklist_collapsed") === "false") setCollapsed(false);
  }, []);

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  function dismiss() {
    localStorage.setItem("bbss_checklist_dismissed", "true");
    setDismissed(true);
  }

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("bbss_checklist_collapsed", String(next));
  }

  if (!isNew || dismissed || allDone) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl" style={{ background: "#fbf3fa" }}>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#7c3aed]">
            <ListChecks size={15} strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold text-[#5b21b6]">Getting started</p>
          <span className="text-xs font-medium text-[#7c3aed]/70">
            {doneCount}/{total} complete
          </span>
          <div className="h-1.5 max-w-[140px] flex-1 overflow-hidden rounded-full bg-[#7c3aed]/15">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </button>
        <button
          type="button"
          onClick={dismiss}
          title="Dismiss permanently"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#7c3aed]/50 transition-colors hover:bg-white/70 hover:text-[#5b21b6]"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand" : "Collapse"}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#7c3aed]/50 transition-colors hover:bg-white/70 hover:text-[#5b21b6]"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="overflow-hidden rounded-xl bg-white/70">
            {items.map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5",
                  i > 0 && "border-t border-[#7c3aed]/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    item.done ? "bg-emerald-500 text-white" : "border border-[#7c3aed]/25 bg-white"
                  )}
                >
                  {item.done ? <Check size={11} strokeWidth={2.5} /> : null}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    item.done ? "text-[#7c3aed]/50 line-through" : "text-[#5b21b6]"
                  )}
                >
                  {item.label}
                </span>
                {!item.done && item.href && (
                  <Link
                    href={item.href}
                    className="shrink-0 text-xs font-semibold text-[#7c3aed] hover:underline"
                  >
                    {item.hrefLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
