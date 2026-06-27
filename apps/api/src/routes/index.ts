import { Router } from "express";
import multer from "multer";
import {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  changeAdminPassword,
} from "../modules/admin-auth/adminAuth.controller.js";
import { requireAdmin } from "../modules/admin-auth/adminAuth.middleware.js";
import { authRateLimit } from "../modules/security/rateLimiter.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});
import {
  getCampaigns,
  getPublishedCampaigns,
  getCampaignBySlug,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../modules/campaigns/campaigns.controller.js";
import {
  createDonation,
  getDonations,
  getDonationStats,
  getDonationById,
  refundDonation,
  getRecentPublicDonations,
  getDonationReceipt,
  getDonationStatus,
} from "../modules/donations/donations.controller.js";
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getHomepageSections,
  updateHomepageSection,
  reorderHomepageSections,
  getSiteSettings,
  updateSiteSettings,
  getDonationPresets,
  updateDonationPreset,
  getTestimonials,
} from "../modules/cms/cms.controller.js";
import {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAdminBlogPosts,
  getAdminBlogPost,
} from "../modules/blog/blog.controller.js";
import { subscribe, getSubscribers } from "../modules/newsletter/newsletter.controller.js";

const router: Router = Router();

// ═══════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════

// Campaigns (public – only published)
router.get("/campaigns", getPublishedCampaigns);
router.get("/campaigns/:slug", getCampaignBySlug);

// Donations
router.post("/donations", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createDonation } = await import("../modules/donations/donations.controller.js");
    return createDonation(req, res);
  });
});
router.get("/donations/recent", getRecentPublicDonations);
router.get("/donations/:id/status", getDonationStatus);
router.get("/donations/:id/receipt", getDonationReceipt);

// CMS
router.get("/cms/hero-slides", getHeroSlides);
router.get("/cms/homepage-sections", getHomepageSections);
router.get("/cms/settings", getSiteSettings);
router.get("/cms/donation-presets", getDonationPresets);
router.get("/cms/testimonials", getTestimonials);
router.get("/cms/quick-donate", async (req, res) => {
  const { getPublicQuickDonate } = await import("../modules/quick-donate/quickDonate.controller.js");
  return getPublicQuickDonate(req, res);
});
router.get("/prayer-times", async (req, res) => {
  const { getPrayerTimes } = await import("../modules/prayer-times/prayerTimes.controller.js");
  return getPrayerTimes(req, res);
});

// Blog
router.get("/blog", getBlogPosts);
router.get("/blog/:slug", getBlogPostBySlug);

// Newsletter
router.post("/newsletter/subscribe", subscribe);

// Public charities / ICCA
router.get("/public/charities", async (req, res) => {
  const { getPublicCharities } = await import("../modules/charities/charities.controller.js");
  return getPublicCharities(req, res);
});
router.get("/public/charities/:slug", async (req, res) => {
  const { getPublicCharityBySlug } = await import("../modules/charities/charities.controller.js");
  return getPublicCharityBySlug(req, res);
});
router.get("/public/featured-charities", async (req, res) => {
  const { getFeaturedCharities } = await import("../modules/charities/charities.controller.js");
  return getFeaturedCharities(req, res);
});
router.get("/public/stats", async (req, res) => {
  const { getPublicStats } = await import("../modules/charities/charities.controller.js");
  return getPublicStats(req, res);
});
router.get("/public/verify", async (req, res) => {
  const { verifyCertification } = await import("../modules/charities/charities.controller.js");
  return verifyCertification(req, res);
});
router.get("/public/verify/:certificateId", async (req, res) => {
  const { verifyCertificationById } = await import("../modules/charities/charities.controller.js");
  return verifyCertificationById(req, res);
});
router.post("/public/contact-messages", async (req, res) => {
  const { submitContactMessage } = await import("../modules/charities/charities.controller.js");
  return submitContactMessage(req, res);
});
router.post("/public/concerns", async (req, res) => {
  const { submitConcern } = await import("../modules/charities/charities.controller.js");
  return submitConcern(req, res);
});
router.post("/public/apply-review", async (req, res) => {
  const { submitApplyReview } = await import("../modules/charities/charities.controller.js");
  return submitApplyReview(req, res);
});
router.get("/public/experts", async (req, res) => {
  const { getPublicExperts } = await import("../modules/charities/charities.controller.js");
  return getPublicExperts(req, res);
});

