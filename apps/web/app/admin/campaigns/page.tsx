"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Save,
  Loader2,
  Star,
  Zap,
  Eye,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilePicker } from "@/components/ui/file-picker";
import { cn } from "@/lib/utils";
import {
  fetchAdminCampaigns,
  adminCreateCampaign,
  adminUpdateCampaign,
  adminDeleteCampaign,
} from "@/lib/api";

// ── Types ──

interface SinglePaymentConfig {
  priceType: "preset" | "custom" | "both";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
}

interface RegularPresetAmount {
  amount: number;
  cause: string;
  defaultDuration?: number;
}

interface RegularPaymentConfig {
  allowedIntervals: string[];
  durationType: "never_ends" | "fixed_duration";
  fixedDurationValue?: number;
  fixedDurationType?: "months" | "payments" | "date";
  endDate?: string;
  presetAmounts: RegularPresetAmount[];
  allowCustomAmount: boolean;
  customMinAmount: number;
  customMaxAmount: number;
}

interface QuantityConfig {
  quantityLabel: string;
  minQuantity: number;
  maxQuantity: number;
}

interface CustomField {
  id: string;
  fieldType: string;
  label: string;
  placeholder: string;
  isRequired: boolean;
  defaultValue: string;
  sortOrder: number;
  options: string[];
  conditionalVisibility?: { dependsOnField: string; dependsOnValue: string };
}

interface CampaignAttribute {
  id: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  enableSinglePayment: boolean;
  enableRegularPayment: boolean;
  enableQuantity: boolean;
  singlePaymentConfig: SinglePaymentConfig;
  regularPaymentConfig: RegularPaymentConfig;
  quantityConfig: QuantityConfig;
  customFields: CustomField[];
}

interface CampaignUpsell {
  id: string;
  label: string;
  amount: number;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

interface FundraiserSettings {
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  showProgressBar: boolean;
  autoCloseAfterDeadline: boolean;
  allowOverfunding: boolean;
}

interface CheckoutSettings {
  allowAnonymous: boolean;
  enableGiftAid: boolean;
  enableDedication: boolean;
  enableComments: boolean;
  enableUpsell: boolean;
  enableFeeCoverage: boolean;
}

interface VisibilitySettings {
  showInHeader: boolean;
  showOnHomepage: boolean;
  pinToTop: boolean;
}

interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

type CampaignMode = "standard" | "fundraiser" | "sponsorship" | "zakat" | "automated";

interface CampaignForm {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail: string;
  banner: string;
  category: string;
  tags: string[];
  status: string;
  isFeatured: boolean;
  isUrgent: boolean;
  campaignMode: CampaignMode;
  currency: string;
  attributes: CampaignAttribute[];
  upsells: CampaignUpsell[];
  fundraiserSettings: FundraiserSettings;
  checkoutSettings: CheckoutSettings;
  visibilitySettings: VisibilitySettings;
  paymentGateways: string[];
  seoSettings: SeoSettings;
}

interface Campaign extends CampaignForm {
  id: string;
  donorCount?: number;
  sortOrder?: number;
  createdAt?: string;
}

// ── Defaults ──

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultSinglePaymentConfig: SinglePaymentConfig = {
  priceType: "both",
  presetAmounts: [10, 25, 50, 100],
  minAmount: 1,
  maxAmount: 10000,
};

const defaultRegularPaymentConfig: RegularPaymentConfig = {
  allowedIntervals: ["monthly"],
  durationType: "never_ends",
  presetAmounts: [],
  allowCustomAmount: true,
  customMinAmount: 5,
  customMaxAmount: 5000,
};

const defaultQuantityConfig: QuantityConfig = {
  quantityLabel: "Quantity",
  minQuantity: 1,
  maxQuantity: 100,
};

function newAttribute(): CampaignAttribute {
  return {
    id: uid(),
    name: "",
    description: "",
    image: "",
    sortOrder: 0,
    enableSinglePayment: true,
    enableRegularPayment: false,
    enableQuantity: false,
    singlePaymentConfig: { ...defaultSinglePaymentConfig, presetAmounts: [10, 25, 50, 100] },
    regularPaymentConfig: { ...defaultRegularPaymentConfig, presetAmounts: [] },
    quantityConfig: { ...defaultQuantityConfig },
    customFields: [],
  };
}

function newCustomField(): CustomField {
  return {
    id: uid(),
    fieldType: "text",
    label: "",
    placeholder: "",
    isRequired: false,
    defaultValue: "",
    sortOrder: 0,
    options: [],
  };
}

function newUpsell(): CampaignUpsell {
  return { id: uid(), label: "", amount: 0, description: "", sortOrder: 0, isActive: true };
}

const defaultForm: CampaignForm = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  thumbnail: "",
  banner: "",
  category: "",
  tags: [],
  status: "draft",
  isFeatured: false,
  isUrgent: false,
  campaignMode: "standard",
  currency: "GBP",
  attributes: [],
  upsells: [],
  fundraiserSettings: {
    targetAmount: 0,
    raisedAmount: 0,
    startDate: "",
    endDate: "",
    showProgressBar: true,
    autoCloseAfterDeadline: false,
    allowOverfunding: true,
  },
  checkoutSettings: {
    allowAnonymous: true,
    enableGiftAid: false,
    enableDedication: false,
    enableComments: false,
    enableUpsell: false,
    enableFeeCoverage: false,
  },
  visibilitySettings: { showInHeader: false, showOnHomepage: false, pinToTop: false },
  paymentGateways: ["stripe"],
  seoSettings: { metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "" },
};

