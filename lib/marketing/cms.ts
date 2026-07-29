import type { CmsSection } from "@/lib/cms";

/** Pull DB-stored field overrides for one section. Components supply their own defaults. */
export function sf(
  sections: CmsSection[],
  key: string
): Record<string, string> {
  return sections.find((s) => s.section_key === key)?.fields ?? {};
}

/** Field reader bound to a CMS override map. */
export function cmsField(cms: Record<string, string> = {}) {
  return (key: string, fallback: string) => cms[key] || fallback;
}
