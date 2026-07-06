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
import RamadanStartDatesEditor from "@/components/admin/RamadanStartDatesEditor";
import { cn } from "@/lib/utils";
import {
  fetchAdminCampaigns,
  adminCreateCampaign,
  adminUpdateCampaign,
  adminDeleteCampaign,
  fetchAdminUpsells,
} from "@/lib/api";
import {
  CAMPAIGN_MODE_LABELS,
  DEFAULT_RAMADAN_CONFIG,
  isAttributesSkippedMode,
  isExperienceCampaignMode,
  type RamadanSplitConfig,
} from "@/lib/campaign-experience";
import {
  hasDuplicateAttributeSortOrders,
  nextAttributeSortOrder,
  sortCampaignAttributes,
  swapAttributeSortOrders,
  syncAttributeSortOrders,
} from "@/lib/campaign-attributes";
import {
  DEFAULT_REGULAR_PAYMENT_CONFIG,
  DEFAULT_SINGLE_PAYMENT_CONFIG,
  type PresetAmount,
  type RecurrenceConfig,
  type RegularPaymentConfig,
  type SinglePaymentConfig,
  normalizeRegularPaymentConfig,
  normalizeSinglePaymentConfig,
} from "@/lib/campaign-payment-config";

// ── Types ──

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

interface CatalogUpsell {
  id: string;
  name: string;
  description: string;
  image?: string;
  amount: number;
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
  enableAdminSavesLife: boolean;
  adminSavesLifeAmount: number;
  enablePushRecurringDonation: boolean;
}

interface VisibilitySettings {
  showInHeader: boolean;
  showOnHomepage: boolean;
  pinToTop: boolean;
  headerDisplayName?: string;
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
  experienceConfig: RamadanSplitConfig | Record<string, never>;
  attributes: CampaignAttribute[];
  upsellIds: string[];
  fundraiserSettings: FundraiserSettings;
  checkoutSettings: CheckoutSettings;
  visibilitySettings: VisibilitySettings;
  displayDonorOffset: number;
  paymentGateways: string[];
  seoSettings: SeoSettings;
}

interface Campaign extends CampaignForm {
  id: string;
  donorCount?: number;
  sortOrder?: number;
  createdAt?: string;
  upsells?: Array<{ id?: string; label?: string; name?: string }>;
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
  ...DEFAULT_SINGLE_PAYMENT_CONFIG,
  presetAmounts: DEFAULT_SINGLE_PAYMENT_CONFIG.presetAmounts.map((p) => ({ ...p })),
};

const defaultRegularPaymentConfig: RegularPaymentConfig = {
  ...DEFAULT_REGULAR_PAYMENT_CONFIG,
  presetAmounts: DEFAULT_REGULAR_PAYMENT_CONFIG.presetAmounts.map((p) => ({ ...p })),
  recurrence: { ...DEFAULT_REGULAR_PAYMENT_CONFIG.recurrence },
};

const defaultQuantityConfig: QuantityConfig = {
  quantityLabel: "Quantity",
  minQuantity: 1,
  maxQuantity: 100,
};

function newAttribute(sortOrder = 0): CampaignAttribute {
  return {
    id: uid(),
    name: "",
    description: "",
    image: "",
    sortOrder,
    enableSinglePayment: true,
    enableRegularPayment: false,
    enableQuantity: false,
    singlePaymentConfig: {
      ...defaultSinglePaymentConfig,
      presetAmounts: defaultSinglePaymentConfig.presetAmounts.map((p) => ({ ...p })),
    },
    regularPaymentConfig: {
      ...defaultRegularPaymentConfig,
      presetAmounts: defaultRegularPaymentConfig.presetAmounts.map((p) => ({ ...p })),
    },
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
  upsellIds: [],
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
    enableAdminSavesLife: false,
    adminSavesLifeAmount: 0,
    enablePushRecurringDonation: false,
  },
  visibilitySettings: { showInHeader: false, showOnHomepage: false, pinToTop: false, headerDisplayName: "" },
  displayDonorOffset: 0,
  paymentGateways: ["stripe"],
  seoSettings: { metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "" },
};