const CAMPAIGN_MODES: { value: CampaignMode; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "Regular donation campaign" },
  { value: "fundraiser", label: "Fundraiser", desc: "Goal-based fundraising with progress bar" },
  { value: "sponsorship", label: "Sponsorship", desc: "Recurring sponsorship programmes" },
  { value: "zakat", label: "Zakat", desc: "Zakat-eligible donations" },
  { value: "automated", label: "Automated", desc: "Automated/scheduled donation splits" },
];

const GATEWAYS = ["stripe", "paypal", "telr", "paytabs"];
const INTERVALS = ["daily", "weekly", "monthly", "yearly"];
const FIELD_TYPES = ["text", "textarea", "dropdown", "radio", "checkbox", "number", "date"];
const CATEGORIES = ["general", "education", "health", "water", "food", "shelter", "orphan", "zakat", "sadaqah", "emergency"];

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

// ── Main Page ──

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await fetchAdminCampaigns();
      setCampaigns(data.items || data || []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  function openCreate() {
    setForm({ ...defaultForm, attributes: [], upsells: [] });
    setEditingId(null);
    setActiveTab("info");
    setShowEditor(true);
  }

  function openEdit(c: Campaign) {
    setForm({
      title: c.title || "",
      slug: c.slug || "",
      shortDescription: c.shortDescription || "",
      fullDescription: c.fullDescription || "",
      thumbnail: c.thumbnail || "",
      banner: c.banner || "",
      category: c.category || "",
      tags: c.tags || [],
      status: c.status || "draft",
      isFeatured: c.isFeatured || false,
      isUrgent: c.isUrgent || false,
      campaignMode: c.campaignMode || "standard",
      currency: c.currency || "GBP",
      attributes: c.attributes || [],
      upsells: c.upsells || [],
      fundraiserSettings: { ...defaultForm.fundraiserSettings, ...(c.fundraiserSettings || {}) },
      checkoutSettings: { ...defaultForm.checkoutSettings, ...(c.checkoutSettings || {}) },
      visibilitySettings: { ...defaultForm.visibilitySettings, ...(c.visibilitySettings || {}) },
      paymentGateways: c.paymentGateways || ["stripe"],
      seoSettings: { ...defaultForm.seoSettings, ...(c.seoSettings || {}) },
    });
    setEditingId(c.id);
    setActiveTab("info");
    setShowEditor(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      setActiveTab("info");
      return;
    }
    setSaving(true);
    try {
      const slug =
        form.slug ||
        form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const payload = { ...form, slug };

      if (editingId) {
        await adminUpdateCampaign(editingId, payload);
        toast.success("Campaign updated");
      } else {
        await adminCreateCampaign(payload);
        toast.success("Campaign created");
      }
      setShowEditor(false);
      setEditingId(null);
      await loadCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    setDeleting(id);
    try {
      await adminDeleteCampaign(id);
      toast.success("Campaign deleted");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleting(null);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const filtered = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
  );

  // ── List View ──

  if (!showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Universal donation campaign management</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card shadow-soft p-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading campaigns...
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Attributes</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Flags</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium truncate max-w-[250px]">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.category} &middot; /{c.slug}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="capitalize">{c.campaignMode || "standard"}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[c.status] || "bg-slate-100 text-slate-600")}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {c.attributes?.length || 0} attribute{(c.attributes?.length || 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {c.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          {c.isUrgent && <Zap className="h-4 w-4 text-orange-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                          >
                            {deleting === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No campaigns found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Editor View ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            {editingId ? "Edit Campaign" : "Create Campaign"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {form.title || "Untitled campaign"} &middot; {form.campaignMode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="info">Campaign Info</TabsTrigger>
          <TabsTrigger value="type">Campaign Type</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          {form.campaignMode === "fundraiser" && <TabsTrigger value="fundraiser">Fundraiser</TabsTrigger>}
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          {form.checkoutSettings.enableUpsell && <TabsTrigger value="upsells">Upsells</TabsTrigger>}
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Campaign Info ── */}
        <TabsContent value="info">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((p) => ({
                      ...p,
                      title,
                      slug: editingId ? p.slug : generateSlug(title),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-generated-from-title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Description (HTML)</Label>
              <textarea
                rows={8}
                value={form.fullDescription}
                onChange={(e) => setForm((p) => ({ ...p, fullDescription: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                placeholder="<p>Describe your campaign...</p>"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <FilePicker value={form.thumbnail} onChange={(url) => setForm((p) => ({ ...p, thumbnail: url }))} accept="image" />
              </div>
              <div className="space-y-2">
                <Label>Banner</Label>
                <FilePicker value={form.banner} onChange={(url) => setForm((p) => ({ ...p, banner: url }))} accept="image" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={form.tags.join(", ")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  }))
                }
                placeholder="zakat, sadaqah, education"
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
                <Star className="h-3.5 w-3.5 text-amber-500" /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isUrgent} onCheckedChange={(v) => setForm((p) => ({ ...p, isUrgent: v }))} />
                <Zap className="h-3.5 w-3.5 text-orange-500" /> Urgent
              </label>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Campaign Type ── */}
        <TabsContent value="type">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Campaign Mode</h3>
            <p className="text-sm text-muted-foreground">Select the type of campaign. This determines which configuration options are available.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPAIGN_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, campaignMode: m.value }))}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    form.campaignMode === m.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Attributes ── */}
        <TabsContent value="attributes">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-lg">Campaign Attributes</h3>
                <p className="text-sm text-muted-foreground">
                  Each attribute defines a donation option with its own payment types, preset amounts, and custom fields.
                </p>
              </div>
              <Button onClick={() => setForm((p) => ({ ...p, attributes: [...p.attributes, newAttribute()] }))}>
                <Plus className="h-4 w-4" /> Add Attribute
              </Button>
            </div>

            {form.attributes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No attributes yet. Add one to define donation options.
              </div>
            )}

            <div className="space-y-4">
              {form.attributes.map((attr, ai) => (
                <AttributeEditor
                  key={attr.id}
                  attribute={attr}
                  index={ai}
                  total={form.attributes.length}
                  onChange={(updated) =>
                    setForm((p) => ({
                      ...p,
                      attributes: p.attributes.map((a, i) => (i === ai ? updated : a)),
                    }))
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      attributes: p.attributes.filter((_, i) => i !== ai),
                    }))
                  }
                  onMoveUp={() =>
                    setForm((p) => {
                      if (ai === 0) return p;
                      const arr = [...p.attributes];
                      const prev = arr[ai - 1];
                      const curr = arr[ai];
                      if (prev && curr) {
                        arr[ai - 1] = curr;
                        arr[ai] = prev;
                      }
                      return { ...p, attributes: arr };
                    })
                  }
                  onMoveDown={() =>
                    setForm((p) => {
                      if (ai >= p.attributes.length - 1) return p;
                      const arr = [...p.attributes];
                      const curr = arr[ai];
                      const next = arr[ai + 1];
                      if (curr && next) {
                        arr[ai] = next;
                        arr[ai + 1] = curr;
                      }
                      return { ...p, attributes: arr };
                    })
                  }
                  onDuplicate={() =>
                    setForm((p) => ({
                      ...p,
                      attributes: [
                        ...p.attributes,
                        { ...attr, id: uid(), name: `${attr.name} (copy)` },
                      ],
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Fundraiser (conditional) ── */}
        <TabsContent value="fundraiser">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-5">
            <h3 className="font-serif font-semibold text-lg">Fundraiser Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  value={form.fundraiserSettings.targetAmount}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fundraiserSettings: { ...p.fundraiserSettings, targetAmount: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Raised Amount</Label>
                <Input
                  type="number"
                  value={form.fundraiserSettings.raisedAmount}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fundraiserSettings: { ...p.fundraiserSettings, raisedAmount: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.fundraiserSettings.startDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fundraiserSettings: { ...p.fundraiserSettings, startDate: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.fundraiserSettings.endDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fundraiserSettings: { ...p.fundraiserSettings, endDate: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <SwitchRow
                label="Show Progress Bar"
                checked={form.fundraiserSettings.showProgressBar}
                onChange={(v) =>
                  setForm((p) => ({ ...p, fundraiserSettings: { ...p.fundraiserSettings, showProgressBar: v } }))
                }
              />
              <SwitchRow
                label="Auto-Close After Deadline"
                checked={form.fundraiserSettings.autoCloseAfterDeadline}
                onChange={(v) =>
                  setForm((p) => ({ ...p, fundraiserSettings: { ...p.fundraiserSettings, autoCloseAfterDeadline: v } }))
                }
              />
              <SwitchRow
                label="Allow Overfunding"
                checked={form.fundraiserSettings.allowOverfunding}
                onChange={(v) =>
                  setForm((p) => ({ ...p, fundraiserSettings: { ...p.fundraiserSettings, allowOverfunding: v } }))
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 5: Checkout ── */}
        <TabsContent value="checkout">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Checkout Settings</h3>
            <p className="text-sm text-muted-foreground">Configure what options donors see at checkout.</p>
            <div className="space-y-3">
              <SwitchRow
                label="Allow Anonymous Donations"
                checked={form.checkoutSettings.allowAnonymous}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, allowAnonymous: v } }))}
              />
              <SwitchRow
                label="Enable Gift Aid"
                checked={form.checkoutSettings.enableGiftAid}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, enableGiftAid: v } }))}
              />
              <SwitchRow
                label="Enable Dedication (donate in honour of someone)"
                checked={form.checkoutSettings.enableDedication}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, enableDedication: v } }))}
              />
              <SwitchRow
                label="Enable Comments"
                checked={form.checkoutSettings.enableComments}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, enableComments: v } }))}
              />
              <SwitchRow
                label="Enable Upsell at Checkout"
                checked={form.checkoutSettings.enableUpsell}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, enableUpsell: v } }))}
              />
              <SwitchRow
                label="Enable Fee Coverage (donor covers processing fees)"
                checked={form.checkoutSettings.enableFeeCoverage}
                onChange={(v) => setForm((p) => ({ ...p, checkoutSettings: { ...p.checkoutSettings, enableFeeCoverage: v } }))}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 6: Upsells (conditional) ── */}
        <TabsContent value="upsells">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-lg">Checkout Upsells</h3>
                <p className="text-sm text-muted-foreground">Add optional items donors can include at checkout.</p>
              </div>
              <Button size="sm" onClick={() => setForm((p) => ({ ...p, upsells: [...p.upsells, newUpsell()] }))}>
                <Plus className="h-4 w-4" /> Add Upsell
              </Button>
            </div>
            {form.upsells.map((u, i) => (
              <div key={u.id} className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
                <div className="flex-1 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={u.label}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          upsells: p.upsells.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)),
                        }))
                      }
                      placeholder="e.g. Cover admin fee"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      value={u.amount}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          upsells: p.upsells.map((x, xi) => (xi === i ? { ...x, amount: Number(e.target.value) } : x)),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={u.description}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          upsells: p.upsells.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-5">
                  <Switch
                    checked={u.isActive}
                    onCheckedChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        upsells: p.upsells.map((x, xi) => (xi === i ? { ...x, isActive: v } : x)),
                      }))
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setForm((p) => ({ ...p, upsells: p.upsells.filter((_, xi) => xi !== i) }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {form.upsells.length === 0 && (
              <p className="text-center py-6 text-muted-foreground text-sm">No upsells added yet.</p>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 7: Visibility ── */}
        <TabsContent value="visibility">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Visibility Settings</h3>
            <div className="space-y-3">
              <SwitchRow
                label="Show in Header Navigation"
                checked={form.visibilitySettings.showInHeader}
                onChange={(v) => setForm((p) => ({ ...p, visibilitySettings: { ...p.visibilitySettings, showInHeader: v } }))}
              />
              <SwitchRow
                label="Show on Homepage"
                checked={form.visibilitySettings.showOnHomepage}
                onChange={(v) => setForm((p) => ({ ...p, visibilitySettings: { ...p.visibilitySettings, showOnHomepage: v } }))}
              />
              <SwitchRow
                label="Pin to Top of Campaign List"
                checked={form.visibilitySettings.pinToTop}
                onChange={(v) => setForm((p) => ({ ...p, visibilitySettings: { ...p.visibilitySettings, pinToTop: v } }))}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 8: Payment Gateways ── */}
        <TabsContent value="gateways">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Payment Gateways</h3>
            <p className="text-sm text-muted-foreground">Select which payment gateways are enabled for this campaign.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GATEWAYS.map((gw) => (
                <label
                  key={gw}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all capitalize",
                    form.paymentGateways.includes(gw) ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.paymentGateways.includes(gw)}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        paymentGateways: p.paymentGateways.includes(gw)
                          ? p.paymentGateways.filter((g) => g !== gw)
                          : [...p.paymentGateways, gw],
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="font-medium text-sm">{gw}</span>
                </label>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 9: SEO ── */}
        <TabsContent value="seo">
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <h3 className="font-serif font-semibold text-lg">SEO Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={form.seoSettings.metaTitle}
                  onChange={(e) => setForm((p) => ({ ...p, seoSettings: { ...p.seoSettings, metaTitle: e.target.value } }))}
                  placeholder={form.title || "Page title"}
                />
              </div>
              <div className="space-y-2">
                <Label>OG Title</Label>
                <Input
                  value={form.seoSettings.ogTitle}
                  onChange={(e) => setForm((p) => ({ ...p, seoSettings: { ...p.seoSettings, ogTitle: e.target.value } }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <textarea
                rows={3}
                value={form.seoSettings.metaDescription}
                onChange={(e) => setForm((p) => ({ ...p, seoSettings: { ...p.seoSettings, metaDescription: e.target.value } }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={form.shortDescription || "Campaign description for search engines"}
              />
            </div>
            <div className="space-y-2">
              <Label>OG Description</Label>
              <textarea
                rows={2}
                value={form.seoSettings.ogDescription}
                onChange={(e) => setForm((p) => ({ ...p, seoSettings: { ...p.seoSettings, ogDescription: e.target.value } }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>OG Image</Label>
              <FilePicker
                value={form.seoSettings.ogImage}
                onChange={(url) => setForm((p) => ({ ...p, seoSettings: { ...p.seoSettings, ogImage: url } }))}
                accept="image"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : editingId ? "Update Campaign" : "Create Campaign"}
        </Button>
      </div>
    </div>
  );
}

// ── Attribute Editor Component ──

function AttributeEditor({
  attribute,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: {
  attribute: CampaignAttribute;
  index: number;
  total: number;
  onChange: (attr: CampaignAttribute) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function update<K extends keyof CampaignAttribute>(key: K, value: CampaignAttribute[K]) {
    onChange({ ...attribute, [key]: value });
  }

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 p-4">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 text-left">
          <span className="font-medium text-sm">
            {attribute.name || `Attribute ${index + 1}`}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {[
              attribute.enableSinglePayment && "Single",
              attribute.enableRegularPayment && "Regular",
              attribute.enableQuantity && "Qty",
            ]
              .filter(Boolean)
              .join(" · ") || "No payment types"}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={index >= total - 1}>
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <Separator />

          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Attribute Name *</Label>
              <Input value={attribute.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Feed a Family" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" value={attribute.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Input value={attribute.description} onChange={(e) => update("description", e.target.value)} placeholder="Briefly describe this attribute" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Image</Label>
            <FilePicker value={attribute.image} onChange={(url) => update("image", url)} accept="image" />
          </div>

          {/* Payment type toggles */}
          <div className="flex flex-wrap gap-6 p-3 rounded-lg bg-muted/30">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={attribute.enableSinglePayment} onCheckedChange={(v) => update("enableSinglePayment", v)} />
              Single Payment
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={attribute.enableRegularPayment} onCheckedChange={(v) => update("enableRegularPayment", v)} />
              Regular Payment
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={attribute.enableQuantity} onCheckedChange={(v) => update("enableQuantity", v)} />
              Quantity
            </label>
          </div>

          {/* Single payment config */}
          {attribute.enableSinglePayment && (
            <div className="p-4 rounded-xl border space-y-3">
              <h4 className="text-sm font-semibold">Single Payment Configuration</h4>
              <div className="space-y-2">
                <Label className="text-xs">Price Type</Label>
                <select
                  value={attribute.singlePaymentConfig.priceType}
                  onChange={(e) =>
                    update("singlePaymentConfig", { ...attribute.singlePaymentConfig, priceType: e.target.value as any })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="preset">Preset Only</option>
                  <option value="custom">Custom Only</option>
                  <option value="both">Both (Preset + Custom)</option>
                </select>
              </div>
              {(attribute.singlePaymentConfig.priceType === "preset" || attribute.singlePaymentConfig.priceType === "both") && (
                <div className="space-y-2">
                  <Label className="text-xs">Preset Amounts</Label>
                  <div className="flex flex-wrap gap-2">
                    {attribute.singlePaymentConfig.presetAmounts.map((amt, pi) => (
                      <div key={pi} className="flex items-center gap-1 rounded-lg border px-2 py-1 bg-muted/30">
                        <Input
                          type="number"
                          value={amt}
                          onChange={(e) => {
                            const arr = [...attribute.singlePaymentConfig.presetAmounts];
                            arr[pi] = Number(e.target.value);
                            update("singlePaymentConfig", { ...attribute.singlePaymentConfig, presetAmounts: arr });
                          }}
                          className="h-7 w-20 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const arr = attribute.singlePaymentConfig.presetAmounts.filter((_, i) => i !== pi);
                            update("singlePaymentConfig", { ...attribute.singlePaymentConfig, presetAmounts: arr });
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() =>
                        update("singlePaymentConfig", {
                          ...attribute.singlePaymentConfig,
                          presetAmounts: [...attribute.singlePaymentConfig.presetAmounts, 0],
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {(attribute.singlePaymentConfig.priceType === "custom" || attribute.singlePaymentConfig.priceType === "both") && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Amount</Label>
                    <Input
                      type="number"
                      value={attribute.singlePaymentConfig.minAmount}
                      onChange={(e) =>
                        update("singlePaymentConfig", { ...attribute.singlePaymentConfig, minAmount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Amount</Label>
                    <Input
                      type="number"
                      value={attribute.singlePaymentConfig.maxAmount}
                      onChange={(e) =>
                        update("singlePaymentConfig", { ...attribute.singlePaymentConfig, maxAmount: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regular payment config */}
          {attribute.enableRegularPayment && (
            <div className="p-4 rounded-xl border space-y-3">
              <h4 className="text-sm font-semibold">Regular Payment Configuration</h4>
              <div className="space-y-2">
                <Label className="text-xs">Allowed Intervals</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERVALS.map((interval) => (
                    <label key={interval} className="flex items-center gap-1.5 text-xs capitalize">
                      <input
                        type="checkbox"
                        checked={attribute.regularPaymentConfig.allowedIntervals.includes(interval)}
                        onChange={() => {
                          const arr = attribute.regularPaymentConfig.allowedIntervals.includes(interval)
                            ? attribute.regularPaymentConfig.allowedIntervals.filter((i) => i !== interval)
                            : [...attribute.regularPaymentConfig.allowedIntervals, interval];
                          update("regularPaymentConfig", { ...attribute.regularPaymentConfig, allowedIntervals: arr });
                        }}
                        className="h-3.5 w-3.5 rounded accent-primary"
                      />
                      {interval}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Duration Type</Label>
                <select
                  value={attribute.regularPaymentConfig.durationType}
                  onChange={(e) =>
                    update("regularPaymentConfig", {
                      ...attribute.regularPaymentConfig,
                      durationType: e.target.value as any,
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="never_ends">Never Ends</option>
                  <option value="fixed_duration">Fixed Duration</option>
                </select>
              </div>
              {attribute.regularPaymentConfig.durationType === "fixed_duration" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fixed Duration Value</Label>
                    <Input
                      type="number"
                      value={attribute.regularPaymentConfig.fixedDurationValue || 0}
                      onChange={(e) =>
                        update("regularPaymentConfig", {
                          ...attribute.regularPaymentConfig,
                          fixedDurationValue: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration Type</Label>
                    <select
                      value={attribute.regularPaymentConfig.fixedDurationType || "months"}
                      onChange={(e) =>
                        update("regularPaymentConfig", {
                          ...attribute.regularPaymentConfig,
                          fixedDurationType: e.target.value as any,
                        })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="months">Months</option>
                      <option value="payments">Number of Payments</option>
                      <option value="date">Until Date</option>
                    </select>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Preset Amounts</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      update("regularPaymentConfig", {
                        ...attribute.regularPaymentConfig,
                        presetAmounts: [
                          ...attribute.regularPaymentConfig.presetAmounts,
                          { amount: 0, cause: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                {attribute.regularPaymentConfig.presetAmounts.map((preset, pi) => (
                  <div key={pi} className="flex items-end gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="w-24 space-y-1">
                      <Label className="text-[10px]">Amount</Label>
                      <Input
                        type="number"
                        value={preset.amount}
                        onChange={(e) => {
                          const arr = [...attribute.regularPaymentConfig.presetAmounts];
                          arr[pi] = { ...arr[pi], amount: Number(e.target.value) };
                          update("regularPaymentConfig", { ...attribute.regularPaymentConfig, presetAmounts: arr });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Cause / Label</Label>
                      <Input
                        value={preset.cause}
                        onChange={(e) => {
                          const arr = [...attribute.regularPaymentConfig.presetAmounts];
                          arr[pi] = { ...arr[pi], cause: e.target.value };
                          update("regularPaymentConfig", { ...attribute.regularPaymentConfig, presetAmounts: arr });
                        }}
                        className="h-8 text-xs"
                        placeholder="e.g. Orphan Sponsorship"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => {
                        const arr = attribute.regularPaymentConfig.presetAmounts.filter((_, i) => i !== pi);
                        update("regularPaymentConfig", { ...attribute.regularPaymentConfig, presetAmounts: arr });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <SwitchRow
                label="Allow Custom Amount"
                checked={attribute.regularPaymentConfig.allowCustomAmount}
                onChange={(v) =>
                  update("regularPaymentConfig", { ...attribute.regularPaymentConfig, allowCustomAmount: v })
                }
              />
              {attribute.regularPaymentConfig.allowCustomAmount && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Custom Min Amount</Label>
                    <Input
                      type="number"
                      value={attribute.regularPaymentConfig.customMinAmount}
                      onChange={(e) =>
                        update("regularPaymentConfig", {
                          ...attribute.regularPaymentConfig,
                          customMinAmount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Custom Max Amount</Label>
                    <Input
                      type="number"
                      value={attribute.regularPaymentConfig.customMaxAmount}
                      onChange={(e) =>
                        update("regularPaymentConfig", {
                          ...attribute.regularPaymentConfig,
                          customMaxAmount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity config */}
          {attribute.enableQuantity && (
            <div className="p-4 rounded-xl border space-y-3">
              <h4 className="text-sm font-semibold">Quantity Configuration</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity Label</Label>
                  <Input
                    value={attribute.quantityConfig.quantityLabel}
                    onChange={(e) => update("quantityConfig", { ...attribute.quantityConfig, quantityLabel: e.target.value })}
                    placeholder="e.g. Number of meals"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={attribute.quantityConfig.minQuantity}
                    onChange={(e) => update("quantityConfig", { ...attribute.quantityConfig, minQuantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={attribute.quantityConfig.maxQuantity}
                    onChange={(e) => update("quantityConfig", { ...attribute.quantityConfig, maxQuantity: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom fields */}
          <div className="p-4 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Custom Fields ({attribute.customFields.length})</h4>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => update("customFields", [...attribute.customFields, newCustomField()])}
              >
                <Plus className="h-3 w-3" /> Add Field
              </Button>
            </div>
            {attribute.customFields.map((cf, fi) => (
              <div key={cf.id} className="p-3 rounded-lg bg-muted/20 border space-y-2">
                <div className="flex items-end gap-2">
                  <div className="w-28 space-y-1">
                    <Label className="text-[10px]">Type</Label>
                    <select
                      value={cf.fieldType}
                      onChange={(e) => {
                        const arr = [...attribute.customFields];
                        arr[fi] = { ...arr[fi], fieldType: e.target.value };
                        update("customFields", arr);
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft} className="capitalize">{ft}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Label</Label>
                    <Input
                      value={cf.label}
                      onChange={(e) => {
                        const arr = [...attribute.customFields];
                        arr[fi] = { ...arr[fi], label: e.target.value };
                        update("customFields", arr);
                      }}
                      className="h-8 text-xs"
                      placeholder="Field label"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Placeholder</Label>
                    <Input
                      value={cf.placeholder}
                      onChange={(e) => {
                        const arr = [...attribute.customFields];
                        arr[fi] = { ...arr[fi], placeholder: e.target.value };
                        update("customFields", arr);
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-1 text-[10px] whitespace-nowrap pb-0.5">
                    <input
                      type="checkbox"
                      checked={cf.isRequired}
                      onChange={(e) => {
                        const arr = [...attribute.customFields];
                        arr[fi] = { ...arr[fi], isRequired: e.target.checked };
                        update("customFields", arr);
                      }}
                      className="h-3 w-3 rounded accent-primary"
                    />
                    Required
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => update("customFields", attribute.customFields.filter((_, i) => i !== fi))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {(cf.fieldType === "dropdown" || cf.fieldType === "radio") && (
                  <div className="space-y-1 ml-2">
                    <Label className="text-[10px]">Options (comma-separated)</Label>
                    <Input
                      value={cf.options.join(", ")}
                      onChange={(e) => {
                        const arr = [...attribute.customFields];
                        arr[fi] = { ...arr[fi], options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                        update("customFields", arr);
                      }}
                      className="h-7 text-xs"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Switch Row ──

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