// ═══════════════════════════════════
// USER AUTH ROUTES (lazy-loaded)
// ═══════════════════════════════════
router.post("/auth/register", authRateLimit, async (req, res) => {
  const { registerUser } = await import("../modules/user-auth/userAuth.controller.js");
  return registerUser(req, res);
});
router.post("/auth/login", authRateLimit, async (req, res) => {
  const { loginUser } = await import("../modules/user-auth/userAuth.controller.js");
  return loginUser(req, res);
});
router.post("/auth/logout", async (req, res) => {
  const { logoutUser } = await import("../modules/user-auth/userAuth.controller.js");
  return logoutUser(req, res);
});
router.get("/auth/providers", async (req, res) => {
  const { getAuthProviders } = await import("../modules/user-auth/oauth.controller.js");
  return getAuthProviders(req, res);
});
router.get("/auth/google", async (req, res) => {
  const { startGoogleAuth } = await import("../modules/user-auth/oauth.controller.js");
  return startGoogleAuth(req, res);
});
router.get("/auth/google/callback", async (req, res) => {
  const { googleAuthCallback } = await import("../modules/user-auth/oauth.controller.js");
  return googleAuthCallback(req, res);
});
router.get("/auth/apple", async (req, res) => {
  const { startAppleAuth } = await import("../modules/user-auth/oauth.controller.js");
  return startAppleAuth(req, res);
});
router.post("/auth/apple/callback", async (req, res) => {
  const { appleAuthCallback } = await import("../modules/user-auth/oauth.controller.js");
  return appleAuthCallback(req, res);
});
router.get("/auth/profile", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getUserProfile } = await import("../modules/user-auth/userAuth.controller.js");
    return getUserProfile(req, res);
  });
});
router.put("/auth/profile", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { updateUserProfile } = await import("../modules/user-auth/userAuth.controller.js");
    return updateUserProfile(req, res);
  });
});
router.put("/auth/change-password", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { changePassword } = await import("../modules/user-auth/userAuth.controller.js");
    return changePassword(req, res);
  });
});

router.post("/auth/donor/check-email", authRateLimit, async (req, res) => {
  const { checkDonorEmailHandler } = await import("../modules/user-auth/donorAccess.controller.js");
  return checkDonorEmailHandler(req, res);
});
router.post("/auth/donor/request-access", authRateLimit, async (req, res) => {
  const { requestDonorAccessHandler } = await import("../modules/user-auth/donorAccess.controller.js");
  return requestDonorAccessHandler(req, res);
});
router.post("/auth/activate-account", authRateLimit, async (req, res) => {
  const { activateAccountHandler } = await import("../modules/user-auth/donorAccess.controller.js");
  return activateAccountHandler(req, res);
});

// Password reset (public)
router.post("/auth/forgot-password", authRateLimit, async (req, res) => {
  const { forgotPassword } = await import("../modules/user-auth/donorAccess.controller.js");
  return forgotPassword(req, res);
});
router.post("/auth/reset-password", authRateLimit, async (req, res) => {
  const { resetPassword } = await import("../modules/user-auth/donorAccess.controller.js");
  return resetPassword(req, res);
});

// User donations
router.get("/my/donations", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getUserDonations } = await import("../modules/user-auth/userAuth.controller.js");
    return getUserDonations(req, res);
  });
});
router.get("/my/donations/:id", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getUserDonationById } = await import("../modules/donations/donations.controller.js");
    return getUserDonationById(req, res);
  });
});

// ═══════════════════════════════════
// RECURRING DONATIONS (lazy-loaded)
// ═══════════════════════════════════
router.get("/recurring/my", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getUserRecurringDonations } = await import("../modules/recurring/recurring.controller.js");
    return getUserRecurringDonations(req, res);
  });
});
router.post("/recurring", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createRecurringDonation } = await import("../modules/recurring/recurring.controller.js");
    return createRecurringDonation(req, res);
  });
});
router.put("/recurring/:id/pause", async (req, res) => {
  const { pauseRecurringDonation } = await import("../modules/recurring/recurring.controller.js");
  return pauseRecurringDonation(req, res);
});
router.put("/recurring/:id/resume", async (req, res) => {
  const { resumeRecurringDonation } = await import("../modules/recurring/recurring.controller.js");
  return resumeRecurringDonation(req, res);
});
router.put("/recurring/:id/cancel", async (req, res) => {
  const { cancelRecurringDonation } = await import("../modules/recurring/recurring.controller.js");
  return cancelRecurringDonation(req, res);
});
router.put("/recurring/:id/payment-method", async (req, res) => {
  const { updateRecurringPaymentMethod } = await import("../modules/recurring/recurring.controller.js");
  return updateRecurringPaymentMethod(req, res);
});
router.post("/recurring/:id/billing-portal", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createRecurringBillingPortal } = await import("../modules/recurring/recurring.controller.js");
    return createRecurringBillingPortal(req, res);
  });
});

