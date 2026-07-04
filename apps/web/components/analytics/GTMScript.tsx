"use client";

import Script from "next/script";

interface GTMScriptProps {
  gtmId?: string;
}

const SGTM_HOST = (
  process.env.NEXT_PUBLIC_SGTM_HOST?.trim() ||
  (process.env.NODE_ENV === "production" ? "assets.yourimpactdev.com" : "")
).replace(/\/+$/, "");

function buildGtmLoader(gtmId: string): string {
  if (SGTM_HOST) {
    return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s);j.async=true;
j.src='https://${SGTM_HOST}/moondance';
f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
  }

  return `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
}

function buildGtmNoScriptSrc(gtmId: string): string {
  if (SGTM_HOST) {
    return `https://${SGTM_HOST}/moondance-ns?id=${gtmId}`;
  }
  return `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
}

export default function GTMScript({ gtmId }: GTMScriptProps) {
  if (!gtmId) return null;

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: buildGtmLoader(gtmId),
        }}
      />
      <noscript>
        <iframe
          src={buildGtmNoScriptSrc(gtmId)}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event, ...data });
  }
}
