export function parseSiteUrl(
  raw: string
): { ok: true; url: string; name: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter your WordPress site URL." };

  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProto);
    if (!parsed.hostname.includes(".")) {
      return { ok: false, error: "Enter a full site URL, like https://www.example.com" };
    }
    const path = parsed.pathname.replace(/\/+$/, "");
    const url = `${parsed.protocol}//${parsed.host}${path}`;
    const name = parsed.hostname.replace(/^www\./i, "");
    return { ok: true, url, name };
  } catch {
    return { ok: false, error: "Enter a valid URL, like https://www.example.com" };
  }
}
