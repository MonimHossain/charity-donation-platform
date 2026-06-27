import axios from "axios";
import { canSendAdminTokenToApi } from "@/lib/admin-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Normalized path after base URL, e.g. `/admin/profile` */
function getRequestApiPath(url: string | undefined): string {
  if (!url) return "";
  try {
    if (url.startsWith("http")) {
      const path = new URL(url).pathname;
      return path.replace(/^\/api\/v1/, "") || path;
    }
  } catch {
    /* ignore */
  }
  return url.startsWith("/") ? url : `/${url}`;
}

function setBearerToken(config: { headers: unknown }, token: string) {
  const headers = config.headers as Record<string, string> & {
    set?: (key: string, value: string) => void;
  };
  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.Authorization = `Bearer ${token}`;
  }
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const apiPath = getRequestApiPath(config.url);
    const isAdminRoute =
      apiPath.startsWith("/admin") &&
      !apiPath.startsWith("/admin/login") &&
      !apiPath.startsWith("/admin/logout");
    const isUserRoute =
      apiPath.startsWith("/auth/") ||
      apiPath.startsWith("/my/") ||
      apiPath.startsWith("/recurring/my") ||
      apiPath.startsWith("/zakat/history") ||
      apiPath.startsWith("/automated-donations/my") ||
      apiPath.startsWith("/payments/stripe/customer-session");

    const adminToken = localStorage.getItem("admin_token");
    const apiAdminToken = canSendAdminTokenToApi(adminToken) ? adminToken : null;

    if (isAdminRoute) {
      if (apiAdminToken) setBearerToken(config, apiAdminToken);
    } else {
      const userToken = localStorage.getItem("user_token");
      if (userToken && userToken !== "demo-token") {
        setBearerToken(config, userToken);
      } else if (isUserRoute) {
        /* unauthenticated user route — no token */
      } else if (apiAdminToken) {
        setBearerToken(config, apiAdminToken);
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not clear admin_token here — any failed admin API call (stats, etc.)
    // would log the user out. Auth is handled in admin/layout.tsx only.
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/account")
    ) {
      localStorage.removeItem("user_token");
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ═══════════════════════════════════
// PUBLIC - CAMPAIGNS
// ═══════════════════════════════════
export async function fetchCampaigns(params?: Record<string, string>) {
  const { data } = await api.get("/campaigns", { params });
  return data;
}

export async function fetchCampaignBySlug(slug: string) {
  const { data } = await api.get(`/campaigns/${slug}`);
  return data;
}

// ═══════════════════════════════════
// PUBLIC - DONATIONS
// ═══════════════════════════════════
export async function createDonation(payload: Record<string, unknown>) {
  const { data } = await api.post("/donations", payload);
  return data;
}

export async function fetchRecentDonations() {
  const { data } = await api.get("/donations/recent");
  return data;
}

export async function fetchDonationReceipt(id: string) {
  const { data } = await api.get(`/donations/${id}/receipt`);
  return data;
}

// ═══════════════════════════════════
// PUBLIC - CMS
// ═══════════════════════════════════
export async function fetchHeroSlides() {
  const { data } = await api.get("/cms/hero-slides");
  return data;
}

export async function fetchHomepageSections() {
  const { data } = await api.get("/cms/homepage-sections");
  return data;
}

export async function fetchSiteSettings() {
  const { data } = await api.get("/cms/settings");
  return data;
}

export async function fetchDonationPresets() {
  const { data } = await api.get("/cms/donation-presets");
  return data;
}

export async function fetchQuickDonateConfig() {
  const { data } = await api.get("/cms/quick-donate");
  return data;
}

export async function fetchPrayerTimes(params: Record<string, string>) {
  const { data } = await api.get("/prayer-times", { params });
  return data;
}

export async function fetchAdminQuickDonateOptions() {
  const { data } = await api.get("/admin/quick-donate/options");
  return data;
}

export async function createAdminQuickDonateOption(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/quick-donate/options", payload);
  return data;
}

export async function updateAdminQuickDonateOption(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/quick-donate/options/${id}`, payload);
  return data;
}

export async function deleteAdminQuickDonateOption(id: string) {
  const { data } = await api.delete(`/admin/quick-donate/options/${id}`);
  return data;
}

export async function fetchAdminQuickDonateSettings() {
  const { data } = await api.get("/admin/quick-donate/settings");
  return data;
}

export async function updateAdminQuickDonateSettings(payload: Record<string, unknown>) {
  const { data } = await api.put("/admin/quick-donate/settings", payload);
  return data;
}

export async function fetchTestimonials() {
  const { data } = await api.get("/cms/testimonials");
  return data;
}

export async function fetchNavigationMenus(location?: string) {
  const { data } = await api.get("/cms/navigation", { params: location ? { location } : {} });
  return data;
}

export async function fetchBanners(type?: string) {
  const { data } = await api.get("/cms/banners", { params: type ? { type } : {} });
  return data;
}

export async function fetchFaqs(category?: string) {
  const { data } = await api.get("/cms/faqs", { params: category ? { category } : {} });
  return data;
}

export async function fetchSeoSettings(pagePath: string) {
  const { data } = await api.get("/cms/seo", { params: { pagePath } });
  return data;
}

export async function fetchPageBlocks(pageType: string, pageId?: string) {
  const { data } = await api.get("/cms/page-blocks", { params: { pageType, pageId } });
  return data;
}

export async function fetchTranslations(entityType: string, entityId: string, language: string) {
  const { data } = await api.get("/cms/translations", { params: { entityType, entityId, language } });
  return data;
}

// ═══════════════════════════════════
// PUBLIC - BLOG
// ═══════════════════════════════════
export async function fetchBlogPosts(params?: Record<string, string>) {
  const { data } = await api.get("/blog", { params });
  return data;
}

export async function fetchBlogPostBySlug(slug: string) {
  const { data } = await api.get(`/blog/${slug}`);
  return data;
}

export async function fetchBlogCategories() {
  const { data } = await api.get("/blog/categories");
  return data;
}

export async function fetchAdminBlogCategories() {
  const { data } = await api.get("/admin/blog/categories");
  return data.items || data || [];
}

// ═══════════════════════════════════
// PUBLIC - NEWSLETTER
// ═══════════════════════════════════
export async function subscribeNewsletter(email: string, name?: string) {
  const { data } = await api.post("/newsletter/subscribe", { email, name });
  return data;
}

// ═══════════════════════════════════
// USER AUTH
// ═══════════════════════════════════
export async function userRegister(payload: { fullName: string; email: string; password: string; phone?: string; marketingConsent?: boolean; smsConsent?: boolean }) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function userLogin(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function userLogout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function fetchUserProfile() {
  const { data } = await api.get("/auth/profile");
  return data;
}

export async function updateUserProfile(payload: Record<string, unknown>) {
  const { data } = await api.put("/auth/profile", payload);
  return data;
}

export async function changeUserPassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
  return data;
}

export type DonorEmailStatus = "new" | "password" | "google" | "needs_password_setup";

export async function checkDonorEmail(email: string): Promise<{ status: DonorEmailStatus }> {
  const { data } = await api.post("/auth/donor/check-email", { email });
  return data;
}

export async function requestDonorAccess(email: string, fullName?: string) {
  const { data } = await api.post("/auth/donor/request-access", { email, fullName });
  return data as { message: string };
}

export async function activateAccount(token: string, password: string) {
  const { data } = await api.post("/auth/activate-account", { token, password });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data as { message: string };
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await api.post("/auth/reset-password", { token, newPassword });
  return data as { message: string };
}

export async function fetchUserDonations(params?: Record<string, string>) {
  const { data } = await api.get("/my/donations", { params });
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (Array.isArray(data?.items)) return data;
  return { items: [], total: 0 };
}

// ═══════════════════════════════════
// RECURRING DONATIONS
// ═══════════════════════════════════
export async function fetchUserRecurringDonations() {
  const { data } = await api.get("/recurring/my");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function createRecurringDonation(payload: Record<string, unknown>) {
  const { data } = await api.post("/recurring", payload);
  return data;
}

export async function pauseRecurringDonation(id: string) {
  const { data } = await api.put(`/recurring/${id}/pause`);
  return data;
}

export async function resumeRecurringDonation(id: string) {
  const { data } = await api.put(`/recurring/${id}/resume`);
  return data;
}

export async function cancelRecurringDonation(id: string) {
  const { data } = await api.put(`/recurring/${id}/cancel`);
  return data;
}

export async function createRecurringBillingPortal(id: string) {
  const { data } = await api.post(`/recurring/${id}/billing-portal`);
  return data as { url: string };
}

// ═══════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════
export async function createStripePaymentIntent(payload: {
  amount: number;
  currency: string;
  donationId?: string;
  automatedScheduleId?: string;
  automatedScheduleIds?: string[];
  donorEmail?: string;
  donorName?: string;
  metadata?: Record<string, string>;
}) {
  const { data } = await api.post("/payments/stripe/create-intent", payload);
  return data as { clientSecret: string; paymentIntentId: string };
}

export async function createStripeSetupIntent(payload: {
  automatedScheduleId: string;
  automatedScheduleIds?: string[];
  donationId?: string;
  currency?: string;
}) {
  const { data } = await api.post("/payments/stripe/create-setup-intent", payload);
  return data as { clientSecret: string; setupIntentId: string; customerId: string };
}

export async function confirmStripeSetup(payload: {
  setupIntentId: string;
  automatedScheduleId?: string;
  automatedScheduleIds?: string[];
  donationId?: string;
}) {
  const { data } = await api.post("/payments/stripe/confirm-setup", payload);
  return data as {
    status: string;
    automatedScheduleId?: string;
    donationId?: string;
    setupIntentId?: string;
    token?: string;
    user?: { id: string; email: string; fullName?: string; name?: string };
  };
}

export async function fetchStripeCustomerSession() {
  const { data } = await api.get("/payments/stripe/customer-session");
  return data as { customerId: string; customerSessionClientSecret: string };
}

export async function confirmStripePayment(payload: {
  paymentIntentId: string;
  donationId?: string;
  recurringDonationId?: string;
  subscriptionId?: string;
}) {
  const { data } = await api.post("/payments/stripe/confirm", payload);
  return data as {
    status: string;
    donationId?: string;
    recurringDonationId?: string;
    subscriptionId?: string;
    paymentIntentId?: string;
    token?: string;
    user?: { id: string; email: string; fullName?: string; name?: string };
  };
}

export async function createStripeSubscriptionCheckout(payload: {
  amount: number;
  currency: string;
  frequency: string;
  interval?: string;
  intervalCount?: number;
  cancelAt?: number;
  donorEmail: string;
  donorName: string;
  recurringDonationId?: string;
  donationId?: string;
  campaignId?: string;
}) {
  const { data } = await api.post("/payments/stripe/create-subscription-checkout", payload);
  return data as {
    clientSecret: string;
    paymentIntentId: string;
    subscriptionId: string;
    customerId: string;
  };
}

export async function createStripeSubscription(payload: Record<string, unknown>) {
  const { data } = await api.post("/payments/stripe/create-subscription", payload);
  return data;
}

export async function createPayPalOrder(payload: { amount: number; currency: string }) {
  const { data } = await api.post("/payments/paypal/create-order", payload);
  return data;
}

export async function capturePayPalOrder(payload: { orderId: string; donationId?: string }) {
  const { data } = await api.post("/payments/paypal/capture-order", payload);
  return data;
}

export async function fetchPaymentsConfig() {
  const { data } = await api.get("/payments/config");
  return data as {
    providers: Array<{ id: string; enabled: boolean; configured: boolean; publicKey?: string }>;
    defaultCurrency: string;
    minimumDonation: number;
    availableProviders: string[];
  };
}

export async function fetchCampaignPaymentsConfig(campaignGateways: string[]) {
  const { data } = await api.get("/payments/config/campaign", {
    params: { gateways: campaignGateways.join(",") },
  });
  return data as {
    providers: Array<{ id: string; enabled: boolean; configured: boolean; publicKey?: string }>;
    availableProviders: string[];
  };
}

export async function getDonationStatus(donationId: string) {
  const { data } = await api.get(`/donations/${donationId}/status`);
  return data as {
    id: string;
    status: string;
    amount?: number;
    totalAmount: number;
    currency: string;
    receiptNumber?: string;
    frequency?: string;
    giftAid?: boolean;
    donationType?: string;
    paymentMethod?: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
    campaignSlug?: string;
    campaignTitle?: string;
    category?: string;
    campaignMode?: string;
  };
}

export async function initTelrPayment(payload: {
  donationId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const { data } = await api.post("/payments/telr/init", payload);
  return data as { redirectUrl: string; orderRef: string };
}

export async function initPayTabsPayment(payload: {
  donationId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
}) {
  const { data } = await api.post("/payments/paytabs/init", payload);
  return data as { redirectUrl: string; transactionRef: string };
}

// ═══════════════════════════════════
// ZAKAT CALCULATOR
// ═══════════════════════════════════
export async function calculateZakat(payload: Record<string, unknown>) {
  const { data } = await api.post("/zakat/calculate", payload);
  return data;
}

export async function fetchZakatMetalPrices(currency = "GBP") {
  const { data } = await api.get("/zakat/metal-prices", { params: { currency } });
  return data;
}

export async function saveZakatCalculation(payload: Record<string, unknown>) {
  const { data } = await api.post("/zakat/save", payload);
  return data;
}

export async function fetchZakatHistory() {
  const { data } = await api.get("/zakat/history");
  return data;
}

export type ZakatPageContent = {
  id?: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  introHtml: string;
  featureCardsHeading: string;
  featureCards: Array<{ title: string; description: string }>;
  contentBelowHtml: string;
  showQuote: boolean;
  status: "draft" | "published";
  updatedAt?: string;
};

export async function fetchZakatPageContent() {
  const { data } = await api.get("/cms/zakat-page");
  return data as ZakatPageContent;
}

export async function fetchAdminZakatPageContent() {
  const { data } = await api.get("/admin/cms/zakat-page");
  return data as ZakatPageContent;
}

export async function updateZakatPageContent(payload: Partial<ZakatPageContent>) {
  const { data } = await api.put("/admin/cms/zakat-page", payload);
  return data as ZakatPageContent;
}

// ═══════════════════════════════════
// AUTOMATED DONATIONS
// ═══════════════════════════════════
export async function createAutomatedSchedule(payload: Record<string, unknown>) {
  const { data } = await api.post("/automated-donations", payload);
  return data;
}

export async function fetchMyAutomatedSchedules() {
  const { data } = await api.get("/automated-donations/my");
  if (Array.isArray(data?.items)) return data;
  if (Array.isArray(data)) return { items: data };
  return { items: [] };
}

export async function cancelAutomatedSchedule(id: string) {
  const { data } = await api.put(`/automated-donations/${id}/cancel`);
  return data;
}

export async function fetchAdminAutomatedSchedules(params?: Record<string, string>) {
  const { data } = await api.get("/admin/automated-donations", { params });
  return data;
}

export async function fetchAdminAutomatedScheduleById(id: string) {
  const { data } = await api.get(`/admin/automated-donations/${id}`);
  return data;
}

export async function fetchMyAutomatedScheduleById(id: string) {
  const { data } = await api.get(`/automated-donations/my/${id}`);
  return data;
}

// ═══════════════════════════════════
// ACTIVITY TRACKING
// ═══════════════════════════════════
export async function trackActivity(payload: { type: string; page?: string; metadata?: Record<string, unknown> }) {
  try {
    await api.post("/track", payload);
  } catch {
    // silently fail tracking
  }
}

// ═══════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════
export async function adminLogin(email: string, password: string) {
  const { data } = await api.post("/admin/login", { email, password });
  return data;
}

export async function adminLogout() {
  const { data } = await api.post("/admin/logout");
  return data;
}

export async function fetchAdminProfile() {
  const { data } = await api.get("/admin/profile");
  return data;
}

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put("/admin/profile/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

// ═══════════════════════════════════
// ADMIN DONATIONS
// ═══════════════════════════════════
export async function fetchAdminDonations(params?: Record<string, string>) {
  const { data } = await api.get("/admin/donations", { params });
  return data;
}

export async function fetchAdminDonationById(id: string) {
  const { data } = await api.get(`/admin/donations/${id}`);
  return data;
}

export async function fetchAdminPaymentLogs(params?: Record<string, string>) {
  const { data } = await api.get("/admin/payment-logs", { params });
  return data;
}

export async function fetchUserDonationById(id: string) {
  const { data } = await api.get(`/my/donations/${id}`);
  return data;
}

export async function fetchDonationStats() {
  const { data } = await api.get("/admin/donations/stats");
  return data;
}

export async function refundDonation(id: string) {
  const { data } = await api.put(`/admin/donations/${id}/refund`);
  return data;
}

// ═══════════════════════════════════
// ADMIN CAMPAIGNS
// ═══════════════════════════════════
export async function fetchAdminCampaigns(params?: Record<string, string>) {
  const { data } = await api.get("/admin/campaigns", { params });
  return data;
}

export async function fetchAdminCampaignById(id: string) {
  const { data } = await api.get(`/admin/campaigns/${id}`);
  return data;
}

export async function adminCreateCampaign(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/campaigns", payload);
  return data;
}

export async function adminUpdateCampaign(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/campaigns/${id}`, payload);
  return data;
}

export async function adminDeleteCampaign(id: string) {
  const { data } = await api.delete(`/admin/campaigns/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN UPSELLS
// ═══════════════════════════════════
export async function fetchAdminUpsells() {
  const { data } = await api.get("/admin/upsells");
  return data as { items: Array<Record<string, unknown>> };
}

export async function adminCreateUpsell(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/upsells", payload);
  return data;
}

export async function adminUpdateUpsell(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/upsells/${id}`, payload);
  return data;
}

export async function adminDeleteUpsell(id: string) {
  const { data } = await api.delete(`/admin/upsells/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN CMS
// ═══════════════════════════════════
export async function adminCreateHeroSlide(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/cms/hero-slides", payload);
  return data;
}

export async function adminUpdateHeroSlide(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/hero-slides/${id}`, payload);
  return data;
}

export async function adminDeleteHeroSlide(id: string) {
  const { data } = await api.delete(`/admin/cms/hero-slides/${id}`);
  return data;
}

export async function adminUpdateHomepageSection(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/homepage-sections/${id}`, payload);
  return data;
}

export async function adminReorderSections(sections: Array<{ id: string; sortOrder: number }>) {
  const { data } = await api.post("/admin/cms/homepage-sections/reorder", { sections });
  return data;
}

export async function adminUpdateSiteSettings(payload: Record<string, unknown>) {
  const { data } = await api.put("/admin/cms/settings", payload);
  return data;
}

export async function adminUpdateDonationPreset(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/donation-presets/${id}`, payload);
  return data;
}

