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