// ═══════════════════════════════════
// PAYMENT ROUTES (lazy-loaded)
// ═══════════════════════════════════
router.post("/payments/stripe/create-intent", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createPaymentIntent } = await import("../modules/payments/stripe.controller.js");
    return createPaymentIntent(req, res);
  });
});
router.post("/payments/stripe/confirm", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { confirmStripePayment } = await import("../modules/payments/stripe.controller.js");
    return confirmStripePayment(req, res);
  });
});
router.post("/payments/stripe/create-subscription", async (req, res) => {
  const { createSubscription } = await import("../modules/payments/stripe.controller.js");
  return createSubscription(req, res);
});
router.post("/payments/stripe/create-subscription-checkout", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createSubscriptionCheckout } = await import("../modules/payments/stripe.controller.js");
    return createSubscriptionCheckout(req, res);
  });
});
router.post("/payments/stripe/create-setup-intent", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createSetupIntent } = await import("../modules/payments/stripe.controller.js");
    return createSetupIntent(req, res);
  });
});
router.post("/payments/stripe/confirm-setup", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { confirmStripeSetup } = await import("../modules/payments/stripe.controller.js");
    return confirmStripeSetup(req, res);
  });
});
router.get("/payments/stripe/customer-session", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getStripeCustomerSession } = await import("../modules/payments/stripe.controller.js");
    return getStripeCustomerSession(req, res);
  });
});
router.get("/payments/stripe/status/:intentId", async (req, res) => {
  const { getPaymentStatus } = await import("../modules/payments/stripe.controller.js");
  return getPaymentStatus(req, res);
});
router.post("/payments/paypal/create-order", async (req, res) => {
  const { createPayPalOrder } = await import("../modules/payments/paypal.controller.js");
  return createPayPalOrder(req, res);
});
router.post("/payments/paypal/capture-order", async (req, res) => {
  const { capturePayPalOrder } = await import("../modules/payments/paypal.controller.js");
  return capturePayPalOrder(req, res);
});
router.get("/payments/config", async (req, res) => {
  const { getPaymentsConfig } = await import("../modules/payments/payments.config.controller.js");
  return getPaymentsConfig(req, res);
});
router.get("/payments/config/campaign", async (req, res) => {
  const { getPaymentsConfigForCampaign } = await import("../modules/payments/payments.config.controller.js");
  return getPaymentsConfigForCampaign(req, res);
});
router.post("/payments/telr/init", async (req, res) => {
  const { initTelrPayment } = await import("../modules/payments/telr.controller.js");
  return initTelrPayment(req, res);
});
router.get("/payments/telr/return", async (req, res) => {
  const { handleTelrReturn } = await import("../modules/payments/telr.controller.js");
  return handleTelrReturn(req, res);
});
router.post("/payments/telr/webhook", async (req, res) => {
  const { handleTelrWebhook } = await import("../modules/payments/telr.controller.js");
  return handleTelrWebhook(req, res);
});
router.post("/payments/paytabs/init", async (req, res) => {
  const { initPayTabsPayment } = await import("../modules/payments/paytabs.controller.js");
  return initPayTabsPayment(req, res);
});
router.post("/payments/paytabs/callback", async (req, res) => {
  const { handlePayTabsCallback } = await import("../modules/payments/paytabs.controller.js");
  return handlePayTabsCallback(req, res);
});

// ═══════════════════════════════════
// PUBLIC CMS EXTENDED (lazy-loaded)
// ═══════════════════════════════════
router.get("/cms/navigation", async (req, res) => {
  const { getNavigationMenus } = await import("../modules/cms/cmsExtended.controller.js");
  return getNavigationMenus(req, res);
});
router.get("/cms/banners", async (req, res) => {
  const { getPublicBanners } = await import("../modules/cms/cmsExtended.controller.js");
  return getPublicBanners(req, res);
});
router.get("/cms/faqs", async (req, res) => {
  const { getFaqs } = await import("../modules/cms/cmsExtended.controller.js");
  return getFaqs(req, res);
});
router.get("/cms/seo", async (req, res) => {
  const { getSeoSettings } = await import("../modules/cms/cmsExtended.controller.js");
  return getSeoSettings(req, res);
});
router.get("/cms/page-blocks", async (req, res) => {
  const { getPageBlocks } = await import("../modules/cms/cmsExtended.controller.js");
  return getPageBlocks(req, res);
});
router.get("/cms/translations", async (req, res) => {
  const { getTranslations } = await import("../modules/cms/cmsExtended.controller.js");
  return getTranslations(req, res);
});
router.get("/blog/categories", async (req, res) => {
  const { getBlogCategories } = await import("../modules/cms/cmsExtended.controller.js");
  return getBlogCategories(req, res);
});

// ═══════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════
router.post("/admin/login", authRateLimit, loginAdmin);
router.post("/admin/logout", requireAdmin, logoutAdmin);
router.get("/admin/profile", requireAdmin, getAdminProfile);
router.put("/admin/profile/password", requireAdmin, changeAdminPassword);

// ═══════════════════════════════════
// ADMIN CAMPAIGNS
// ═══════════════════════════════════
router.get("/admin/campaigns", requireAdmin, getCampaigns);
router.get("/admin/campaigns/:id", requireAdmin, getCampaignById);
router.post("/admin/campaigns", requireAdmin, createCampaign);
router.put("/admin/campaigns/:id", requireAdmin, updateCampaign);
router.delete("/admin/campaigns/:id", requireAdmin, deleteCampaign);

