import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { themeInitScript } from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "Restik Notes",
  description: "A personal, recursive knowledge tree for your engineering exam notes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Restik Notes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0c" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning>
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
