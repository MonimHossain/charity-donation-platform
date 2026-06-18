"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Globe,
  Mail,
  CreditCard,
  Shield,
  Database,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { AdminChangePasswordForm } from "@/components/admin/AdminChangePasswordForm";

interface SettingsData {
  general: {
    siteName: string;
    siteDescription: string;
    logoUrl: string;
    faviconUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    linkedin: string;
  };
  email: {
    donationConfirmation: boolean;
    recurringReminders: boolean;
    campaignUpdates: boolean;
    newsletterDigest: boolean;
    adminAlerts: boolean;
    senderName: string;
    senderEmail: string;
  };
  payment: {
    enabledProviders: string[];
    stripePublicKey: string;
    paypalClientId: string;
    paytabsClientKey: string;
    currency: string;
    minimumDonation: number;
  };
  security: {
    passwordMinLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    sessionTimeout: number;
    twoFactorEnabled: boolean;
  };
}

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

const defaultSettings: SettingsData = {
  general: { siteName: "", siteDescription: "", logoUrl: "", faviconUrl: "" },
  contact: { email: "", phone: "", address: "" },
  social: { facebook: "", twitter: "", instagram: "", youtube: "", linkedin: "" },
  email: {
    donationConfirmation: true,
    recurringReminders: true,
    campaignUpdates: false,
    newsletterDigest: false,
    adminAlerts: true,
    senderName: "",
    senderEmail: "",
  },
  payment: {
    enabledProviders: ["stripe"],
    stripePublicKey: "",
    paypalClientId: "",
    paytabsClientKey: "",
    currency: "GBP",
    minimumDonation: 1,
  },
  security: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    sessionTimeout: 30,
    twoFactorEnabled: false,
  },
};