// ═══════════════════════════════════
// ADMIN UPSELLS
// ═══════════════════════════════════
router.get("/admin/upsells", requireAdmin, async (req, res) => {
  const { getAdminUpsells } = await import("../modules/upsells/upsells.controller.js");
  return getAdminUpsells(req, res);
});
router.post("/admin/upsells", requireAdmin, async (req, res) => {
  const { createUpsell } = await import("../modules/upsells/upsells.controller.js");
  return createUpsell(req, res);
});
router.put("/admin/upsells/:id", requireAdmin, async (req, res) => {
  const { updateUpsell } = await import("../modules/upsells/upsells.controller.js");
  return updateUpsell(req, res);
});
router.delete("/admin/upsells/:id", requireAdmin, async (req, res) => {
  const { deleteUpsell } = await import("../modules/upsells/upsells.controller.js");
  return deleteUpsell(req, res);
});

// ═══════════════════════════════════
// ADMIN DONATIONS
// ═══════════════════════════════════
router.get("/admin/donations", requireAdmin, getDonations);
router.get("/admin/donations/stats", requireAdmin, getDonationStats);
router.get("/admin/donations/:id", requireAdmin, getDonationById);
router.put("/admin/donations/:id/refund", requireAdmin, refundDonation);
router.get("/admin/payment-logs", requireAdmin, async (req, res) => {
  const { getAdminPaymentLogs } = await import("../modules/payments/paymentLogs.controller.js");
  return getAdminPaymentLogs(req, res);
});

// ═══════════════════════════════════
// ADMIN CMS
// ═══════════════════════════════════
router.post("/admin/cms/hero-slides", requireAdmin, createHeroSlide);
router.put("/admin/cms/hero-slides/:id", requireAdmin, updateHeroSlide);
router.delete("/admin/cms/hero-slides/:id", requireAdmin, deleteHeroSlide);
router.put("/admin/cms/homepage-sections/:id", requireAdmin, updateHomepageSection);
router.post("/admin/cms/homepage-sections/reorder", requireAdmin, reorderHomepageSections);
router.put("/admin/cms/settings", requireAdmin, updateSiteSettings);
router.get("/admin/payments/status", requireAdmin, async (req, res) => {
  const { getAdminPaymentStatus } = await import("../modules/payments/payments.config.controller.js");
  return getAdminPaymentStatus(req, res);
});
router.put("/admin/cms/donation-presets/:id", requireAdmin, updateDonationPreset);
router.get("/admin/quick-donate/options", requireAdmin, async (req, res) => {
  const { listQuickDonateOptions } = await import("../modules/quick-donate/quickDonate.controller.js");
  return listQuickDonateOptions(req, res);
});
router.post("/admin/quick-donate/options", requireAdmin, async (req, res) => {
  const { createQuickDonateOption } = await import("../modules/quick-donate/quickDonate.controller.js");
  return createQuickDonateOption(req, res);
});
router.put("/admin/quick-donate/options/:id", requireAdmin, async (req, res) => {
  const { updateQuickDonateOption } = await import("../modules/quick-donate/quickDonate.controller.js");
  return updateQuickDonateOption(req, res);
});
router.delete("/admin/quick-donate/options/:id", requireAdmin, async (req, res) => {
  const { deleteQuickDonateOption } = await import("../modules/quick-donate/quickDonate.controller.js");
  return deleteQuickDonateOption(req, res);
});
router.get("/admin/quick-donate/settings", requireAdmin, async (req, res) => {
  const { getQuickDonateSettings } = await import("../modules/quick-donate/quickDonate.controller.js");
  return getQuickDonateSettings(req, res);
});
router.put("/admin/quick-donate/settings", requireAdmin, async (req, res) => {
  const { updateQuickDonateSettings } = await import("../modules/quick-donate/quickDonate.controller.js");
  return updateQuickDonateSettings(req, res);
});

