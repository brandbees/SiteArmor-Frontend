"use client";

import Script from "next/script";

/** GA4 measurement ID for sitearmor.io marketing (override via env if needed). */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-JQSCSHN73F";

export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
