import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";
import GTMScript from "@/components/analytics/GTMScript";
import GTMPageView from "@/components/analytics/GTMPageView";
import { getServerGtmId } from "@/lib/server/cms";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Charity Donation Platform — Making a Difference Together",
    template: "%s | Charity Donation Platform",
  },
  description:
    "A trusted charity platform delivering food, water, education and emergency aid to communities worldwide. 100% donation policy on Zakat.",
  openGraph: {
    type: "website",
    siteName: "Charity Donation Platform",
    title: "Charity Donation Platform — Making a Difference Together",
    description:
      "A trusted charity platform delivering food, water, education and emergency aid to communities worldwide. 100% donation policy on Zakat.",
    images: [{ url: "/images/hero-1.webp", width: 1200, height: 630, alt: "Charity Donation Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Charity Donation Platform — Making a Difference Together",
    description:
      "A trusted charity platform delivering food, water, education and emergency aid to communities worldwide.",
    images: ["/images/hero-1.webp"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = await getServerGtmId();

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased`}
        suppressHydrationWarning
      >
        <GTMScript gtmId={gtmId} />
        <Suspense fallback={null}>
          <GTMPageView />
        </Suspense>
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