// Admin CMS Extended (lazy-loaded)
router.post("/admin/cms/navigation", requireAdmin, async (req, res) => {
  const { createNavigationMenu } = await import("../modules/cms/cmsExtended.controller.js");
  return createNavigationMenu(req, res);
});
router.put("/admin/cms/navigation/:id", requireAdmin, async (req, res) => {
  const { updateNavigationMenu } = await import("../modules/cms/cmsExtended.controller.js");
  return updateNavigationMenu(req, res);
});
router.delete("/admin/cms/navigation/:id", requireAdmin, async (req, res) => {
  const { deleteNavigationMenu } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteNavigationMenu(req, res);
});
router.post("/admin/cms/navigation/reorder", requireAdmin, async (req, res) => {
  const { reorderNavigationMenus } = await import("../modules/cms/cmsExtended.controller.js");
  return reorderNavigationMenus(req, res);
});
router.get("/admin/cms/banners", requireAdmin, async (req, res) => {
  const { getBanners } = await import("../modules/cms/cmsExtended.controller.js");
  return getBanners(req, res);
});
router.post("/admin/cms/banners", requireAdmin, async (req, res) => {
  const { createBanner } = await import("../modules/cms/cmsExtended.controller.js");
  return createBanner(req, res);
});
router.put("/admin/cms/banners/:id", requireAdmin, async (req, res) => {
  const { updateBanner } = await import("../modules/cms/cmsExtended.controller.js");
  return updateBanner(req, res);
});
router.delete("/admin/cms/banners/:id", requireAdmin, async (req, res) => {
  const { deleteBanner } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteBanner(req, res);
});
router.post("/admin/cms/faqs", requireAdmin, async (req, res) => {
  const { createFaq } = await import("../modules/cms/cmsExtended.controller.js");
  return createFaq(req, res);
});
router.put("/admin/cms/faqs/:id", requireAdmin, async (req, res) => {
  const { updateFaq } = await import("../modules/cms/cmsExtended.controller.js");
  return updateFaq(req, res);
});
router.delete("/admin/cms/faqs/:id", requireAdmin, async (req, res) => {
  const { deleteFaq } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteFaq(req, res);
});
router.put("/admin/cms/seo", requireAdmin, async (req, res) => {
  const { upsertSeoSettings } = await import("../modules/cms/cmsExtended.controller.js");
  return upsertSeoSettings(req, res);
});
router.post("/admin/cms/page-blocks", requireAdmin, async (req, res) => {
  const { createPageBlock } = await import("../modules/cms/cmsExtended.controller.js");
  return createPageBlock(req, res);
});
router.put("/admin/cms/page-blocks/:id", requireAdmin, async (req, res) => {
  const { updatePageBlock } = await import("../modules/cms/cmsExtended.controller.js");
  return updatePageBlock(req, res);
});
router.delete("/admin/cms/page-blocks/:id", requireAdmin, async (req, res) => {
  const { deletePageBlock } = await import("../modules/cms/cmsExtended.controller.js");
  return deletePageBlock(req, res);
});
router.post("/admin/cms/page-blocks/reorder", requireAdmin, async (req, res) => {
  const { reorderPageBlocks } = await import("../modules/cms/cmsExtended.controller.js");
  return reorderPageBlocks(req, res);
});
router.put("/admin/cms/translations", requireAdmin, async (req, res) => {
  const { upsertTranslation } = await import("../modules/cms/cmsExtended.controller.js");
  return upsertTranslation(req, res);
});
// ─── File Management & Upload ────────────────────────────────────────────────
router.get("/admin/cms/media/stats", requireAdmin, async (req, res) => {
  const { getMediaStats } = await import("../modules/media/media.controller.js");
  return getMediaStats(req, res);
});
router.get("/admin/cms/media", requireAdmin, async (req, res) => {
  const { getMediaFiles } = await import("../modules/media/media.controller.js");
  return getMediaFiles(req, res);
});
router.post("/admin/cms/media/upload", requireAdmin, upload.single("file"), async (req, res) => {
  const { uploadMediaFile } = await import("../modules/media/media.controller.js");
  return uploadMediaFile(req, res);
});
router.post("/admin/cms/media/upload-multiple", requireAdmin, upload.array("files", 20), async (req, res) => {
  const { uploadMultipleFiles } = await import("../modules/media/media.controller.js");
  return uploadMultipleFiles(req, res);
});
router.post("/admin/cms/media/bulk-delete", requireAdmin, async (req, res) => {
  const { bulkDeleteMedia } = await import("../modules/media/media.controller.js");
  return bulkDeleteMedia(req, res);
});
router.post("/admin/cms/media/folders", requireAdmin, async (req, res) => {
  const { createFolder } = await import("../modules/media/media.controller.js");
  return createFolder(req, res);
});
router.post("/admin/cms/media/move", requireAdmin, async (req, res) => {
  const { moveFiles } = await import("../modules/media/media.controller.js");
  return moveFiles(req, res);
});
router.put("/admin/cms/media/:id", requireAdmin, async (req, res) => {
  const { updateMediaFile } = await import("../modules/media/media.controller.js");
  return updateMediaFile(req, res);
});
router.delete("/admin/cms/media/:id", requireAdmin, async (req, res) => {
  const { deleteMediaFile } = await import("../modules/media/media.controller.js");
  return deleteMediaFile(req, res);
});

// Admin CMS Footer
router.get("/admin/cms/footer", requireAdmin, async (req, res) => {
  const { getFooterContent } = await import("../modules/cms/cmsExtended.controller.js");
  return getFooterContent(req, res);
});
router.put("/admin/cms/footer", requireAdmin, async (req, res) => {
  const { updateFooterContent } = await import("../modules/cms/cmsExtended.controller.js");
  return updateFooterContent(req, res);
});

