"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Check,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilePicker } from "@/components/ui/file-picker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { cn } from "@/lib/utils";
import {
  fetchAdminCampaigns,
  adminCreateCampaign,
  adminUpdateCampaign,
  adminDeleteCampaign,
} from "@/lib/api";
import {
  CAMPAIGN_MODE_LABELS,
  DEFAULT_FIDYA_CONFIG,
  DEFAULT_RAMADAN_CONFIG,
  isExperienceCampaignMode,
  type FidyaKaffarahConfig,
  type RamadanSplitConfig,
} from "@/lib/campaign-experience";

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

type CampaignMode =
  | "standard"
  | "fundraiser"
  | "sponsorship"
  | "zakat"
  | "automated"
  | "fidya_kaffarah"
  | "ramadan_split";

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
  expirationEnabled: boolean;
  expiresAt: string;
  campaignMode: CampaignMode;
  currency: string;
  experienceConfig: FidyaKaffarahConfig | RamadanSplitConfig | Record<string, never>;
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

function toDatetimeLocalValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

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
  expirationEnabled: false,
  expiresAt: "",
  campaignMode: "standard",
  currency: "GBP",
  experienceConfig: {},
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
  { value: "fidya_kaffarah", label: "Fidya / Kaffarah", desc: "Quantity-based Fidya and Kaffarah checkout" },
  { value: "ramadan_split", label: "Ramadan Split", desc: "Split gifts across Ramadan nights with weights" },
];

const GATEWAYS = ["stripe", "paypal", "telr", "paytabs"];
const FIELD_TYPES = ["text", "textarea", "dropdown", "radio", "checkbox", "number", "date"];
const CATEGORIES = ["general", "education", "health", "water", "food", "shelter", "orphan", "zakat", "sadaqah", "emergency"];

const CAMPAIGN_STATUSES = ["draft", "published", "archived"] as const;
type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

function normalizeCampaignStatus(status: string): CampaignStatus {
  return CAMPAIGN_STATUSES.includes(status as CampaignStatus) ? (status as CampaignStatus) : "draft";
}

function getStatusTransitions(current: string): CampaignStatus[] {
  const normalized = normalizeCampaignStatus(current);
  return CAMPAIGN_STATUSES.filter((s) => s !== normalized);
}

type WizardStepId =
  | "info"
  | "attributes"
  | "fundraiser"
  | "checkout"
  | "upsells"
  | "visibility"
  | "gateways"
  | "seo";

interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
}

function buildWizardSteps(form: CampaignForm): WizardStep[] {
  const experience = isExperienceCampaignMode(form.campaignMode);
  const steps: WizardStep[] = [
    {
      id: "info",
      title: "Campaign basics",
      description: experience
        ? "Campaign details, images, type, and Fidya/Kaffarah or Ramadan settings."
        : "Name your campaign, choose its type, and upload images.",
    },
  ];

  if (!experience) {
    steps.push({
      id: "attributes",
      title: "Donation options",
      description: "Set preset amounts, payment types, and custom fields.",
    });
  }

  if (form.campaignMode === "fundraiser") {
    steps.push({
      id: "fundraiser",
      title: "Fundraiser goal",
      description: "Set your target, deadline, and progress bar options.",
    });
  }

  if (!experience) {
    steps.push({
      id: "checkout",
      title: "Checkout options",
      description: "Gift Aid, dedications, comments, and upsell toggles.",
    });
    if (form.checkoutSettings.enableUpsell) {
      steps.push({
        id: "upsells",
        title: "Upsell add-ons",
        description: "Optional extra amounts donors can add at checkout.",
      });
    }
  }

  steps.push(
    {
      id: "visibility",
      title: "Visibility",
      description: "Control where this campaign appears on your site.",
    },
    {
      id: "gateways",
      title: "Payment gateways",
      description: "Choose which payment providers accept donations.",
    },
    {
      id: "seo",
      title: "SEO & publish",
      description: "Search and social previews — then create or update your campaign.",
    }
  );

  return steps;
}

function normalizeAttributePayment(attr: CampaignAttribute): CampaignAttribute {
  if (attr.enableQuantity && !attr.enableRegularPayment) {
    return { ...attr, enableQuantity: false };
  }
  return attr;
}

