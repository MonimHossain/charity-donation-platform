"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Globe, Shield, Mail, Loader2 } from "lucide-react";
import { fetchSiteSettings, adminUpdateSiteSettings } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSiteSettings();
        setSettings(data);
      } catch {
        toast.error("Failed to load settings");
        setSettings({
          siteName: "",
          siteDescription: "",
          charityRegNumber: "",
          contactEmail: "",
          contactPhone: "",
          donationPolicy: "",
          socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "" },
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminUpdateSiteSettings(settings);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  const socialLinks = settings.socialLinks || {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Site Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your platform settings and preferences</p>
        </div>
        <Button onClick={handleSave} className="rounded-full" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </span>
          )}
        </Button>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> General</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Site Name</Label>
            <Input value={settings.siteName || ""} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Charity Registration Number</Label>
            <Input value={settings.charityRegNumber || ""} onChange={(e) => setSettings({ ...settings, charityRegNumber: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Site Description</Label>
          <textarea
            rows={3}
            value={settings.siteDescription || ""}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Contact Email</Label>
            <Input value={settings.contactEmail || ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={settings.contactPhone || ""} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Social Links</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(socialLinks).map(([key, value]) => (
            <div key={key}>
              <Label className="capitalize">{key}</Label>
              <Input
                value={(value as string) || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...socialLinks, [key]: e.target.value },
                  })
                }
                className="mt-1"
                placeholder={`https://${key}.com/...`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Donation Policy</h2>
        <textarea
          rows={4}
          value={settings.donationPolicy || ""}
          onChange={(e) => setSettings({ ...settings, donationPolicy: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
