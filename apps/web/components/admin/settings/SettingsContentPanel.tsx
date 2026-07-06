"use client";

import { useState } from "react";
import { ImageIcon, Calculator, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import HeroSlidesPage from "@/app/admin/cms/hero/page";
import ZakatPage from "@/app/admin/cms/zakat/page";
import MediaPage from "@/app/admin/cms/media/page";
import SeoPage from "@/app/admin/cms/seo/page";

const CONTENT_TABS = [
  { key: "hero", label: "Hero", icon: ImageIcon },
  { key: "zakat", label: "Zakat", icon: Calculator },
  { key: "media", label: "Media", icon: Image },
] as const;

type ContentTab = (typeof CONTENT_TABS)[number]["key"];

export function SettingsContentPanel({ initialSubTab }: { initialSubTab?: string }) {
  const valid = CONTENT_TABS.some((t) => t.key === initialSubTab);
  const [subTab, setSubTab] = useState<ContentTab>(valid ? (initialSubTab as ContentTab) : "hero");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit overflow-x-auto">
        {CONTENT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              subTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-card shadow-soft p-4 sm:p-6">
        {subTab === "hero" && <HeroSlidesPage />}
        {subTab === "zakat" && <ZakatPage />}
        {subTab === "media" && <MediaPage />}
      </div>
    </div>
  );
}

export function SettingsSeoPanel() {
  return (
    <div className="rounded-2xl border bg-card shadow-soft p-4 sm:p-6">
      <SeoPage />
    </div>
  );
}
