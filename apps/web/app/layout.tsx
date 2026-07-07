import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";
import GTMScript from "@/components/analytics/GTMScript";
import GTMPageView from "@/components/analytics/GTMPageView";
import { getServerGtmId, getServerSiteMetadata } from "@/lib/server/cms";
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

function siteBrandLabel(siteName: string): string {
  const first = siteName.split("|")[0]?.trim();
  return first || siteName;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getServerSiteMetadata();
  const title = site.siteName;
  const description = site.siteDescription;
  const brand = siteBrandLabel(title);
  const favicon = site.faviconUrl || "/images/favicon.png";
  const ogImage = site.logoUrl || "/images/hero-1.webp";

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      type: "website",
      siteName: brand,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: brand }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
