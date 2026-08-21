import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { BrandingInit } from "@/components/BrandingInit";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const portalDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-portal-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Site Armor",
  description: "Agency site monitoring and reporting dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("landingDark");var d=s!==null?s==="true":true;if(d){document.documentElement.classList.add("dark","mkt-dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} ${portalDisplay.variable}`}>
        <BrandingInit />
        {children}
        <Toaster
          position="top-center"
          richColors={false}
          expand={false}
          duration={4000}
          toastOptions={{
            className: "portal-toast",
            style: {
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "8px",
              border: "1px solid rgb(15 23 42 / 0.08)",
              boxShadow: "0 0 0 1px rgb(15 23 42 / 0.06), 0 8px 24px -8px rgb(15 23 42 / 0.16)",
              padding: "12px 14px",
            },
          }}
        />
      </body>
    </html>
  );
}