// Admin CMS Extended
export async function adminCreateNavigationMenu(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/cms/navigation", payload);
  return data;
}

export async function adminUpdateNavigationMenu(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/navigation/${id}`, payload);
  return data;
}

export async function adminDeleteNavigationMenu(id: string) {
  const { data } = await api.delete(`/admin/cms/navigation/${id}`);
  return data;
}

export async function adminCreateBanner(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/cms/banners", payload);
  return data;
}

export async function adminUpdateBanner(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/banners/${id}`, payload);
  return data;
}

export async function adminDeleteBanner(id: string) {
  const { data } = await api.delete(`/admin/cms/banners/${id}`);
  return data;
}

export async function adminCreateFaq(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/cms/faqs", payload);
  return data;
}

export async function adminUpdateFaq(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/faqs/${id}`, payload);
  return data;
}

export async function adminDeleteFaq(id: string) {
  const { data } = await api.delete(`/admin/cms/faqs/${id}`);
  return data;
}

export async function adminUpsertSeoSettings(payload: Record<string, unknown>) {
  const { data } = await api.put("/admin/cms/seo", payload);
  return data;
}

export async function adminCreatePageBlock(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/cms/page-blocks", payload);
  return data;
}

export async function adminUpdatePageBlock(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/cms/page-blocks/${id}`, payload);
  return data;
}