// Admin CMS Pages (aliases for page-block operations, grouped by page)
router.get("/admin/cms/pages", requireAdmin, async (req, res) => {
  const { getPages } = await import("../modules/cms/cmsExtended.controller.js");
  return getPages(req, res);
});
router.post("/admin/cms/pages", requireAdmin, async (req, res) => {
  const { createPageBlock } = await import("../modules/cms/cmsExtended.controller.js");
  return createPageBlock(req, res);
});
router.delete("/admin/cms/pages/:id", requireAdmin, async (req, res) => {
  const { deletePage } = await import("../modules/cms/cmsExtended.controller.js");
  return deletePage(req, res);
});
router.post("/admin/cms/pages/:id/blocks", requireAdmin, async (req, res) => {
  const { addBlockToPage } = await import("../modules/cms/cmsExtended.controller.js");
  return addBlockToPage(req, res);
});
router.put("/admin/cms/pages/:id/blocks/:blockId", requireAdmin, async (req, res) => {
  const { updateBlockInPage } = await import("../modules/cms/cmsExtended.controller.js");
  return updateBlockInPage(req, res);
});
router.delete("/admin/cms/pages/:id/blocks/:blockId", requireAdmin, async (req, res) => {
  const { deleteBlockFromPage } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteBlockFromPage(req, res);
});

// Admin CMS SEO stubs (redirects + sitemap)
router.get("/admin/cms/redirects", requireAdmin, async (req, res) => {
  const { getRedirects } = await import("../modules/cms/cmsExtended.controller.js");
  return getRedirects(req, res);
});
router.post("/admin/cms/redirects", requireAdmin, async (req, res) => {
  const { createRedirect } = await import("../modules/cms/cmsExtended.controller.js");
  return createRedirect(req, res);
});
router.delete("/admin/cms/redirects/:id", requireAdmin, async (req, res) => {
  const { deleteRedirect } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteRedirect(req, res);
});
router.get("/admin/cms/sitemap-settings", requireAdmin, async (req, res) => {
  const { getSitemapSettings } = await import("../modules/cms/cmsExtended.controller.js");
  return getSitemapSettings(req, res);
});

// ═══════════════════════════════════
// ADMIN BLOG
// ═══════════════════════════════════
router.get("/admin/blog/categories", requireAdmin, async (req, res) => {
  const { getAdminBlogCategories } = await import("../modules/cms/cmsExtended.controller.js");
  return getAdminBlogCategories(req, res);
});
router.post("/admin/blog/categories", requireAdmin, async (req, res) => {
  const { createBlogCategory } = await import("../modules/cms/cmsExtended.controller.js");
  return createBlogCategory(req, res);
});
router.post("/admin/blog/categories/reorder", requireAdmin, async (req, res) => {
  const { reorderBlogCategories } = await import("../modules/cms/cmsExtended.controller.js");
  return reorderBlogCategories(req, res);
});
router.put("/admin/blog/categories/:id", requireAdmin, async (req, res) => {
  const { updateBlogCategory } = await import("../modules/cms/cmsExtended.controller.js");
  return updateBlogCategory(req, res);
});
router.delete("/admin/blog/categories/:id", requireAdmin, async (req, res) => {
  const { deleteBlogCategory } = await import("../modules/cms/cmsExtended.controller.js");
  return deleteBlogCategory(req, res);
});
router.get("/admin/blog", requireAdmin, getAdminBlogPosts);
router.get("/admin/blog/:id", requireAdmin, getAdminBlogPost);
router.post("/admin/blog", requireAdmin, createBlogPost);
router.put("/admin/blog/:id", requireAdmin, updateBlogPost);
router.delete("/admin/blog/:id", requireAdmin, deleteBlogPost);

// ═══════════════════════════════════
// ADMIN RECURRING
// ═══════════════════════════════════
router.get("/admin/recurring", requireAdmin, async (req, res) => {
  const { getRecurringDonations } = await import("../modules/recurring/recurring.controller.js");
  return getRecurringDonations(req, res);
});

// ═══════════════════════════════════
// ADMIN USERS
// ═══════════════════════════════════
router.get("/admin/users", requireAdmin, async (req, res) => {
  const { getUsers } = await import("../modules/user-auth/userAuth.controller.js");
  return getUsers(req, res);
});
router.put("/admin/users/:id/deactivate", requireAdmin, async (req, res) => {
  const { deactivateUser } = await import("../modules/user-auth/userAuth.controller.js");
  return deactivateUser(req, res);
});

// ═══════════════════════════════════
// ADMIN ANALYTICS
// ═══════════════════════════════════
router.get("/admin/analytics/dashboard", requireAdmin, async (req, res) => {
  const { getDashboardStats } = await import("../modules/analytics/analytics.controller.js");
  return getDashboardStats(req, res);
});
router.get("/admin/analytics/campaigns", requireAdmin, async (req, res) => {
  const { getCampaignReport } = await import("../modules/analytics/analytics.controller.js");
  return getCampaignReport(req, res);
});
router.get("/admin/analytics/recurring", requireAdmin, async (req, res) => {
  const { getRecurringReport } = await import("../modules/analytics/analytics.controller.js");
  return getRecurringReport(req, res);
});
router.get("/admin/analytics/donors", requireAdmin, async (req, res) => {
  const { getDonorReport } = await import("../modules/analytics/analytics.controller.js");
  return getDonorReport(req, res);
});
router.get("/admin/analytics/revenue", requireAdmin, async (req, res) => {
  const { getRevenueReport } = await import("../modules/analytics/analytics.controller.js");
  return getRevenueReport(req, res);
});
router.get("/admin/analytics/gift-aid", requireAdmin, async (req, res) => {
  const { getGiftAidReport } = await import("../modules/analytics/analytics.controller.js");
  return getGiftAidReport(req, res);
});
router.get("/admin/analytics/export/donations", requireAdmin, async (req, res) => {
  const { exportDonations } = await import("../modules/analytics/analytics.controller.js");
  return exportDonations(req, res);
});