function normalizeCampaignAttributes(attributes: CampaignAttribute[]) {
  return attributes.map(normalizeAttributePayment);
}

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
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const wizardSteps = useMemo(
    () => buildWizardSteps(form),
    [form.campaignMode, form.checkoutSettings.enableUpsell]
  );

  useEffect(() => {
    if (!showEditor) return;
    setCurrentStepIndex((i) => Math.min(i, Math.max(0, wizardSteps.length - 1)));
  }, [wizardSteps.length, showEditor]);

  function goToStep(index: number) {
    setCurrentStepIndex(Math.max(0, Math.min(index, wizardSteps.length - 1)));
  }

  function goNextStep() {
    const step = wizardSteps[currentStepIndex];
    if (!step || !validateStep(step.id)) return;
    setCurrentStepIndex((i) => Math.min(i + 1, wizardSteps.length - 1));
  }

  function goPrevStep() {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  }

  function openCreate() {
    setForm({ ...defaultForm, attributes: [], upsells: [] });
    setEditingId(null);
    setCurrentStepIndex(0);
    setShowEditor(true);
  }

  function campaignToForm(c: Campaign): CampaignForm {
    return {
      title: c.title || "",
      slug: c.slug || "",
      shortDescription: c.shortDescription || "",
      fullDescription: c.fullDescription || "",
      thumbnail: c.thumbnail || "",
      banner: c.banner || "",
      category: c.category || "",
      tags: [...(c.tags || [])],
      status: c.status || "draft",
      isFeatured: c.isFeatured || false,
      isUrgent: c.isUrgent || false,
      expirationEnabled: Boolean(c.expirationEnabled),
      expiresAt: c.expiresAt || "",
      campaignMode: c.campaignMode || "standard",
      currency: c.currency || "GBP",
      experienceConfig: (c as Campaign & { experienceConfig?: CampaignForm["experienceConfig"] }).experienceConfig
        ? { ...(c as Campaign & { experienceConfig?: CampaignForm["experienceConfig"] }).experienceConfig! }
        : {},
      attributes: (c.attributes || []).map((attr) => ({
        ...attr,
        singlePaymentConfig: {
          ...attr.singlePaymentConfig,
          presetAmounts: [...attr.singlePaymentConfig.presetAmounts],
        },
        regularPaymentConfig: {
          ...attr.regularPaymentConfig,
          presetAmounts: [...attr.regularPaymentConfig.presetAmounts],
        },
        quantityConfig: { ...attr.quantityConfig },
        customFields: (attr.customFields || []).map((field) => ({ ...field, options: [...field.options] })),
      })),
      upsells: (c.upsells || []).map((upsell) => ({ ...upsell })),
      fundraiserSettings: { ...defaultForm.fundraiserSettings, ...(c.fundraiserSettings || {}) },
      checkoutSettings: { ...defaultForm.checkoutSettings, ...(c.checkoutSettings || {}) },
      visibilitySettings: { ...defaultForm.visibilitySettings, ...(c.visibilitySettings || {}) },
      paymentGateways: [...(c.paymentGateways || ["stripe"])],
      seoSettings: { ...defaultForm.seoSettings, ...(c.seoSettings || {}) },
    };
  }

  function cloneCampaignIds(formData: CampaignForm): CampaignForm {
    return {
      ...formData,
      attributes: formData.attributes.map((attr) => ({
        ...attr,
        id: uid(),
        customFields: attr.customFields.map((field) => ({ ...field, id: uid() })),
      })),
      upsells: formData.upsells.map((upsell) => ({ ...upsell, id: uid() })),
    };
  }

  function openEdit(c: Campaign) {
    setForm(campaignToForm(c));
    setEditingId(c.id);
    setCurrentStepIndex(0);
    setShowEditor(true);
  }

  function openCopy(c: Campaign) {
    const baseSlug = (c.slug || generateSlug(c.title || "campaign")).replace(/-copy(-\d+)?$/, "");
    const copyTitle = `${c.title || "Untitled campaign"} (Copy)`;

    setForm(
      cloneCampaignIds({
        ...campaignToForm(c),
        title: copyTitle,
        slug: `${baseSlug}-copy`,
        status: "draft",
        fundraiserSettings: {
          ...defaultForm.fundraiserSettings,
          ...(c.fundraiserSettings || {}),
          raisedAmount: 0,
        },
      })
    );
    setEditingId(null);
    setCurrentStepIndex(0);
    setShowEditor(true);
    toast.success("Campaign duplicated — review and save as new");
  }

  function validateStep(stepId: WizardStepId): boolean {
    if (stepId === "info" && !form.title.trim()) {
      toast.error("Please enter a campaign title before continuing.");
      return false;
    }
    if (stepId === "info" && form.campaignMode !== "fundraiser" && form.expirationEnabled && !form.expiresAt) {
      toast.warning("Please set a campaign expiration date and time.");
      return false;
    }
    if (stepId === "attributes" && !isExperienceCampaignMode(form.campaignMode) && form.attributes.length === 0) {
      toast.warning(
        "Add at least one donation attribute. Without it, this campaign will not show any payment options to donors."
      );
      return false;
    }
    return true;
  }

  function validateBeforeSave(): boolean {
    if (!form.title.trim()) return false;
    if (form.campaignMode !== "fundraiser" && form.expirationEnabled && !form.expiresAt) {
      toast.warning("Please set a campaign expiration date and time.");
      return false;
    }
    if (!isExperienceCampaignMode(form.campaignMode) && form.attributes.length === 0) {
      toast.warning(
        "Add at least one donation attribute. Without it, this campaign will not show any payment options to donors."
      );
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validateBeforeSave()) {
      if (!form.title.trim()) {
        toast.error("Title is required");
        setCurrentStepIndex(0);
      } else if (!isExperienceCampaignMode(form.campaignMode)) {
        const attributesStepIndex = wizardSteps.findIndex((s) => s.id === "attributes");
        if (attributesStepIndex >= 0) setCurrentStepIndex(attributesStepIndex);
      }
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
      const payload = {
        ...form,
        slug,
        attributes: normalizeCampaignAttributes(form.attributes),
        expiresAt:
          form.campaignMode === "fundraiser"
            ? null
            : form.expirationEnabled
              ? form.expiresAt
              : null,
        expirationEnabled: form.campaignMode === "fundraiser" ? false : form.expirationEnabled,
      };

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

  async function handleStatusChange(campaign: Campaign, newStatus: CampaignStatus) {
    setStatusMenuOpenId(null);
    setStatusUpdating(campaign.id);
    try {
      await adminUpdateCampaign(campaign.id, { status: newStatus });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Campaign moved to ${STATUS_LABELS[newStatus]}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update campaign status");
    } finally {
      setStatusUpdating(null);
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
            <p className="text-muted-foreground mt-1">
              Manage all fundraising campaigns — including Fidya/Kaffarah and Ramadan Split experiences.
            </p>
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
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
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
                        <Badge variant="outline">
                          {CAMPAIGN_MODE_LABELS[c.campaignMode || "standard"] || c.campaignMode}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[c.status] || "bg-slate-100 text-slate-600")}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {isExperienceCampaignMode(c.campaignMode || "standard")
                          ? "—"
                          : `${c.attributes?.length || 0} attribute${(c.attributes?.length || 0) !== 1 ? "s" : ""}`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {c.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          {c.isUrgent && <Zap className="h-4 w-4 text-orange-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit campaign">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openCopy(c)}
                            title="Duplicate campaign"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Popover
                            open={statusMenuOpenId === c.id}
                            onOpenChange={(open) => setStatusMenuOpenId(open ? c.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Change status"
                                disabled={statusUpdating === c.id}
                              >
                                {statusUpdating === c.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-44 p-1">
                              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Change status
                              </p>
                              {getStatusTransitions(c.status).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => handleStatusChange(c, status)}
                                >
                                  {STATUS_LABELS[status]}
                                </button>
                              ))}
                            </PopoverContent>
                          </Popover>
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

  const isExperienceMode = isExperienceCampaignMode(form.campaignMode);
  const fidyaConfig = {
    ...DEFAULT_FIDYA_CONFIG,
    ...(form.experienceConfig as FidyaKaffarahConfig),
  };
  const ramadanConfig = {
    ...DEFAULT_RAMADAN_CONFIG,
    ...(form.experienceConfig as RamadanSplitConfig),
  };

  const currentStep = wizardSteps[currentStepIndex] ?? wizardSteps[0];
  const currentStepId = currentStep?.id ?? "info";
  const isLastStep = currentStepIndex >= wizardSteps.length - 1;

  // ── Editor View ──

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            {editingId ? "Edit Campaign" : "Create Campaign"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {form.title || "Untitled campaign"} &middot; {CAMPAIGN_MODE_LABELS[form.campaignMode] || form.campaignMode}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editingId && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Updating..." : "Update"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
        </div>
      </div>

      <nav aria-label="Campaign setup progress" className="rounded-2xl border bg-card shadow-soft p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <p className="text-sm font-medium text-foreground">
            Step {currentStepIndex + 1} of {wizardSteps.length}
          </p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {Math.round(((currentStepIndex + 1) / wizardSteps.length) * 100)}% complete
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / wizardSteps.length) * 100}%` }}
          />
        </div>
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-2">
          {wizardSteps.map((step, index) => {
            const done = index < currentStepIndex;
            const active = index === currentStepIndex;
            return (
              <li key={step.id} className="flex items-center gap-1 sm:contents">
                <button
                  type="button"
                  onClick={() => {
                    if (index <= currentStepIndex) goToStep(index);
                  }}
                  disabled={index > currentStepIndex}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition sm:text-sm",
                    active && "bg-primary/10 text-primary font-semibold",
                    done && "text-foreground hover:bg-muted cursor-pointer",
                    !active && !done && "text-muted-foreground cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                      active && "border-primary bg-primary text-primary-foreground",
                      done && "border-primary bg-primary/15 text-primary",
                      !active && !done && "border-border bg-background"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{step.title}</span>
                </button>
                {index < wizardSteps.length - 1 && (
                  <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="border-b bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-serif font-bold">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{currentStep.description}</p>
        </div>

        <div className="p-6">
        {currentStepId === "info" && (
          <div className="space-y-5">
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
              <Label>Full Description</Label>
              <p className="text-xs text-muted-foreground">
                Design your campaign page with the editor below — no coding required.
              </p>
              <RichTextEditor
                value={form.fullDescription}
                onChange={(html) => setForm((p) => ({ ...p, fullDescription: html }))}
                placeholder="Tell donors about this campaign — add headings, images, lists, and more."
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

            <div className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
              <div>
                <h3 className="font-serif font-semibold text-lg">Campaign type</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the type of campaign. This determines which configuration options are available.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CAMPAIGN_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        campaignMode: m.value,
                        ...(m.value === "fundraiser"
                          ? { expirationEnabled: false, expiresAt: "" }
                          : {}),
                        experienceConfig:
                          m.value === "fidya_kaffarah"
                            ? { ...DEFAULT_FIDYA_CONFIG, ...(p.experienceConfig as FidyaKaffarahConfig) }
                            : m.value === "ramadan_split"
                              ? { ...DEFAULT_RAMADAN_CONFIG, ...(p.experienceConfig as RamadanSplitConfig) }
                              : p.experienceConfig,
                      }))
                    }
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

              {form.campaignMode === "fidya_kaffarah" && (
                <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
                  <h4 className="font-semibold text-sm">Fidya / Kaffarah settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Configure options and unit prices shown on the campaign page.
                  </p>
                  {fidyaConfig.options.map((opt, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <Input
                        value={opt.label}
                        onChange={(e) =>
                          setForm((p) => {
                            const options = [...fidyaConfig.options];
                            options[idx] = { ...options[idx], label: e.target.value };
                            return { ...p, experienceConfig: { ...fidyaConfig, options } };
                          })
                        }
                        placeholder="Label"
                      />
                      <Input
                        value={opt.key}
                        onChange={(e) =>
                          setForm((p) => {
                            const options = [...fidyaConfig.options];
                            options[idx] = { ...options[idx], key: e.target.value };
                            return { ...p, experienceConfig: { ...fidyaConfig, options } };
                          })
                        }
                        placeholder="Key"
                      />
                      <Input
                        type="number"
                        value={opt.unitPrice ?? 0}
                        onChange={(e) =>
                          setForm((p) => {
                            const options = [...fidyaConfig.options];
                            options[idx] = { ...options[idx], unitPrice: Number(e.target.value) };
                            return { ...p, experienceConfig: { ...fidyaConfig, options } };
                          })
                        }
                        placeholder="Unit price"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        experienceConfig: {
                          ...fidyaConfig,
                          options: [
                            ...fidyaConfig.options,
                            { key: `opt-${fidyaConfig.options.length + 1}`, label: "New option", unitPrice: 0 },
                          ],
                        },
                      }))
                    }
                  >
                    Add option
                  </Button>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      type="number"
                      value={fidyaConfig.quantity?.min ?? 1}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceConfig: {
                            ...fidyaConfig,
                            quantity: { ...fidyaConfig.quantity!, min: Number(e.target.value) },
                          },
                        }))
                      }
                      placeholder="Min qty"
                    />
                    <Input
                      type="number"
                      value={fidyaConfig.quantity?.max ?? 999}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceConfig: {
                            ...fidyaConfig,
                            quantity: { ...fidyaConfig.quantity!, max: Number(e.target.value) },
                          },
                        }))
                      }
                      placeholder="Max qty"
                    />
                    <Input
                      type="number"
                      value={fidyaConfig.quantity?.default ?? 1}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceConfig: {
                            ...fidyaConfig,
                            quantity: { ...fidyaConfig.quantity!, default: Number(e.target.value) },
                          },
                        }))
                      }
                      placeholder="Default"
                    />
                    <Input
                      value={fidyaConfig.quantity?.label ?? "Quantity:"}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceConfig: {
                            ...fidyaConfig,
                            quantity: { ...fidyaConfig.quantity!, label: e.target.value },
                          },
                        }))
                      }
                      placeholder="Quantity label"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={Boolean(fidyaConfig.allowCustomAmount)}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, experienceConfig: { ...fidyaConfig, allowCustomAmount: v } }))
                      }
                    />
                    Allow custom amount override
                  </label>
                </div>
              )}

              {form.campaignMode === "ramadan_split" && (
                <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                  <h4 className="font-semibold text-sm">Ramadan Split settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Donors pick nights and optional weights on the public campaign page.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                    <div className="space-y-2">
                      <Label>Ramadan start date</Label>
                      <Input
                        type="date"
                        value={ramadanConfig.ramadanStartDate ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            experienceConfig: { ...ramadanConfig, ramadanStartDate: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max nights</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={ramadanConfig.maxNights ?? 30}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            experienceConfig: { ...ramadanConfig, maxNights: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
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
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
                  <Star className="h-3.5 w-3.5 text-amber-500" /> Featured
                </label>
                <p className="text-xs text-muted-foreground pl-9">
                  Shows a Featured badge on this appeal. All published campaigns appear in Our Appeals except fundraisers.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isUrgent} onCheckedChange={(v) => setForm((p) => ({ ...p, isUrgent: v }))} />
                <Zap className="h-3.5 w-3.5 text-orange-500" /> Urgent
              </label>
            </div>

            {form.campaignMode !== "fundraiser" && (
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">Campaign Expiration</span>
                <Switch
                  checked={form.expirationEnabled}
                  onCheckedChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      expirationEnabled: v,
                      expiresAt: v ? p.expiresAt : "",
                    }))
                  }
                />
              </label>
              {form.expirationEnabled && (
                <div className="space-y-2">
                  <Label className="text-xs">Expires on</Label>
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocalValue(form.expiresAt)}
                    min={toDatetimeLocalValue(new Date().toISOString())}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        expiresAt: fromDatetimeLocalValue(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Donors will see a live countdown on the campaign page until this date and time.
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {currentStepId === "attributes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-lg">Campaign Attributes</h3>
                <p className="text-sm text-muted-foreground">
                  Each attribute defines a donation option with its own payment types, preset amounts, and custom fields.
                </p>
              </div>
              <Button onClick={() => setForm((p) => ({ ...p, attributes: [newAttribute(), ...p.attributes] }))}>
                <Plus className="h-4 w-4" /> Add Attribute
              </Button>
            </div>

            {!isExperienceCampaignMode(form.campaignMode) && form.attributes.length === 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                <AlertTriangle className="text-amber-600" />
                <AlertDescription>
                  This campaign has no donation attributes yet. Without at least one attribute, donors will not see any
                  payment options on the campaign page.
                </AlertDescription>
              </Alert>
            )}

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
                        { ...attr, id: uid(), name: `${attr.name} (copy)` },
                        ...p.attributes,
                      ],
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "fundraiser" && (
          <div className="space-y-5">
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
        )}

        {currentStepId === "checkout" && (
          <div className="space-y-4">
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
        )}

        {currentStepId === "upsells" && (
          <div className="space-y-4">
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
        )}

        {currentStepId === "visibility" && (
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">Visibility Settings</h3>
            <p className="text-sm text-muted-foreground">
              Control where this campaign appears on the public site. The campaign must be{" "}
              <strong>published</strong> for any of these to take effect.
            </p>
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <SwitchRow
                label="Show in Header Navigation"
                description="Adds a link in the top site menu (desktop and mobile), next to Zakat."
                checked={form.visibilitySettings.showInHeader}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    visibilitySettings: { ...p.visibilitySettings, showInHeader: v },
                  }))
                }
              />
              <SwitchRow
                label="Show on Homepage"
                description='Includes this campaign in the homepage "Our Appeals" section (or "Live Fundraisers" for fundraiser campaigns).'
                checked={form.visibilitySettings.showOnHomepage}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    visibilitySettings: { ...p.visibilitySettings, showOnHomepage: v },
                  }))
                }
              />
              <SwitchRow
                label="Pin to Top of Campaign List"
                description="Sorts this campaign above others on the homepage and on /campaigns (does not hide other campaigns)."
                checked={form.visibilitySettings.pinToTop}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    visibilitySettings: { ...p.visibilitySettings, pinToTop: v },
                  }))
                }
              />
            </div>
          </div>
        )}

        {currentStepId === "gateways" && (
          <div className="space-y-4">
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
        )}

        {currentStepId === "seo" && (
          <div className="space-y-4">
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
            {isLastStep && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-2">
                <p className="text-sm font-medium text-foreground">Ready to publish?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review your settings above, then click {editingId ? "Update Campaign" : "Create Campaign"} below to save.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sticky bottom-0 z-10 rounded-2xl border bg-card/95 backdrop-blur px-4 py-4 shadow-soft">
        <Button
          type="button"
          variant="outline"
          onClick={goPrevStep}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {currentStep.title}
        </p>
        {isLastStep ? (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : editingId ? "Update Campaign" : "Create Campaign"}
          </Button>
        ) : (
          <Button type="button" onClick={goNextStep}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
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

  function setRegularPaymentEnabled(enabled: boolean) {
    onChange({
      ...attribute,
      enableRegularPayment: enabled,
      enableQuantity: enabled ? attribute.enableQuantity : false,
    });
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
              attribute.enableRegularPayment && attribute.enableQuantity && "Qty",
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
          <div className="space-y-3 p-3 rounded-lg bg-muted/30">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={attribute.enableSinglePayment}
                  onCheckedChange={(v) => update("enableSinglePayment", v)}
                />
                Single Payment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={attribute.enableRegularPayment} onCheckedChange={setRegularPaymentEnabled} />
                Regular Payment
              </label>
            </div>
            {attribute.enableRegularPayment && (
              <>
                <p className="text-xs text-muted-foreground">
                  Donors choose the recurring frequency and amount on the campaign page — no admin setup needed.
                </p>
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-border/60">
                  <input
                    type="checkbox"
                    checked={attribute.enableQuantity}
                    onChange={(e) => update("enableQuantity", e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-primary"
                  />
                  Enable quantity selector
                </label>
              </>
            )}
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

          {/* Quantity config — regular payment only */}
          {attribute.enableRegularPayment && attribute.enableQuantity && (
            <div className="p-4 rounded-xl border space-y-3">
              <h4 className="text-sm font-semibold">Quantity Configuration</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity Label</Label>
                  <Input
                    value={attribute.quantityConfig.quantityLabel}
                    onChange={(e) =>
                      update("quantityConfig", { ...attribute.quantityConfig, quantityLabel: e.target.value })
                    }
                    placeholder="e.g. Number of meals"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={attribute.quantityConfig.minQuantity}
                    onChange={(e) =>
                      update("quantityConfig", { ...attribute.quantityConfig, minQuantity: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={attribute.quantityConfig.maxQuantity}
                    onChange={(e) =>
                      update("quantityConfig", { ...attribute.quantityConfig, maxQuantity: Number(e.target.value) })
                    }
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

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {description && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 mt-0.5" />
    </div>
  );
}