const CAMPAIGN_MODES: { value: CampaignMode; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "Regular donation campaign" },
  { value: "fundraiser", label: "Fundraiser", desc: "Goal-based fundraising with progress bar" },
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

  if (!isAttributesSkippedMode(form.campaignMode)) {
    steps.push({
      id: "attributes",
      title: "Donation options",
      description: "Set options, preset amounts, and display order (left to right on the donation page).",
    });
  }

  if (form.campaignMode === "fundraiser") {
    steps.push({
      id: "fundraiser",
      title: "Fundraiser goal",
      description: "Set your target, deadline, and progress bar options.",
    });
  }

  steps.push({
    id: "checkout",
    title: "Checkout options",
    description: experience
      ? "Gift Aid, dedications, comments, and upsells for Fidya/Kaffarah or Ramadan checkout."
      : "Gift Aid, dedications, comments, and upsell toggles.",
  });
  if (form.checkoutSettings.enableUpsell) {
    steps.push({
      id: "upsells",
      title: "Upsell add-ons",
      description: "Optional extra amounts donors can add at checkout.",
    });
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
  const singlePaymentConfig = normalizeSinglePaymentConfig(attr.singlePaymentConfig);
  const regularPaymentConfig = normalizeRegularPaymentConfig(attr.regularPaymentConfig);

  let enableSinglePayment = attr.enableSinglePayment;
  let enableRegularPayment = attr.enableRegularPayment;
  if (enableSinglePayment && enableRegularPayment) {
    enableRegularPayment = false;
  }
  if (!enableSinglePayment && !enableRegularPayment) {
    enableSinglePayment = true;
  }

  return {
    ...attr,
    enableSinglePayment,
    enableRegularPayment,
    singlePaymentConfig,
    regularPaymentConfig,
  };
}

