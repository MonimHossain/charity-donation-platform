"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Calculator, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  fetchAdminZakatPageContent,
  updateZakatPageContent,
  type ZakatPageContent,
} from "@/lib/api";

const emptyCard = { title: "", description: "" };

export default function AdminZakatPage() {
  const [form, setForm] = useState<ZakatPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminZakatPageContent()
      .then(setForm)
      .catch(() => toast.error("Failed to load Zakat page content"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(publish: boolean) {
    if (!form) return;
    setSaving(true);
    try {
      const updated = await updateZakatPageContent({
        ...form,
        status: publish ? "published" : "draft",
      });
      setForm(updated);
      toast.success(publish ? "Zakat page published" : "Draft saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateCard(index: number, field: "title" | "description", value: string) {
    if (!form) return;
    const cards = [...form.featureCards];
    cards[index] = { ...cards[index], [field]: value };
    setForm({ ...form, featureCards: cards });
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Zakat page</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit hero and content for the public{" "}
            <Link href="/zakat" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
              /zakat <ExternalLink className="h-3 w-3" />
            </Link>{" "}
            page. SEO metadata is managed under{" "}
            <Link href="/admin/cms/seo" className="text-primary hover:underline">
              CMS → SEO
            </Link>{" "}
            for path <code className="text-xs bg-muted px-1 rounded">/zakat</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => handleSave(false)}>
            Save draft
          </Button>
          <Button disabled={saving} onClick={() => handleSave(true)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-3">
        <Calculator className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          The Zakat calculator (live gold/silver rates, asset fields, and donate button) is fixed on the
          public page and cannot be removed or moved. It always appears beside the feature cards.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="font-medium text-slate-900">Hero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="heroEyebrow">Eyebrow</Label>
            <Input
              id="heroEyebrow"
              className="mt-1"
              value={form.heroEyebrow}
              onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="heroTitle">Title</Label>
            <Input
              id="heroTitle"
              className="mt-1"
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="heroDescription">Short description</Label>
          <Input
            id="heroDescription"
            className="mt-1"
            value={form.heroDescription}
            onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="font-medium text-slate-900">Content above calculator</h2>
        <p className="text-xs text-muted-foreground">
          Intro paragraphs shown full-width below the hero (before the two-column layout).
        </p>
        <RichTextEditor
          value={form.introHtml}
          onChange={(introHtml) => setForm({ ...form, introHtml })}
          placeholder="Opening paragraphs, how to calculate Zakat, nisab explanation…"
        />
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="font-medium text-slate-900">Feature cards (beside calculator)</h2>
        <div>
          <Label htmlFor="featureCardsHeading">Section heading</Label>
          <Input
            id="featureCardsHeading"
            className="mt-1"
            value={form.featureCardsHeading}
            onChange={(e) => setForm({ ...form, featureCardsHeading: e.target.value })}
          />
        </div>
        <Separator />
        {form.featureCards.map((card, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Card {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    featureCards: form.featureCards.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Title"
              value={card.title}
              onChange={(e) => updateCard(index, "title", e.target.value)}
            />
            <Input
              placeholder="Description"
              value={card.description}
              onChange={(e) => updateCard(index, "description", e.target.value)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setForm({ ...form, featureCards: [...form.featureCards, emptyCard] })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add card
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="font-medium text-slate-900">Content below calculator</h2>
        <p className="text-xs text-muted-foreground">
          Long-form guide, FAQs, eligibility, and educational sections after the calculator.
        </p>
        <RichTextEditor
          value={form.contentBelowHtml}
          onChange={(contentBelowHtml) => setForm({ ...form, contentBelowHtml })}
          placeholder="What is Zakat, who receives it, when to pay…"
        />
      </section>

      <section className="rounded-xl border bg-white p-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.showQuote}
            onChange={(e) => setForm({ ...form, showQuote: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show quote section at bottom of page</span>
        </label>
      </section>

      <div className="flex gap-2 pb-8">
        <Button variant="outline" disabled={saving} onClick={() => handleSave(false)}>
          Save draft
        </Button>
        <Button disabled={saving} onClick={() => handleSave(true)}>
          Publish
        </Button>
      </div>
    </div>
  );
}
