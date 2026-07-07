"use client";

import HeroSlidesPage from "@/app/admin/cms/hero/page";
import ZakatPage from "@/app/admin/cms/zakat/page";
import SeoPage from "@/app/admin/cms/seo/page";

export function SettingsHeroPanel() {
  return (
    <div className="rounded-2xl border bg-card shadow-soft p-4 sm:p-6">
      <HeroSlidesPage />
    </div>
  );
}

export function SettingsZakatPanel() {
  return (
    <div className="rounded-2xl border bg-card shadow-soft p-4 sm:p-6">
      <ZakatPage />
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
