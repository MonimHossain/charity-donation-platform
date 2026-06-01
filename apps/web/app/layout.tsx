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

export const metadata: Metadata = {
  title: {
    default: "Charity Donation Platform — Making a Difference Together",
    template: "%s | Charity Donation Platform",
  },
  description:
    "A trusted charity platform delivering food, water, education and emergency aid to communities worldwide. 100% donation policy on Zakat.",
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
