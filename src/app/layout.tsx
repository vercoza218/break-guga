import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Gugaopkmn - Break ao Vivo",
  description: "Breaks de Pokemon TCG ao vivo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gugaopkmn",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen">
        <Suspense>
          <AppShell>{children}</AppShell>
        </Suspense>
        <PWARegister />
      </body>
    </html>
  );
}
