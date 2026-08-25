import { API_BASE_URL } from "@/lib/constants";

/** Canonical download filename for the Site Armor WordPress plugin. */
export const PLUGIN_ZIP_NAME = "sitearmor.zip";

/**
 * Download the WP plugin zip with a forced filename.
 * Direct <a download> is ignored for cross-origin API URLs, so the browser
 * would keep whatever Content-Disposition the server (or an old deploy) sends.
 * Fetching as a blob and saving locally always applies PLUGIN_ZIP_NAME.
 */
export async function downloadPluginZip(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/plugin/download`);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = PLUGIN_ZIP_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
