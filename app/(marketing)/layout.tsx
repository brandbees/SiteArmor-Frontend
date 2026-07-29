import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { getGlobalContent } from "@/lib/cms";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { OfferPopup } from "@/components/landing/OfferPopup";
import { ScrollToTop } from "@/components/marketing/ScrollToTop";

const marketingSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-marketing",
  display: "swap",
});

const marketingDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-marketing-display",
  display: "swap",
});

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalContent = await getGlobalContent();
  const popupEnabled = "popup" in globalContent;
  const popupData = globalContent.popup ?? {};
  const headerCms = globalContent.header ?? {};
  const footerCms = globalContent.footer ?? {};
  const branding = globalContent.branding ?? {};

  const bp = branding.primary_color;
  const ba = branding.accent_color;
  const dark = branding.dark_mode === "true";

  const hasBrandOverride = !!(bp && ba);

  const brandCss = hasBrandOverride
    ? `:root {
  --accent: ${bp};
  --accent-deep: color-mix(in srgb, ${bp} 55%, black);
  --gradient-brand: linear-gradient(135deg, color-mix(in srgb, ${bp} 85%, white) 0%, ${bp} 45%, color-mix(in srgb, ${bp} 55%, black) 100%);
  --ring: ${bp};
  --mkt-secondary: ${ba};
}
html.mkt-dark, html.dark {
  --mkt-wash: color-mix(in srgb, ${bp} 18%, #0b1220);
}`
    : "";

  const m = bp ? /^#?([0-9a-f]{6})$/i.exec(bp.trim()) : null;
  const rgbCss = m
    ? (() => {
        const n = parseInt(m[1], 16);
        return `--accent-rgb: ${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255};`;
      })()
    : "";

  return (
    <div
      className={`marketing-root ${marketingSans.variable} ${marketingDisplay.variable} ${marketingSans.className}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `${brandCss}\n:root { ${rgbCss} }`,
        }}
      />
      <MarketingNav cms={headerCms} initialDark={dark} />
      {children}
      <MarketingFooter cms={footerCms} />
      <OfferPopup enabled={popupEnabled} data={popupData} />
      <ScrollToTop />
    </div>
  );
}