export async function adminDeletePageBlock(id: string) {
  const { data } = await api.delete(`/admin/cms/page-blocks/${id}`);
  return data;
}

export async function adminReorderPageBlocks(items: Array<{ id: string; sortOrder: number }>) {
  const { data } = await api.post("/admin/cms/page-blocks/reorder", { items });
  return data;
}

export async function adminUpsertTranslation(payload: Record<string, unknown>) {
  const { data } = await api.put("/admin/cms/translations", payload);
  return data;
}

export async function fetchAdminMedia(params?: Record<string, string>) {
  const { data } = await api.get("/admin/cms/media", { params });
  return data;
}

export async function adminDeleteMedia(id: string) {
  const { data } = await api.delete(`/admin/cms/media/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN BLOG
// ═══════════════════════════════════
export async function fetchAdminBlogPosts(params?: Record<string, string>) {
  const { data } = await api.get("/admin/blog", { params });
  return data;
}

export async function fetchAdminBlogPost(id: string) {
  const { data } = await api.get(`/admin/blog/${id}`);
  return data;
}

export async function adminCreateBlogPost(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/blog", payload);
  return data;
}

export async function adminUpdateBlogPost(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/blog/${id}`, payload);
  return data;
}

export async function adminDeleteBlogPost(id: string) {
  const { data } = await api.delete(`/admin/blog/${id}`);
  return data;
}