function normalizeCampaignAttributes(attributes: CampaignAttribute[]) {
  return syncAttributeSortOrders(attributes.map(normalizeAttributePayment));
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
  const [catalogUpsells, setCatalogUpsells] = useState<CatalogUpsell[]>([]);

  const loadCatalogUpsells = useCallback(async () => {
    try {
      const data = await fetchAdminUpsells();
      setCatalogUpsells((data.items || []) as unknown as CatalogUpsell[]);
    } catch {
      setCatalogUpsells([]);
    }
  }, []);

  useEffect(() => {
    if (showEditor) loadCatalogUpsells();
  }, [showEditor, loadCatalogUpsells]);

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
    setForm({ ...defaultForm, attributes: [], upsellIds: [] });
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
      attributes: syncAttributeSortOrders(
        (c.attributes || []).map((attr) => {
        const normalized = normalizeAttributePayment(attr as CampaignAttribute);
        return {
          ...normalized,
          singlePaymentConfig: {
            ...normalized.singlePaymentConfig,
            presetAmounts: normalized.singlePaymentConfig.presetAmounts.map((p) => ({ ...p })),
          },
          regularPaymentConfig: {
            ...normalized.regularPaymentConfig,
            presetAmounts: normalized.regularPaymentConfig.presetAmounts.map((p) => ({ ...p })),
            recurrence: { ...normalized.regularPaymentConfig.recurrence },
          },
          quantityConfig: { ...normalized.quantityConfig },
          customFields: (normalized.customFields || []).map((field) => ({
            ...field,
            options: [...field.options],
          })),
        };
      })
      ),
      upsellIds: Array.isArray((c as Campaign & { upsellIds?: string[] }).upsellIds)
        ? [...((c as Campaign & { upsellIds?: string[] }).upsellIds || [])]
        : (c.upsells || []).map((u: { id?: string }) => u.id).filter(Boolean) as string[],
      fundraiserSettings: { ...defaultForm.fundraiserSettings, ...(c.fundraiserSettings || {}) },
      checkoutSettings: { ...defaultForm.checkoutSettings, ...(c.checkoutSettings || {}) },
      visibilitySettings: { ...defaultForm.visibilitySettings, ...(c.visibilitySettings || {}) },
      displayDonorOffset: Math.max(0, Number((c as Campaign & { displayDonorOffset?: number }).displayDonorOffset ?? 0) || 0),
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
    if (stepId === "attributes" && !isAttributesSkippedMode(form.campaignMode) && form.attributes.length === 0) {
      toast.warning(
        "Add at least one donation attribute. Without it, this campaign will not show any payment options to donors."
      );
      return false;
    }
    if (stepId === "attributes" && hasDuplicateAttributeSortOrders(form.attributes)) {
      toast.warning("Each attribute must have a unique sort order. Adjust duplicate values before continuing.");
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
    if (!isAttributesSkippedMode(form.campaignMode) && form.attributes.length === 0) {
      toast.warning(
        "Add at least one donation attribute. Without it, this campaign will not show any payment options to donors."
      );
      return false;
    }
    if (hasDuplicateAttributeSortOrders(form.attributes)) {
      toast.warning("Each attribute must have a unique sort order. Adjust duplicate values before saving.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validateBeforeSave()) {
      if (!form.title.trim()) {
        toast.error("Title is required");
        setCurrentStepIndex(0);
      } else if (!isAttributesSkippedMode(form.campaignMode)) {
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
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Visibility</th>
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
                        {isAttributesSkippedMode(c.campaignMode || "standard")
                          ? "—"
                          : `${c.attributes?.length || 0} attribute${(c.attributes?.length || 0) !== 1 ? "s" : ""}`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {c.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          {c.isUrgent && <Zap className="h-4 w-4 text-orange-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <CampaignVisibilityCell
                          visibility={c.visibilitySettings}
                          published={c.status === "published"}
                          campaignMode={c.campaignMode || "standard"}
                        />
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
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No campaigns found</td>
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
                          m.value === "ramadan_split"
                            ? { ...DEFAULT_RAMADAN_CONFIG, ...(p.experienceConfig as RamadanSplitConfig) }
                            : {},
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

              {form.campaignMode === "ramadan_split" && (
                <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                  <h4 className="font-semibold text-sm">Ramadan Split settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Donors pick nights and optional weights on the public campaign page. Set start dates
                    for each global region — the site shows the right date based on donor location.
                  </p>
                  <RamadanStartDatesEditor
                    ramadanStartDate={ramadanConfig.ramadanStartDate}
                    startChoices={ramadanConfig.startChoices}
                    onChange={(next) =>
                      setForm((p) => ({
                        ...p,
                        experienceConfig: { ...ramadanConfig, ...next },
                      }))
                    }
                  />
                  <div className="space-y-2 max-w-xs">
                    <Label>Total Ramadan Nights</Label>
                    <select
                      value={ramadanConfig.maxNights === 29 ? 29 : 30}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceConfig: { ...ramadanConfig, maxNights: Number(e.target.value) },
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value={30}>30 days</option>
                      <option value={29}>29 days</option>
                    </select>
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
                  Each attribute is a donation option on the public campaign page. Use sort order (or the arrows) to
                  control which option appears first in the inline row — lower numbers are further left.
                </p>
              </div>
              <Button
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    attributes: [newAttribute(nextAttributeSortOrder(p.attributes)), ...p.attributes],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add Attribute
              </Button>
            </div>

            {form.attributes.length > 1 && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Donor page tab order (left → right)
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortCampaignAttributes(form.attributes).map((attr, i) => (
                    <span
                      key={attr.id}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border",
                        i === 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border"
                      )}
                    >
                      {i + 1}. {attr.name || `Option ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isAttributesSkippedMode(form.campaignMode) && form.attributes.length === 0 && (
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
              {sortCampaignAttributes(form.attributes).map((attr, ai) => {
                const conflicting = form.attributes.find(
                  (other) => other.id !== attr.id && other.sortOrder === attr.sortOrder
                );
                const duplicateSortOrder = Boolean(conflicting);
                return (
                <AttributeEditor
                  key={attr.id}
                  attribute={attr}
                  index={ai}
                  total={form.attributes.length}
                  duplicateSortOrder={duplicateSortOrder}
                  conflictingAttributeName={conflicting?.name}
                  onChange={(updated) =>
                    setForm((p) => ({
                      ...p,
                      attributes: p.attributes.map((a) => (a.id === updated.id ? updated : a)),
                    }))
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      attributes: p.attributes.filter((a) => a.id !== attr.id),
                    }))
                  }
                  onMoveUp={() =>
                    setForm((p) => {
                      const sorted = sortCampaignAttributes(p.attributes);
                      const curr = sorted[ai];
                      const prev = sorted[ai - 1];
                      if (!curr || !prev || ai === 0) return p;
                      return {
                        ...p,
                        attributes: swapAttributeSortOrders(p.attributes, curr.id, prev.id),
                      };
                    })
                  }
                  onMoveDown={() =>
                    setForm((p) => {
                      const sorted = sortCampaignAttributes(p.attributes);
                      const curr = sorted[ai];
                      const next = sorted[ai + 1];
                      if (!curr || !next || ai >= sorted.length - 1) return p;
                      return {
                        ...p,
                        attributes: swapAttributeSortOrders(p.attributes, curr.id, next.id),
                      };
                    })
                  }
                  onDuplicate={() =>
                    setForm((p) => ({
                      ...p,
                      attributes: [
                        {
                          ...attr,
                          id: uid(),
                          name: `${attr.name} (copy)`,
                          sortOrder: nextAttributeSortOrder(p.attributes),
                        },
                        ...p.attributes,
                      ],
                    }))
                  }
                />
              );
              })}
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
            <p className="text-sm text-muted-foreground">
              Configure what options donors see at checkout
              {isExperienceMode ? " after they add a Fidya/Kaffarah or Ramadan split gift to the cart" : ""}.
            </p>
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
              <SwitchRow
                label="Admin Saves Life"
                checked={form.checkoutSettings.enableAdminSavesLife}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    checkoutSettings: {
                      ...p.checkoutSettings,
                      enableAdminSavesLife: v,
                      adminSavesLifeAmount: v ? p.checkoutSettings.adminSavesLifeAmount : 0,
                    },
                  }))
                }
              />
              {form.checkoutSettings.enableAdminSavesLife && (
                <div className="ml-0 rounded-xl border border-border bg-secondary/20 p-4">
                  <Label htmlFor="admin-saves-life-amount" className="text-sm font-medium">
                    Set the amount
                  </Label>
                  <Input
                    id="admin-saves-life-amount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.checkoutSettings.adminSavesLifeAmount || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        checkoutSettings: {
                          ...p.checkoutSettings,
                          adminSavesLifeAmount: Math.max(0, Number(e.target.value) || 0),
                        },
                      }))
                    }
                    className="mt-2 h-10"
                    placeholder="0.00"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Donors see this as an optional checkbox at checkout; when selected, the amount is added to their donation.
                  </p>
                </div>
              )}
              <SwitchRow
                label="Push for recurring donation"
                description="Offer single-donation checkout visitors an optional recurring gift on a custom day interval."
                checked={form.checkoutSettings.enablePushRecurringDonation}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    checkoutSettings: {
                      ...p.checkoutSettings,
                      enablePushRecurringDonation: v,
                    },
                  }))
                }
              />
            </div>
          </div>
        )}

        {currentStepId === "upsells" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-lg">Checkout upsells</h3>
              <p className="text-sm text-muted-foreground">
                Choose upsells from your catalog to show when &ldquo;Enable upsell&rdquo; is on in checkout
                settings. Manage upsells in{" "}
                <a href="/admin/upsells" className="text-primary underline underline-offset-2">
                  Admin → Upsells
                </a>
                .
              </p>
            </div>
            {catalogUpsells.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No upsells in the catalog yet. Create some in Admin → Upsells first.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {catalogUpsells.map((item) => {
                  const selected = form.upsellIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setForm((p) => ({
                            ...p,
                            upsellIds: selected
                              ? p.upsellIds.filter((id) => id !== item.id)
                              : [...p.upsellIds, item.id],
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-primary rounded"
                      />
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.name}</span>
                        <span className="block text-sm font-bold text-accent tabular-nums mt-0.5">
                          £{Number(item.amount || 0).toFixed(2)}
                        </span>
                        {item.description?.trim() && (
                          <span className="mt-1 block text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </span>
                        )}
                        {!item.isActive && (
                          <span className="mt-1 inline-block text-[10px] uppercase text-amber-700">
                            Hidden in catalog
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {form.upsellIds.length === 0 && catalogUpsells.length > 0 && (
              <p className="text-center py-2 text-muted-foreground text-sm">
                No upsells selected for this campaign.
              </p>
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
              <div className="space-y-2">
                <Label htmlFor="display-donor-offset">Display donor count boost</Label>
                <Input
                  id="display-donor-offset"
                  type="number"
                  min={0}
                  step={1}
                  value={form.displayDonorOffset || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      displayDonorOffset: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="h-10"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Cosmetic only — shown on public campaign cards as this number plus real donations. Does not affect admin reports or analytics.
                </p>
              </div>
              <div className="space-y-3">
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
                {form.visibilitySettings.showInHeader && (
                  <div className="space-y-2 pl-0 sm:pl-1">
                    <Label htmlFor="header-display-name">Display name</Label>
                    <Input
                      id="header-display-name"
                      value={form.visibilitySettings.headerDisplayName ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          visibilitySettings: {
                            ...p.visibilitySettings,
                            headerDisplayName: e.target.value,
                          },
                        }))
                      }
                      placeholder={form.title.trim() || "Short nav label"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown in the header navigation instead of the campaign title.
                    </p>
                  </div>
                )}
              </div>
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
  duplicateSortOrder = false,
  conflictingAttributeName,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: {
  attribute: CampaignAttribute;
  index: number;
  total: number;
  duplicateSortOrder?: boolean;
  conflictingAttributeName?: string;
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

  function setPaymentType(type: "single" | "regular") {
    onChange({
      ...attribute,
      enableSinglePayment: type === "single",
      enableRegularPayment: type === "regular",
    });
  }

  function updatePresetAmounts(
    configKey: "singlePaymentConfig" | "regularPaymentConfig",
    presetAmounts: PresetAmount[]
  ) {
    update(configKey, { ...attribute[configKey], presetAmounts });
  }

  function updateCustomFieldOptions(fieldIndex: number, options: string[]) {
    const arr = [...attribute.customFields];
    arr[fieldIndex] = { ...arr[fieldIndex], options };
    update("customFields", arr);
  }

  function renderPresetAmountEditor(
    configKey: "singlePaymentConfig" | "regularPaymentConfig",
    config: SinglePaymentConfig | RegularPaymentConfig
  ) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Preset Amounts</Label>
        <p className="text-[11px] text-muted-foreground">
          Optional descriptions appear on the donation page under each amount (e.g. &ldquo;Cooked meals for a
          family&rdquo;).
        </p>
        <div className="space-y-2">
          {config.presetAmounts.map((preset, pi) => (
            <div key={pi} className="flex flex-wrap items-start gap-2 rounded-lg border px-2 py-2 bg-muted/30">
              <Input
                type="number"
                value={preset.amount}
                onChange={(e) => {
                  const arr = [...config.presetAmounts];
                  arr[pi] = { ...arr[pi], amount: Number(e.target.value) };
                  updatePresetAmounts(configKey, arr);
                }}
                className="h-8 w-24 text-xs"
                placeholder="Amount"
              />
              <Input
                value={preset.description ?? ""}
                onChange={(e) => {
                  const arr = [...config.presetAmounts];
                  arr[pi] = {
                    amount: arr[pi]?.amount ?? 0,
                    description: e.target.value || undefined,
                  };
                  updatePresetAmounts(configKey, arr);
                }}
                className="h-8 flex-1 min-w-[160px] text-xs"
                placeholder="Description (optional)"
              />
              <button
                type="button"
                onClick={() => {
                  updatePresetAmounts(
                    configKey,
                    config.presetAmounts.filter((_, i) => i !== pi)
                  );
                }}
                className="text-destructive hover:text-destructive/80 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() =>
            updatePresetAmounts(configKey, [...config.presetAmounts, { amount: 0 }])
          }
        >
          <Plus className="h-3 w-3 mr-1" /> Add amount
        </Button>
      </div>
    );
  }

  function renderPriceTypeConfig(
    configKey: "singlePaymentConfig" | "regularPaymentConfig",
    config: SinglePaymentConfig | RegularPaymentConfig,
    title: string
  ) {
    return (
      <div className="p-4 rounded-xl border space-y-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="space-y-2">
          <Label className="text-xs">Price Type</Label>
          <select
            value={config.priceType}
            onChange={(e) =>
              update(configKey, {
                ...config,
                priceType: e.target.value as SinglePaymentConfig["priceType"],
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="preset">Preset Only</option>
            <option value="custom">Custom Only</option>
            <option value="both">Both (Preset + Custom)</option>
          </select>
        </div>
        {(config.priceType === "preset" || config.priceType === "both") &&
          renderPresetAmountEditor(configKey, config)}
        {(config.priceType === "custom" || config.priceType === "both") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Min Amount</Label>
              <Input
                type="number"
                value={config.minAmount}
                onChange={(e) =>
                  update(configKey, { ...config, minAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Amount</Label>
              <Input
                type="number"
                value={config.maxAmount}
                onChange={(e) =>
                  update(configKey, { ...config, maxAmount: Number(e.target.value) })
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  function updateRecurrence(patch: Partial<RecurrenceConfig>) {
    update("regularPaymentConfig", {
      ...attribute.regularPaymentConfig,
      recurrence: { ...attribute.regularPaymentConfig.recurrence, ...patch },
    });
  }

  const paymentType = attribute.enableRegularPayment ? "regular" : "single";

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 p-4">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 text-left min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">
              {attribute.name || `Attribute ${index + 1}`}
            </span>
            <Badge variant="outline" className="text-[10px] font-normal shrink-0">
              Position {index + 1} of {total}
              {index === 0 ? " · first on site" : index === total - 1 ? " · last on site" : ""}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
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
              <Label className="text-xs">Display position</Label>
              <Input
                type="number"
                min={1}
                max={total}
                value={attribute.sortOrder + 1}
                onChange={(e) => {
                  const position = Math.max(1, Math.min(total, Number(e.target.value) || 1));
                  update("sortOrder", position - 1);
                }}
                className={duplicateSortOrder ? "border-destructive focus-visible:ring-destructive" : undefined}
              />
              <p className="text-[11px] text-muted-foreground">
                1 = leftmost tab on the donation page. Use the arrows above or change this number.
              </p>
              {duplicateSortOrder && (
                <p className="text-xs text-destructive">
                  Position {attribute.sortOrder + 1} is already used by &ldquo;{conflictingAttributeName || "another attribute"}&rdquo;. Choose a different number or use the arrows.
                </p>
              )}
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

          {/* Payment type — single or regular (mutually exclusive) */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/30">
            <Label className="text-xs font-medium">Payment type</Label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`payment-type-${attribute.id}`}
                  checked={paymentType === "single"}
                  onChange={() => setPaymentType("single")}
                  className="h-4 w-4 accent-primary"
                />
                Single payment
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`payment-type-${attribute.id}`}
                  checked={paymentType === "regular"}
                  onChange={() => setPaymentType("regular")}
                  className="h-4 w-4 accent-primary"
                />
                Regular payment
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-border/60">
              <input
                type="checkbox"
                checked={attribute.enableQuantity}
                onChange={(e) => update("enableQuantity", e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary"
              />
              Enable quantity selector
            </label>
          </div>

          {paymentType === "single" &&
            renderPriceTypeConfig(
              "singlePaymentConfig",
              attribute.singlePaymentConfig,
              "Single Payment Configuration"
            )}

          {paymentType === "regular" && (
            <>
              {renderPriceTypeConfig(
                "regularPaymentConfig",
                attribute.regularPaymentConfig,
                "Regular Payment Configuration"
              )}

              <div className="p-4 rounded-xl border space-y-4">
                <h4 className="text-sm font-semibold">Recurring schedule</h4>
                <div className="space-y-2">
                  <Label className="text-xs">Users will pay every</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={attribute.regularPaymentConfig.recurrence.intervalCount}
                      onChange={(e) =>
                        updateRecurrence({ intervalCount: Math.max(1, Number(e.target.value)) })
                      }
                      className="h-9 w-20"
                    />
                    <select
                      value={attribute.regularPaymentConfig.recurrence.intervalUnit}
                      onChange={(e) =>
                        updateRecurrence({
                          intervalUnit: e.target.value as RecurrenceConfig["intervalUnit"],
                        })
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="day">day(s)</option>
                      <option value="week">week(s)</option>
                      <option value="month">month(s)</option>
                      <option value="year">year(s)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Set the length of each recurring subscription period to daily, weekly, monthly or
                    annually.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Subscription ends</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`sub-end-${attribute.id}`}
                        checked={
                          attribute.regularPaymentConfig.recurrence.durationType === "never_ends"
                        }
                        onChange={() => updateRecurrence({ durationType: "never_ends", endDate: undefined })}
                        className="h-4 w-4 accent-primary"
                      />
                      Never
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`sub-end-${attribute.id}`}
                        checked={
                          attribute.regularPaymentConfig.recurrence.durationType === "end_date"
                        }
                        onChange={() => updateRecurrence({ durationType: "end_date" })}
                        className="h-4 w-4 accent-primary"
                      />
                      Set an end time
                    </label>
                  </div>
                  {attribute.regularPaymentConfig.recurrence.durationType === "end_date" && (
                    <Input
                      type="datetime-local"
                      value={toDatetimeLocalValue(
                        attribute.regularPaymentConfig.recurrence.endDate ?? ""
                      )}
                      onChange={(e) =>
                        updateRecurrence({ endDate: fromDatetimeLocalValue(e.target.value) })
                      }
                      className="h-9 max-w-xs"
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Choose if the subscription has an end time or not.
                  </p>
                </div>
              </div>
            </>
          )}

          {attribute.enableQuantity && (
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
                  <div className="space-y-2 ml-2">
                    <Label className="text-[10px]">Options</Label>
                    <div className="space-y-2">
                      {cf.options.map((option, oi) => (
                        <div
                          key={oi}
                          className="flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-muted/30"
                        >
                          <Input
                            value={option}
                            onChange={(e) => {
                              const options = [...cf.options];
                              options[oi] = e.target.value;
                              updateCustomFieldOptions(fi, options);
                            }}
                            className="h-7 flex-1 text-xs"
                            placeholder={`Option ${oi + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateCustomFieldOptions(
                                fi,
                                cf.options.filter((_, i) => i !== oi)
                              )
                            }
                            className="text-destructive hover:text-destructive/80 p-1 shrink-0"
                            aria-label={`Remove option ${oi + 1}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => updateCustomFieldOptions(fi, [...cf.options, ""])}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add option
                    </Button>
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

function CampaignVisibilityCell({
  visibility,
  published,
  campaignMode,
}: {
  visibility?: VisibilitySettings;
  published: boolean;
  campaignMode: CampaignMode | string;
}) {
  const vs = visibility ?? { showInHeader: false, showOnHomepage: false, pinToTop: false };
  const homepageLabel =
    campaignMode === "fundraiser" ? "Live Fundraisers" : "Our Appeals";

  const items = [
    {
      key: "header",
      on: vs.showInHeader,
      label: "Header",
      title: "Show in Header Navigation — top site menu",
    },
    {
      key: "homepage",
      on: vs.showOnHomepage,
      label: "Homepage",
      title: `Show on Homepage — ${homepageLabel} section`,
    },
    {
      key: "pinned",
      on: vs.pinToTop,
      label: "Pinned",
      title: "Pin to Top — sorted first on homepage and /campaigns",
    },
  ];

  const active = items.filter((i) => i.on);

  if (active.length === 0) {
    return <span className="text-xs text-muted-foreground">Not visible</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {active.map((item) => (
        <span
          key={item.key}
          title={`${item.title}${published ? "" : " (requires published status)"}`}
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            published
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground border border-dashed border-border"
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

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
