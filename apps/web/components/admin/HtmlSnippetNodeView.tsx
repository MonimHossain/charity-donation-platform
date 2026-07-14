"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Braces } from "lucide-react";

export default function HtmlSnippetNodeView({ node, selected }: NodeViewProps) {
  const label = String(node.attrs.label || "HTML snippet");
  const html = String(node.attrs.html || "");
  const approxKb = Math.max(1, Math.round(new TextEncoder().encode(html).length / 1024));

  return (
    <NodeViewWrapper className="my-4">
      <div
        className={`rounded-xl border-2 border-dashed bg-slate-50 px-4 py-5 text-center transition-colors ${
          selected ? "border-purple-500" : "border-slate-300"
        }`}
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
          <Braces className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-900">HTML / code snippet</p>
        <p className="mt-1 text-sm text-slate-700">{label}</p>
        <p className="mt-2 text-xs text-slate-500">
          {html.trim() ? `~${approxKb} KB · interactive on the public page` : "Empty snippet"}
        </p>
        <p className="mt-3 text-[11px] text-slate-500">
          Paste HTML (and script) via the toolbar. Donors see it as an embedded widget.
        </p>
      </div>
    </NodeViewWrapper>
  );
}