export async function adminCreateBlogCategory(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/blog/categories", payload);
  return data;
}

export async function adminUpdateBlogCategory(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/blog/categories/${id}`, payload);
  return data;
}

export async function adminDeleteBlogCategory(id: string) {
  const { data } = await api.delete(`/admin/blog/categories/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN RECURRING
// ═══════════════════════════════════
export async function fetchAdminRecurring(params?: Record<string, string>) {
  const { data } = await api.get("/admin/recurring", { params });
  return data;
}

// ═══════════════════════════════════
// ADMIN USERS
// ═══════════════════════════════════
export async function fetchAdminUsers(params?: Record<string, string | number | boolean | undefined>) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function adminDeactivateUser(id: string) {
  const { data } = await api.put(`/admin/users/${id}/deactivate`);
  return data;
}

// ═══════════════════════════════════
// ADMIN ANALYTICS
// ═══════════════════════════════════
export async function fetchAnalyticsDashboard(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/dashboard", { params });
  return data;
}

export async function fetchAnalyticsCampaigns(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/campaigns", { params });
  return data;
}

export async function fetchAnalyticsRevenue(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/revenue", { params });
  return data;
}

export async function fetchAnalyticsDonors(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/donors", { params });
  return data;
}

export async function fetchAnalyticsGiftAid(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/gift-aid", { params });
  return data;
}

export async function fetchCampaignReport() {
  const { data } = await api.get("/admin/analytics/campaigns");
  return data;
}

export async function fetchRecurringReport() {
  const { data } = await api.get("/admin/analytics/recurring");
  return data;
}

export async function fetchDonorReport() {
  const { data } = await api.get("/admin/analytics/donors");
  return data;
}

export async function fetchRevenueReport(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/revenue", { params });
  return data;
}

export async function fetchGiftAidReport() {
  const { data } = await api.get("/admin/analytics/gift-aid");
  return data;
}

export async function exportDonations(params?: Record<string, string>) {
  const { data } = await api.get("/admin/analytics/export/donations", { params, responseType: "blob" as any });
  return data;
}

// ═══════════════════════════════════
// ADMIN ACTIVITY / AUDIT LOGS
// ═══════════════════════════════════
export async function fetchActivityLogs(params?: Record<string, string>) {
  const { data } = await api.get("/admin/audit-logs", { params });
  return data;
}

export async function fetchAuditLogs(params?: Record<string, string>) {
  const { data } = await api.get("/admin/audit-logs", { params });
  return data;
}

// ═══════════════════════════════════
// ADMIN NEWSLETTER
// ═══════════════════════════════════
export async function fetchNewsletterSubscribers() {
  const { data } = await api.get("/admin/newsletter/subscribers");
  return data;
}

// ═══════════════════════════════════
// PUBLIC - CHARITIES (ICCA)
// ═══════════════════════════════════
export async function fetchPublicCharities(params?: Record<string, string>) {
  const { data } = await api.get("/public/charities", { params });
  return data;
}

export async function fetchCharityBySlug(slug: string) {
  const { data } = await api.get(`/public/charities/${slug}`);
  return data;
}

export async function fetchFeaturedCharities() {
  const { data } = await api.get("/public/featured-charities");
  return data;
}

export async function fetchPublicStats() {
  const { data } = await api.get("/public/stats");
  return data;
}

export async function verifyPublicCertification(params: { certificateId?: string; charityName?: string }) {
  const { data } = await api.get("/public/verify", { params });
  return data;
}

export async function verifyPublicCertificationById(certificateId: string) {
  const { data } = await api.get(`/public/verify/${certificateId}`);
  return data;
}

export async function submitPublicContactMessage(payload: { name: string; email: string; subject: string; message: string }) {
  const { data } = await api.post("/public/contact-messages", payload);
  return data;
}

export async function submitPublicConcernReport(payload: Record<string, unknown>) {
  const { data } = await api.post("/public/concerns", payload);
  return data;
}

export async function submitPublicApplyReview(payload: Record<string, unknown>) {
  const { data } = await api.post("/public/apply-review", payload);
  return data;
}

export async function fetchPublicExperts() {
  const { data } = await api.get("/public/experts");
  return data;
}

// ═══════════════════════════════════
// ADMIN - CHARITIES MANAGEMENT
// ═══════════════════════════════════
export async function fetchAdminCharities(params?: Record<string, string>) {
  const { data } = await api.get("/admin/charities", { params });
  return data;
}

export async function fetchAdminCharityById(id: number) {
  const { data } = await api.get(`/admin/charities/${id}`);
  return data;
}

export async function createAdminCharity(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/charities", payload);
  return data;
}

export async function updateAdminCharity(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/charities/${id}`, payload);
  return data;
}

export async function deleteAdminCharity(id: number) {
  const { data } = await api.delete(`/admin/charities/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - CERTIFICATIONS
// ═══════════════════════════════════
export async function fetchAdminCertifications(params?: Record<string, string>) {
  const { data } = await api.get("/admin/certifications", { params });
  return data;
}

export async function fetchAdminCertificationById(id: number) {
  const { data } = await api.get(`/admin/certifications/${id}`);
  return data;
}

export async function createAdminCertification(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/certifications", payload);
  return data;
}

export async function updateAdminCertification(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/certifications/${id}`, payload);
  return data;
}

export async function renewAdminCertification(id: number, payload: Record<string, unknown>) {
  const { data } = await api.post(`/admin/certifications/${id}/renew`, payload);
  return data;
}

export async function deleteAdminCertification(id: number) {
  const { data } = await api.delete(`/admin/certifications/${id}`);
  return data;
}

export async function toggleAdminCertificationBadge(id: number) {
  const { data } = await api.post(`/admin/certifications/${id}/toggle-badge`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - EXPERTS
// ═══════════════════════════════════
export async function fetchAdminExperts(params?: Record<string, string>) {
  const { data } = await api.get("/admin/experts", { params });
  return data;
}

export async function fetchAdminExpertById(id: number) {
  const { data } = await api.get(`/admin/experts/${id}`);
  return data;
}

export async function createAdminExpert(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/experts", payload);
  return data;
}

export async function updateAdminExpert(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/experts/${id}`, payload);
  return data;
}

export async function deleteAdminExpert(id: number) {
  const { data } = await api.delete(`/admin/experts/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - REPORTS
// ═══════════════════════════════════
export async function fetchAdminReports(params?: Record<string, string>) {
  const { data } = await api.get("/admin/reports", { params });
  return data;
}

export async function fetchAdminReportById(id: number) {
  const { data } = await api.get(`/admin/reports/${id}`);
  return data;
}

export async function createAdminReport(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/reports", payload);
  return data;
}

export async function updateAdminReport(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/reports/${id}`, payload);
  return data;
}

export async function deleteAdminReport(id: number) {
  const { data } = await api.delete(`/admin/reports/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - CONCERNS
// ═══════════════════════════════════
export async function fetchAdminConcerns(params?: Record<string, string>) {
  const { data } = await api.get("/admin/concerns", { params });
  return data;
}

export async function updateAdminConcern(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/concerns/${id}`, payload);
  return data;
}

export async function deleteAdminConcern(id: number) {
  const { data } = await api.delete(`/admin/concerns/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - CONTACT MESSAGES
// ═══════════════════════════════════
export async function fetchAdminContactMessages(params?: Record<string, string>) {
  const { data } = await api.get("/admin/contact-messages", { params });
  return data;
}

export async function updateAdminContactMessage(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/contact-messages/${id}`, payload);
  return data;
}

export async function deleteAdminContactMessage(id: number) {
  const { data } = await api.delete(`/admin/contact-messages/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - APPLICATIONS / APPLY-REVIEW
// ═══════════════════════════════════
export async function fetchAdminApplications(params?: Record<string, string>) {
  const { data } = await api.get("/admin/apply-review", { params });
  return data;
}

export async function updateAdminApplication(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/apply-review/${id}`, payload);
  return data;
}

export async function deleteAdminApplication(id: number) {
  const { data } = await api.delete(`/admin/apply-review/${id}`);
  return data;
}

// ═══════════════════════════════════
// ADMIN - IAM (ROLES, USERS, PERMISSIONS)
// ═══════════════════════════════════
export async function fetchAdminRoles(params?: Record<string, string | number | boolean | undefined>) {
  const { data } = await api.get("/admin/roles", { params });
  return data;
}

export async function createAdminRole(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/roles", payload);
  return data;
}

export async function updateAdminRole(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/roles/${id}`, payload);
  return data;
}

export async function deleteAdminRole(id: number) {
  const { data } = await api.delete(`/admin/roles/${id}`);
  return data;
}

export async function fetchAdminPermissions() {
  const { data } = await api.get("/admin/permissions");
  return data;
}

export async function fetchAdminHistory(params?: Record<string, string>) {
  const { data } = await api.get("/admin/history", { params });
  return data;
}

// ═══════════════════════════════════
// ADMIN - EMAIL MANAGEMENT
// ═══════════════════════════════════
export async function fetchSmtpConfig() {
  const { data } = await api.get("/admin/email-management/smtp");
  return data;
}

export async function updateSmtpConfig(payload: Record<string, unknown>) {
  const { data } = await api.patch("/admin/email-management/smtp", payload);
  return data;
}

export async function sendTestEmail(to: string) {
  const { data } = await api.post("/admin/email-management/test-smtp", { to });
  return data;
}

export async function fetchEmailTemplates() {
  const { data } = await api.get("/admin/email-management/templates");
  return data;
}

export async function fetchEmailTemplate(id: number) {
  const { data } = await api.get(`/admin/email-management/templates/${id}`);
  return data;
}

export async function createEmailTemplate(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/email-management/templates", payload);
  return data;
}

export async function updateEmailTemplate(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/email-management/templates/${id}`, payload);
  return data;
}