// ═══════════════════════════════════
// ADMIN ACTIVITY LOGS
// ═══════════════════════════════════
router.get("/admin/activity-logs", requireAdmin, async (req, res) => {
  const { getActivityLogs } = await import("../modules/analytics/analytics.controller.js");
  return getActivityLogs(req, res);
});
router.get("/admin/audit-logs", requireAdmin, async (req, res) => {
  const { getAuditLogs } = await import("../modules/analytics/analytics.controller.js");
  return getAuditLogs(req, res);
});

// ═══════════════════════════════════
// ADMIN NEWSLETTER
// ═══════════════════════════════════
router.get("/admin/newsletter/subscribers", requireAdmin, getSubscribers);

// Admin charities / certifications / concerns / apply-review
router.get("/admin/charities", requireAdmin, async (req, res) => {
  const { getAdminCharities } = await import("../modules/charities/charities.controller.js");
  return getAdminCharities(req, res);
});
router.get("/admin/charities/:id", requireAdmin, async (req, res) => {
  const { getAdminCharityById } = await import("../modules/charities/charities.controller.js");
  return getAdminCharityById(req, res);
});
router.post("/admin/charities", requireAdmin, async (req, res) => {
  const { createAdminCharity } = await import("../modules/charities/charities.controller.js");
  return createAdminCharity(req, res);
});
router.patch("/admin/charities/:id", requireAdmin, async (req, res) => {
  const { updateAdminCharity } = await import("../modules/charities/charities.controller.js");
  return updateAdminCharity(req, res);
});
router.delete("/admin/charities/:id", requireAdmin, async (req, res) => {
  const { deleteAdminCharity } = await import("../modules/charities/charities.controller.js");
  return deleteAdminCharity(req, res);
});
router.get("/admin/certifications", requireAdmin, async (req, res) => {
  const { getAdminCertifications } = await import("../modules/charities/charities.controller.js");
  return getAdminCertifications(req, res);
});
router.get("/admin/certifications/:id", requireAdmin, async (req, res) => {
  const { getAdminCertificationById } = await import("../modules/charities/charities.controller.js");
  return getAdminCertificationById(req, res);
});
router.post("/admin/certifications", requireAdmin, async (req, res) => {
  const { createAdminCertification } = await import("../modules/charities/charities.controller.js");
  return createAdminCertification(req, res);
});
router.patch("/admin/certifications/:id", requireAdmin, async (req, res) => {
  const { updateAdminCertification } = await import("../modules/charities/charities.controller.js");
  return updateAdminCertification(req, res);
});
router.delete("/admin/certifications/:id", requireAdmin, async (req, res) => {
  const { deleteAdminCertification } = await import("../modules/charities/charities.controller.js");
  return deleteAdminCertification(req, res);
});
router.get("/admin/concerns", requireAdmin, async (req, res) => {
  const { getAdminConcerns } = await import("../modules/charities/charities.controller.js");
  return getAdminConcerns(req, res);
});
router.get("/admin/apply-review", requireAdmin, async (req, res) => {
  const { getAdminApplyReview } = await import("../modules/charities/charities.controller.js");
  return getAdminApplyReview(req, res);
});
router.patch("/admin/apply-review/:id", requireAdmin, async (req, res) => {
  const { updateAdminApplyReview } = await import("../modules/charities/charities.controller.js");
  return updateAdminApplyReview(req, res);
});
router.delete("/admin/apply-review/:id", requireAdmin, async (req, res) => {
  const { deleteAdminApplyReview } = await import("../modules/charities/charities.controller.js");
  return deleteAdminApplyReview(req, res);
});

// Admin donation pages
router.get("/admin/donation-pages", requireAdmin, async (req, res) => {
  const { getAdminDonationPages } = await import("../modules/donation-pages/donationPages.controller.js");
  return getAdminDonationPages(req, res);
});
router.get("/admin/donation-pages/:id", requireAdmin, async (req, res) => {
  const { getAdminDonationPageById } = await import("../modules/donation-pages/donationPages.controller.js");
  return getAdminDonationPageById(req, res);
});
router.post("/admin/donation-pages", requireAdmin, async (req, res) => {
  const { createAdminDonationPage } = await import("../modules/donation-pages/donationPages.controller.js");
  return createAdminDonationPage(req, res);
});
router.put("/admin/donation-pages/:id", requireAdmin, async (req, res) => {
  const { updateAdminDonationPage } = await import("../modules/donation-pages/donationPages.controller.js");
  return updateAdminDonationPage(req, res);
});
router.delete("/admin/donation-pages/:id", requireAdmin, async (req, res) => {
  const { deleteAdminDonationPage } = await import("../modules/donation-pages/donationPages.controller.js");
  return deleteAdminDonationPage(req, res);
});
router.get("/donation-pages", async (req, res) => {
  const { listPublishedDonationPages } = await import("../modules/donation-pages/donationPages.controller.js");
  return listPublishedDonationPages(req, res);
});
router.get("/donation-pages/:slug", async (req, res) => {
  const { getDonationPageBySlug } = await import("../modules/donation-pages/donationPages.controller.js");
  return getDonationPageBySlug(req, res);
});

