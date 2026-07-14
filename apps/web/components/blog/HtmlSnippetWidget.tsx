"use client";

import { useEffect, useId, useMemo, useState } from "react";

interface HtmlSnippetWidgetProps {
  html: string;
  label?: string;
  /** Fallback height before content reports its size. */
  minHeight?: number;
}

function buildSrcDoc(html: string, messageId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base target="_blank" rel="noopener noreferrer" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    body { overflow-x: hidden; }
  </style>
</head>
<body>
${html}
<script>
(function () {
  var messageId = ${JSON.stringify(messageId)};
  function reportHeight() {
    var height = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body ? document.body.scrollHeight : 0,
      320
    );
    parent.postMessage({ type: "html-snippet-height", id: messageId, height: height }, "*");
  }
  window.addEventListener("load", reportHeight);
  window.addEventListener("resize", reportHeight);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(reportHeight).observe(document.documentElement);
  }
  setTimeout(reportHeight, 50);
  setTimeout(reportHeight, 300);
  setTimeout(reportHeight, 1000);
})();
</script>
</body>
</html>`;
}

export function HtmlSnippetWidget({
  html,
  label = "Embedded content",
  minHeight = 480,
}: HtmlSnippetWidgetProps) {
  const reactId = useId();
  const messageId = `snippet-${reactId.replace(/:/g, "")}`;
  const [height, setHeight] = useState(minHeight);
  const srcDoc = useMemo(() => buildSrcDoc(html, messageId), [html, messageId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; id?: string; height?: number } | null;
      if (!data || data.type !== "html-snippet-height" || data.id !== messageId) return;
      const next = Number(data.height);
      if (Number.isFinite(next) && next > 0) {
        setHeight(Math.min(Math.max(next, minHeight), 4000));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [messageId, minHeight]);

  useEffect(() => {
    setHeight(minHeight);
  }, [html, minHeight]);

  if (!html.trim()) return null;

  return (
    <div className="my-8 w-full overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
      <iframe
        title={label}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        className="w-full border-0"
        style={{ height, minHeight }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
