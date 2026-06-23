"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Heart } from "lucide-react";

export default function CampaignDonationEmbedNodeView({ node, selected }: NodeViewProps) {
  const slug = String(node.attrs.slug || "");
  const title = String(node.attrs.title || slug || "Campaign");

  return (
    <NodeViewWrapper className="my-4">
      <div
        className={`rounded-xl border-2 border-dashed bg-purple-50/80 px-4 py-5 text-center transition-colors ${
          selected ? "border-purple-500" : "border-purple-200"
        }`}
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
          <Heart className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-purple-900">Campaign donation block</p>
        <p className="mt-1 text-sm text-purple-700">{title}</p>
        {slug ? (
          <p className="mt-2 text-xs text-purple-500 font-mono">/{slug}</p>
        ) : (
          <p className="mt-2 text-xs text-red-600">Missing campaign slug</p>
        )}
        <p className="mt-3 text-[11px] text-purple-600">
          Donors will see this campaign&apos;s donation options here on the published article.
        </p>
      </div>
    </NodeViewWrapper>
  );
}
