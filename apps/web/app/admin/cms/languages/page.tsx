"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface TranslationEntry {
  id: string;
  key: string;
  originalText: string;
  translatedText: string;
}

const languages = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "ur", name: "Urdu" },
  { code: "tr", name: "Turkish" },
  { code: "so", name: "Somali" },
];

const entityTypes = [
  { value: "campaigns", label: "Campaigns" },
  { value: "blog", label: "Blog Posts" },
  { value: "pages", label: "Pages" },
  { value: "menus", label: "Menus" },
  { value: "faqs", label: "FAQs" },
];

export default function LanguagesPage() {
  const [selectedLang, setSelectedLang] = useState("ar");
  const [selectedEntity, setSelectedEntity] = useState("campaigns");
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({});

  async function loadTranslations() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/cms/translations", {
        params: { language: selectedLang, entityType: selectedEntity },
      });
      const items = data.items || data || [];
      setTranslations(Array.isArray(items) ? items : []);
      const edits: Record<string, string> = {};
      items.forEach((t: TranslationEntry) => {
        edits[t.id] = t.translatedText || "";
      });
      setEditedTranslations(edits);
    } catch {
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTranslations();
  }, [selectedLang, selectedEntity]);

  function updateTranslation(id: string, value: string) {
    setEditedTranslations((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(editedTranslations).map(([id, translatedText]) => ({
        id,
        translatedText,
      }));
      await api.put("/admin/cms/translations", {
        language: selectedLang,
        entityType: selectedEntity,
        translations: updates,
      });
      toast.success("Translations saved");
    } catch {
      toast.error("Failed to save translations");
    } finally {
      setSaving(false);
    }
  }

  const selectedLangName = languages.find((l) => l.code === selectedLang)?.name || selectedLang;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Languages &amp; Translations</h1>
          <p className="text-muted-foreground mt-1">Manage multi-language content for your site</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Translations</>}
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Target Language</Label>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            {languages.filter((l) => l.code !== "en").map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedLang === lang.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Content Type</Label>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            {entityTypes.map((et) => (
              <button
                key={et.value}
                onClick={() => setSelectedEntity(et.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedEntity === et.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="grid grid-cols-2 gap-0 px-5 py-3 bg-muted/40 border-b">
          <div className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" /> English (Original)
          </div>
          <div className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <ChevronRight className="h-4 w-4" /> {selectedLangName} (Translation)
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading translations...
            </div>
          </div>
        ) : translations.length > 0 ? (
          <div className="divide-y">
            {translations.map((t) => (
              <div key={t.id} className="grid grid-cols-2 gap-4 px-5 py-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">{t.key}</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{t.originalText}</p>
                </div>
                <div>
                  <textarea
                    rows={Math.max(2, Math.ceil(t.originalText.length / 60))}
                    value={editedTranslations[t.id] || ""}
                    onChange={(e) => updateTranslation(t.id, e.target.value)}
                    placeholder={`Translate to ${selectedLangName}...`}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    dir={selectedLang === "ar" || selectedLang === "ur" ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No translatable content found for {selectedLangName} / {entityTypes.find((e) => e.value === selectedEntity)?.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}