// Admin staff (IAM)
router.get("/admin/staff", requireAdmin, async (req, res) => {
  const { listAdminStaff } = await import("../modules/admin-auth/adminStaff.controller.js");
  return listAdminStaff(req, res);
});
router.post("/admin/staff", requireAdmin, async (req, res) => {
  const { createAdminStaff } = await import("../modules/admin-auth/adminStaff.controller.js");
  return createAdminStaff(req, res);
});
router.patch("/admin/staff/:id", requireAdmin, async (req, res) => {
  const { updateAdminStaff } = await import("../modules/admin-auth/adminStaff.controller.js");
  return updateAdminStaff(req, res);
});
router.delete("/admin/staff/:id", requireAdmin, async (req, res) => {
  const { deleteAdminStaff } = await import("../modules/admin-auth/adminStaff.controller.js");
  return deleteAdminStaff(req, res);
});
router.patch("/admin/staff/:id/status", requireAdmin, async (req, res) => {
  const { updateAdminStaffStatus } = await import("../modules/admin-auth/adminStaff.controller.js");
  return updateAdminStaffStatus(req, res);
});
router.post("/admin/staff/:id/reset-password", requireAdmin, async (req, res) => {
  const { resetAdminStaffPassword } = await import("../modules/admin-auth/adminStaff.controller.js");
  return resetAdminStaffPassword(req, res);
});
router.get("/admin/roles", requireAdmin, async (req, res) => {
  const { listAdminRoles } = await import("../modules/admin-auth/adminStaff.controller.js");
  return listAdminRoles(req, res);
});
router.get("/admin/permissions", requireAdmin, async (req, res) => {
  const { listAdminPermissions } = await import("../modules/admin-auth/adminStaff.controller.js");
  return listAdminPermissions(req, res);
});

// ═══════════════════════════════════
// ZAKAT CALCULATOR (public)
// ═══════════════════════════════════
router.get("/zakat/metal-prices", async (req, res) => {
  const { getZakatMetalPrices } = await import("../modules/zakat/zakat.controller.js");
  return getZakatMetalPrices(req, res);
});
router.post("/zakat/calculate", async (req, res) => {
  const { calculateZakat } = await import("../modules/zakat/zakat.controller.js");
  return calculateZakat(req, res);
});
router.post("/zakat/save", async (req, res) => {
  const { saveZakatCalculation } = await import("../modules/zakat/zakat.controller.js");
  return saveZakatCalculation(req, res);
});
router.get("/zakat/history", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getZakatHistory } = await import("../modules/zakat/zakat.controller.js");
    return getZakatHistory(req, res);
  });
});

// ═══════════════════════════════════
// AUTOMATED DONATIONS (public/user)
// ═══════════════════════════════════
router.post("/automated-donations", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { createAutomatedSchedule } = await import("../modules/automated/automated.controller.js");
    return createAutomatedSchedule(req, res);
  });
});
router.get("/automated-donations/my", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getMyAutomatedSchedules } = await import("../modules/automated/automated.controller.js");
    return getMyAutomatedSchedules(req, res);
  });
});
router.get("/automated-donations/my/:id", async (req, res) => {
  const { requireUser } = await import("../modules/user-auth/userAuth.middleware.js");
  requireUser(req, res, async () => {
    const { getMyAutomatedScheduleById } = await import("../modules/automated/automated.controller.js");
    return getMyAutomatedScheduleById(req, res);
  });
});
router.put("/automated-donations/:id/cancel", async (req, res) => {
  const { cancelAutomatedSchedule } = await import("../modules/automated/automated.controller.js");
  return cancelAutomatedSchedule(req, res);
});

// ═══════════════════════════════════
// ADMIN AUTOMATED DONATIONS
// ═══════════════════════════════════
router.get("/admin/automated-donations", requireAdmin, async (req, res) => {
  const { getAdminAutomatedSchedules } = await import("../modules/automated/automated.controller.js");
  return getAdminAutomatedSchedules(req, res);
});
router.get("/admin/automated-donations/:id", requireAdmin, async (req, res) => {
  const { getAdminAutomatedScheduleById } = await import("../modules/automated/automated.controller.js");
  return getAdminAutomatedScheduleById(req, res);
});

// ═══════════════════════════════════
// ACTIVITY TRACKING (public)
// ═══════════════════════════════════
router.post("/track", async (req, res) => {
  const { trackActivity } = await import("../modules/analytics/analytics.controller.js");
  return trackActivity(req, res);
});

export default router;