export async function deleteEmailTemplate(id: number) {
  const { data } = await api.delete(`/admin/email-management/templates/${id}`);
  return data;
}

export async function fetchReminderSettings() {
  const { data } = await api.get("/admin/email-management/reminder-settings");
  return data;
}

export async function updateReminderSettings(payload: Record<string, unknown>) {
  const { data } = await api.patch("/admin/email-management/reminder-settings", payload);
  return data;
}

export async function fetchEmailLogs(params?: Record<string, string>) {
  const { data } = await api.get("/admin/email-management/logs", { params });
  return data;
}

// ═══════════════════════════════════
// ADMIN - DASHBOARD OVERVIEW
// ═══════════════════════════════════
export async function fetchAdminDashboardOverview() {
  const { data } = await api.get("/admin/dashboard/overview");
  return data;
}

// ═══════════════════════════════════
// ADMIN - FORGOT/RESET PASSWORD
// ═══════════════════════════════════
export async function adminForgotPassword(email: string) {
  const { data } = await api.post("/admin/forgot-password", { email });
  return data;
}

export async function adminResetPassword(token: string, password: string) {
  const { data } = await api.post("/admin/reset-password", { token, password });
  return data;
}

// Admin staff (IAM) — separate from donor `/admin/users`
export async function fetchAdminStaff(params?: Record<string, string | number | boolean | undefined>) {
  const { data } = await api.get("/admin/staff", { params });
  return data;
}

