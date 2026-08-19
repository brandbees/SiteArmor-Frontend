import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { BrandingInit } from "@/components/BrandingInit";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <BrandingInit />
        {children}
        <Toaster
          position="top-center"
          richColors
          expand={false}
          duration={4500}
          toastOptions={{
            style: {
              fontFamily: "inherit",
              fontSize: "13px",
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            },
          }}
        />
      </body>
    </html>
  );
}
