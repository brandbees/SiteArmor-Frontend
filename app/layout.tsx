import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { BrandingInit } from "@/components/BrandingInit";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrandBees SnapshotAI",
  description: "Agency site monitoring and reporting dashboard",
  icons: {
    icon: [{ url: "/Brandbees-sas-x512.png", type: "image/png" }],
    shortcut: "/Brandbees-sas-x512.png",
    apple: [{ url: "/Brandbees-sas-x512.png", sizes: "512x512" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
