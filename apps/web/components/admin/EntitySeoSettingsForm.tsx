"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FilePicker } from "@/components/ui/file-picker";
import type { EntitySeoSettings } from "@repo/shared-types";

export type EntitySeoFallbacks = {
  title?: string;
  description?: string;
  excerpt?: string;
  image?: string;
};

type EntitySeoSettingsFormProps = {
  value: EntitySeoSettings;
  onChange: (next: EntitySeoSettings) => void;
  fallbacks?: EntitySeoFallbacks;
  /** Subtitle under "SEO Settings" heading */
  description?: string;
};

function charCount(text: string | undefined): number {
  return (text || "").length;
}

export function EntitySeoSettingsForm({
  value,
  onChange,
  fallbacks = {},
  description = "Custom metadata for this page. Empty fields fall back to title, description, and featured image.",
}: EntitySeoSettingsFormProps) {
  const patch = (partial: Partial<EntitySeoSettings>) => onChange({ ...value, ...partial });

  const metaTitle = value.metaTitle ?? "";
  const metaDescription = value.metaDescription ?? "";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif font-semibold text-lg">SEO Settings</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input
            value={metaTitle}
            onChange={(e) => patch({ metaTitle: e.target.value })}
            placeholder={fallbacks.title || "Page title"}
          />
          <p className="text-[11px] text-muted-foreground">
            {charCount(metaTitle)} chars · Recommended 60–70.
          </p>
        </div>
        <div className="space-y-2">
          <Label>SEO Featured Image URL</Label>
          <FilePicker
            value={value.seoFeaturedImage || ""}
            onChange={(url) => patch({ seoFeaturedImage: url })}
            accept="image"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Meta Description</Label>
        <textarea
          rows={3}
          value={metaDescription}
          onChange={(e) => patch({ metaDescription: e.target.value })}
          placeholder={fallbacks.description || "Description for search engines"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          {charCount(metaDescription)} chars · Recommended 150–170.
        </p>
      </div>

      <div className="space-y-2">
        <Label>SEO Excerpt / Short SEO Summary</Label>
        <textarea
          rows={2}
          value={value.seoExcerpt || ""}
          onChange={(e) => patch({ seoExcerpt: e.target.value })}
          placeholder={fallbacks.excerpt || "Short summary for sharing"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <Label>SEO Tags</Label>
        <SeoTagsInput
          tags={value.seoTags || []}
          onChange={(seoTags) => patch({ seoTags })}
        />
      </div>

      <div className="space-y-2">
        <Label>Canonical URL</Label>
        <Input
          value={value.canonicalUrl || ""}
          onChange={(e) => patch({ canonicalUrl: e.target.value })}
          placeholder="https://example.com/page"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Robots Index</Label>
          <select
            value={value.robotsIndex || "index"}
            onChange={(e) => patch({ robotsIndex: e.target.value as "index" | "noindex" })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="index">index</option>
            <option value="noindex">noindex</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Robots Follow</Label>
          <select
            value={value.robotsFollow || "follow"}
            onChange={(e) => patch({ robotsFollow: e.target.value as "follow" | "nofollow" })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="follow">follow</option>
            <option value="nofollow">nofollow</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Graph</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Open Graph Title</Label>
            <Input
              value={value.ogTitle || ""}
              onChange={(e) => patch({ ogTitle: e.target.value })}
              placeholder={metaTitle || fallbacks.title}
            />
          </div>
          <div className="space-y-2">
            <Label>Open Graph Image</Label>
            <FilePicker
              value={value.ogImage || ""}
              onChange={(url) => patch({ ogImage: url })}
              accept="image"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Open Graph Description</Label>
          <textarea
            rows={2}
            value={value.ogDescription || ""}
            onChange={(e) => patch({ ogDescription: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Twitter</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Twitter Title</Label>
            <Input
              value={value.twitterTitle || ""}
              onChange={(e) => patch({ twitterTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter Image</Label>
            <FilePicker
              value={value.twitterImage || ""}
              onChange={(url) => patch({ twitterImage: url })}
              accept="image"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Twitter Description</Label>
          <textarea
            rows={2}
            value={value.twitterDescription || ""}
            onChange={(e) => patch({ twitterDescription: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schema</p>
        <div className="space-y-2">
          <Label>Schema Type</Label>
          <Input
            value={value.schemaType || ""}
            onChange={(e) => patch({ schemaType: e.target.value })}
            placeholder="Article"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Schema JSON</Label>
          <textarea
            rows={4}
            value={value.customSchemaJson || ""}
            onChange={(e) => patch({ customSchemaJson: e.target.value })}
            placeholder='{"@type": "Article"}'
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function SeoTagsInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add SEO tag"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="h-9 shrink-0 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== tag))}
              className="rounded-full border bg-muted px-3 py-1 text-xs font-medium hover:bg-destructive/10"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}