type Tab = "general" | "email" | "payment" | "security" | "backup";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, backupsRes] = await Promise.all([
          api.get("/cms/settings").catch(() => ({ data: {} })),
          Promise.resolve({ data: [] }),
        ]);
        if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
          setSettings((prev) => ({
            general: { ...prev.general, ...settingsRes.data.general },
            contact: { ...prev.contact, ...settingsRes.data.contact },
            social: { ...prev.social, ...settingsRes.data.social },
            email: { ...prev.email, ...settingsRes.data.email },
            payment: { ...prev.payment, ...settingsRes.data.payment },
            security: { ...prev.security, ...settingsRes.data.security },
          }));
        }
        setBackups(backupsRes.data?.items || backupsRes.data || []);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/admin/cms/settings", {
        siteName: settings.general.siteName,
        siteDescription: settings.general.siteDescription,
        logoUrl: settings.general.logoUrl,
        faviconUrl: settings.general.faviconUrl,
        contactEmail: settings.contact.email,
        contactPhone: settings.contact.phone,
        address: settings.contact.address,
        socialLinks: settings.social,
        payment: settings.payment,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      toast.error("Backup functionality is not available");
      return;
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setBackingUp(false);
    }
  }

  function updateGeneral(field: keyof SettingsData["general"], value: string) {
    setSettings((s) => ({ ...s, general: { ...s.general, [field]: value } }));
  }
  function updateContact(field: keyof SettingsData["contact"], value: string) {
    setSettings((s) => ({ ...s, contact: { ...s.contact, [field]: value } }));
  }
  function updateSocial(field: keyof SettingsData["social"], value: string) {
    setSettings((s) => ({ ...s, social: { ...s.social, [field]: value } }));
  }
  function updateEmail(field: keyof SettingsData["email"], value: boolean | string) {
    setSettings((s) => ({ ...s, email: { ...s.email, [field]: value } }));
  }
  function updatePayment(field: keyof SettingsData["payment"], value: string | number | string[]) {
    setSettings((s) => ({ ...s, payment: { ...s.payment, [field]: value } }));
  }

  const PAYMENT_PROVIDERS = [
    { id: "stripe", label: "Stripe" },
    { id: "paypal", label: "PayPal" },
    { id: "telr", label: "Telr" },
    { id: "paytabs", label: "PayTabs" },
  ] as const;

  function toggleProvider(id: string) {
    setSettings((s) => {
      const current = s.payment.enabledProviders || [];
      const next = current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id];
      return { ...s, payment: { ...s.payment, enabledProviders: next.length ? next : ["stripe"] } };
    });
  }
  function updateSecurity(field: keyof SettingsData["security"], value: boolean | number) {
    setSettings((s) => ({ ...s, security: { ...s.security, [field]: value } }));
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General", icon: Globe },
    { key: "email", label: "Email", icon: Mail },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "security", label: "Security", icon: Shield },
    { key: "backup", label: "Backup", icon: Database },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your platform settings</p>
        </div>
        {tab !== "backup" && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold">General Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input value={settings.general.siteName} onChange={(e) => updateGeneral("siteName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={settings.general.logoUrl} onChange={(e) => updateGeneral("logoUrl", e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site Description</Label>
              <textarea rows={3} value={settings.general.siteDescription} onChange={(e) => updateGeneral("siteDescription", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input value={settings.general.faviconUrl} onChange={(e) => updateGeneral("faviconUrl", e.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={settings.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={settings.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={settings.contact.address} onChange={(e) => updateContact("address", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold">Social Media</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(settings.social) as Array<keyof SettingsData["social"]>).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key}</Label>
                  <Input value={settings.social[key]} onChange={(e) => updateSocial(key, e.target.value)} placeholder={`https://${key}.com/...`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "email" && (
        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-6">
          <h2 className="text-lg font-serif font-bold">Email Notification Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input value={settings.email.senderName} onChange={(e) => updateEmail("senderName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input value={settings.email.senderEmail} onChange={(e) => updateEmail("senderEmail", e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Notification Types</h3>
            {[
              { key: "donationConfirmation" as const, label: "Donation Confirmation Emails" },
              { key: "recurringReminders" as const, label: "Recurring Donation Reminders" },
              { key: "campaignUpdates" as const, label: "Campaign Update Notifications" },
              { key: "newsletterDigest" as const, label: "Newsletter Digest" },
              { key: "adminAlerts" as const, label: "Admin Alert Emails" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email[item.key] as boolean}
                  onChange={(e) => updateEmail(item.key, e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "payment" && (
        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-6">
          <h2 className="text-lg font-serif font-bold">Payment Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Enable gateways for checkout. API secrets are configured in server environment variables only.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_PROVIDERS.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  settings.payment.enabledProviders?.includes(p.id)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <input
                  type="checkbox"
                  checked={settings.payment.enabledProviders?.includes(p.id) ?? false}
                  onChange={() => toggleProvider(p.id)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="font-medium text-sm">{p.label}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Stripe Publishable Key (optional override)</Label>
              <Input value={settings.payment.stripePublicKey} onChange={(e) => updatePayment("stripePublicKey", e.target.value)} placeholder="pk_..." />
            </div>
            <div className="space-y-2">
              <Label>PayPal Client ID (public)</Label>
              <Input value={settings.payment.paypalClientId} onChange={(e) => updatePayment("paypalClientId", e.target.value)} placeholder="Client ID from PayPal dashboard" />
            </div>
            <div className="space-y-2">
              <Label>PayTabs Client Key (public)</Label>
              <Input value={settings.payment.paytabsClientKey} onChange={(e) => updatePayment("paytabsClientKey", e.target.value)} placeholder="Optional public client key" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <select value={settings.payment.currency} onChange={(e) => updatePayment("currency", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Minimum Donation</Label>
              <Input type="number" value={settings.payment.minimumDonation} onChange={(e) => updatePayment("minimumDonation", Number(e.target.value))} min={1} />
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-lg font-serif font-bold">Change password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your admin account password. You will stay signed in after saving.
              </p>
            </div>
            <AdminChangePasswordForm />
          </div>

          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-6">
            <h2 className="text-lg font-serif font-bold">Security Settings</h2>
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Password Policy</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Minimum Password Length</Label>
                <Input type="number" value={settings.security.passwordMinLength} onChange={(e) => updateSecurity("passwordMinLength", Number(e.target.value))} min={6} max={32} />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input type="number" value={settings.security.sessionTimeout} onChange={(e) => updateSecurity("sessionTimeout", Number(e.target.value))} min={5} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: "requireUppercase" as const, label: "Require uppercase letter in passwords" },
                { key: "requireNumbers" as const, label: "Require number in passwords" },
                { key: "twoFactorEnabled" as const, label: "Enable two-factor authentication" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security[item.key] as boolean}
                    onChange={(e) => updateSecurity(item.key, e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold">Backup &amp; Recovery</h2>
              <Button onClick={handleBackup} disabled={backingUp}>
                {backingUp ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Database className="h-4 w-4" /> Create Backup</>}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Create a manual backup of your database and media files.</p>
          </div>

          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="p-5">
              <h2 className="text-lg font-serif font-bold">Backup History</h2>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Filename</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Size</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length > 0 ? backups.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium font-mono text-xs">{b.filename}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {b.size ? `${(b.size / (1024 * 1024)).toFixed(1)} MB` : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No backups yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