export async function createAdminUser(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/staff", payload);
  return data;
}

export async function updateAdminUser(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/staff/${id}`, payload);
  return data;
}

export async function deleteAdminUser(id: string) {
  const { data } = await api.delete(`/admin/staff/${id}`);
  return data;
}

export async function updateAdminUserStatus(id: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/staff/${id}/status`, { isActive });
  return data;
}

export async function resetAdminUserPassword(id: string, password: string) {
  const { data } = await api.post(`/admin/staff/${id}/reset-password`, { password });
  return data;
}

export async function fetchAdminApplyReviewSubmissions(params?: Record<string, string>) {
  const { data } = await api.get("/admin/apply-review", { params });
  return data;
}

export async function deleteAdminApplyReview(id: number) {
  const { data } = await api.delete(`/admin/apply-review/${id}`);
  return data;
}

export async function updateAdminApplyReview(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/apply-review/${id}`, payload);
  return data;
}

export async function regenerateAdminCertificationBadge(id: number) {
  const { data } = await api.patch(`/admin/certifications/${id}`, { badgeEnabled: true });
  return data;
}

export async function manuallyExpireAdminCertification(id: number) {
  const { data } = await api.patch(`/admin/certifications/${id}`, { status: "expired" });
  return data;
}

// Donation pages
export async function fetchAdminDonationPages() {
  const { data } = await api.get("/admin/donation-pages");
  return data;
}

export async function fetchAdminDonationPageById(id: string) {
  const { data } = await api.get(`/admin/donation-pages/${id}`);
  return data;
}

export async function createAdminDonationPage(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/donation-pages", payload);
  return data;
}

export async function updateAdminDonationPage(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/donation-pages/${id}`, payload);
  return data;
}

export async function deleteAdminDonationPage(id: string) {
  const { data } = await api.delete(`/admin/donation-pages/${id}`);
  return data;
}

export async function fetchDonationPageBySlug(slug: string) {
  const { data } = await api.get(`/donation-pages/${slug}`);
  return data;
}

export async function fetchPublishedDonationPages(params?: Record<string, string | number>) {
  const { data } = await api.get("/donation-pages", { params });
  return data;
}
