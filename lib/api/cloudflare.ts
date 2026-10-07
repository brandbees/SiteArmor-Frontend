import api from "@/lib/api";

export type CloudflareConnectionStatus = {
  connected: boolean;
  mode: "byo" | "hosted" | null;
  status: "pending_ns" | "active" | "error" | "disconnected" | null;
  zone_id: string | null;
  zone_name: string | null;
  nameservers: string[];
  last_verified_at: string | null;
  last_error: string | null;
  hosted_available?: boolean;
  apex?: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
};

function errMessage(err: unknown, fallback: string) {
  const ax = err as { response?: { data?: { error?: string } }; message?: string };
  return ax?.response?.data?.error || ax?.message || fallback;
}

export async function getCloudflareStatus(siteId: string): Promise<CloudflareConnectionStatus> {
  try {
    const { data } = await api.get<CloudflareConnectionStatus>(`/sites/${siteId}/cloudflare/status`);
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to load Cloudflare status"));
  }
}

export async function connectCloudflareByo(
  siteId: string,
  apiToken: string
): Promise<CloudflareConnectionStatus> {
  try {
    const { data } = await api.post<CloudflareConnectionStatus>(
      `/sites/${siteId}/cloudflare/connect/byo`,
      { api_token: apiToken }
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to connect with Cloudflare token"));
  }
}

export async function connectCloudflareHosted(siteId: string): Promise<CloudflareConnectionStatus> {
  try {
    const { data } = await api.post<CloudflareConnectionStatus>(
      `/sites/${siteId}/cloudflare/connect/hosted`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to create Hosted Free zone"));
  }
}

export async function verifyCloudflareConnection(siteId: string): Promise<CloudflareConnectionStatus> {
  try {
    const { data } = await api.post<CloudflareConnectionStatus>(
      `/sites/${siteId}/cloudflare/verify`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Verification failed"));
  }
}

export async function disconnectCloudflare(siteId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/sites/${siteId}/cloudflare/disconnect`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to disconnect"));
  }
}

export type CloudflareDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  proxiable: boolean;
  priority: number | null;
  locked: boolean;
  created_on?: string | null;
  modified_on?: string | null;
};

export type DnsRecordInput = {
  type: string;
  name: string;
  content: string;
  ttl?: number | "auto";
  proxied?: boolean;
  priority?: number;
  confirm_mx?: boolean;
};

export async function listDnsRecords(siteId: string) {
  try {
    const { data } = await api.get<{
      zone_id: string;
      zone_name: string;
      limit: number;
      count: number;
      records: CloudflareDnsRecord[];
      editable_types: string[];
    }>(`/sites/${siteId}/cloudflare/dns`);
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to load DNS records"));
  }
}

export async function createDnsRecord(siteId: string, input: DnsRecordInput) {
  try {
    const { data } = await api.post<{ record: CloudflareDnsRecord }>(
      `/sites/${siteId}/cloudflare/dns`,
      input
    );
    return data.record;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to create DNS record"));
  }
}

export async function updateDnsRecord(
  siteId: string,
  recordId: string,
  input: DnsRecordInput
) {
  try {
    const { data } = await api.patch<{ record: CloudflareDnsRecord }>(
      `/sites/${siteId}/cloudflare/dns/${recordId}`,
      input
    );
    return data.record;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to update DNS record"));
  }
}

export async function deleteDnsRecord(
  siteId: string,
  recordId: string,
  confirmMx = false
) {
  try {
    const qs = confirmMx ? "?confirm_mx=true" : "";
    const { data } = await api.delete<{ success: boolean; id: string }>(
      `/sites/${siteId}/cloudflare/dns/${recordId}${qs}`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to delete DNS record"));
  }
}

export async function importPublicDns(siteId: string, force = false) {
  try {
    const { data } = await api.post<{
      imported: number;
      skipped: boolean;
      reason?: string;
      records?: CloudflareDnsRecord[];
    }>(`/sites/${siteId}/cloudflare/dns/import-public`, { force });
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to import public DNS"));
  }
}

export async function importZoneFile(siteId: string, zoneText: string) {
  try {
    const { data } = await api.post<{
      imported: number;
      skipped: number;
      errors: string[];
      records: CloudflareDnsRecord[];
    }>(`/sites/${siteId}/cloudflare/dns/import-zone`, { zone_text: zoneText });
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to import zone file"));
  }
}

/** Build a BIND-style zone file from records (Cloudflare-export compatible). */
export function recordsToBindZone(
  records: CloudflareDnsRecord[],
  zoneName: string
): string {
  const lines = [
    `; Site Armor DNS export for ${zoneName}`,
    `; Exported ${new Date().toISOString()}`,
    `$ORIGIN ${zoneName}.`,
    `$TTL 3600`,
    "",
  ];
  for (const r of records) {
    const name = r.name === zoneName ? "@" : r.name.replace(new RegExp(`\\.${zoneName.replace(/\./g, "\\.")}$`), "");
    const ttl = r.ttl === 1 ? 3600 : r.ttl;
    if (r.type === "MX") {
      lines.push(`${name}\t${ttl}\tIN\tMX\t${r.priority ?? 10}\t${r.content}.`);
    } else if (r.type === "TXT") {
      const escaped = r.content.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`${name}\t${ttl}\tIN\tTXT\t"${escaped}"`);
    } else if (r.type === "CNAME") {
      lines.push(`${name}\t${ttl}\tIN\tCNAME\t${r.content}.`);
    } else {
      lines.push(`${name}\t${ttl}\tIN\t${r.type}\t${r.content}`);
    }
  }
  return lines.join("\n") + "\n";
}

export type CloudflareWafRule = {
  id: string;
  action: string;
  expression: string;
  description: string;
  enabled: boolean;
  last_updated?: string | null;
  created_by_site_armor?: boolean;
  kind?: "custom" | "rate_limit";
  ratelimit?: {
    characteristics?: string[];
    period?: number;
    requests_per_period?: number;
    mitigation_timeout?: number;
  } | null;
};

export type WafCondition = {
  field: string;
  operator: string;
  value: string;
};

export type WafRuleInput = {
  action: "block" | "managed_challenge";
  description?: string;
  enabled?: boolean;
  preset?: "path" | "ip" | "country" | "advanced" | "builder" | "expression";
  path?: string;
  ip?: string;
  country?: string;
  expression?: string;
  conditions?: WafCondition[];
  combinator?: "and" | "or";
};

export type RateLimitInput = {
  action?: "block" | "managed_challenge";
  description?: string;
  expression?: string;
  path?: string;
  requests_per_period?: number;
  enabled?: boolean;
};

export async function listWafRules(siteId: string) {
  try {
    const { data } = await api.get<{
      zone_id: string;
      zone_name: string;
      ruleset_id: string | null;
      rate_limit_ruleset_id?: string | null;
      limit: number;
      rate_limit_limit?: number;
      count: number;
      rate_limit_count?: number;
      allowlist_configured?: boolean;
      starter_applied?: boolean;
      starter_available?: boolean;
      starter_installed_count?: number;
      starter_total?: number;
      rules: CloudflareWafRule[];
      rate_limit_rules?: CloudflareWafRule[];
    }>(`/sites/${siteId}/cloudflare/waf/rules`);
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to load WAF rules"));
  }
}

export async function createWafRule(siteId: string, input: WafRuleInput) {
  try {
    const { data } = await api.post<{ rule: CloudflareWafRule }>(
      `/sites/${siteId}/cloudflare/waf/rules`,
      input
    );
    return data.rule;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to create WAF rule"));
  }
}

export async function updateWafRule(
  siteId: string,
  ruleId: string,
  input: Partial<WafRuleInput> & { enabled?: boolean }
) {
  try {
    const { data } = await api.patch<{ rule: CloudflareWafRule }>(
      `/sites/${siteId}/cloudflare/waf/rules/${ruleId}`,
      input
    );
    return data.rule;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to update WAF rule"));
  }
}

export async function reorderWafRules(siteId: string, ruleIds: string[]) {
  try {
    const { data } = await api.put<{
      rules: CloudflareWafRule[];
      rate_limit_rules?: CloudflareWafRule[];
      count: number;
      rate_limit_count?: number;
      starter_applied?: boolean;
      starter_installed_count?: number;
      starter_total?: number;
    }>(`/sites/${siteId}/cloudflare/waf/rules/order`, { rule_ids: ruleIds });
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to reorder WAF rules"));
  }
}

export async function deleteWafRule(siteId: string, ruleId: string) {
  try {
    const { data } = await api.delete<{ success: boolean; id: string }>(
      `/sites/${siteId}/cloudflare/waf/rules/${ruleId}`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to delete WAF rule"));
  }
}

export async function createRateLimitRule(siteId: string, input: RateLimitInput) {
  try {
    const { data } = await api.post<{ rule: CloudflareWafRule }>(
      `/sites/${siteId}/cloudflare/waf/rate-limit`,
      input
    );
    return data.rule;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to create rate limit rule"));
  }
}

export async function deleteRateLimitRule(siteId: string, ruleId: string) {
  try {
    const { data } = await api.delete<{ success: boolean; id: string }>(
      `/sites/${siteId}/cloudflare/waf/rate-limit/${ruleId}`
    );
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to delete rate limit rule"));
  }
}

export async function applyWafStarterPack(siteId: string, force = false) {
  try {
    const { data } = await api.post<{
      skipped: boolean;
      reason?: string;
      created?: number;
      errors?: string[];
    }>(`/sites/${siteId}/cloudflare/waf/starter`, { force });
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to apply starter pack"));
  }
}

export async function getWafTemplates(siteId: string) {
  try {
    const { data } = await api.get<{
      custom: Array<{
        key: string;
        description: string;
        action: string;
        expression: string;
        summary?: string;
      }>;
      rate_limit: {
        key: string;
        description: string;
        action: string;
        expression: string;
        period: number;
        requests_per_period: number;
        summary?: string;
      };
      slots_used: number;
      slots_left_for_agency: number;
    }>(`/sites/${siteId}/cloudflare/waf/templates`);
    return data;
  } catch (err) {
    throw new Error(errMessage(err, "Failed to load WAF templates"));
  }
}
