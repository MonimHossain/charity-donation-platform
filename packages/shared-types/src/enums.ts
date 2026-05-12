export enum DonationFrequency {
  SINGLE = "single",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
}

export enum DonationStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum RecurringStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export enum CampaignStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum CampaignCategory {
  EMERGENCY = "emergency",
  FOOD = "food",
  WATER = "water",
  EDUCATION = "education",
  HEALTH = "health",
  SHELTER = "shelter",
  ORPHAN = "orphan",
  ZAKAT = "zakat",
  SADAQAH = "sadaqah",
  LILLAH = "lillah",
  GENERAL = "general",
}

export enum CampaignTag {
  ZAKAT = "zakat",
  SADAQAH = "sadaqah",
  LILLAH = "lillah",
  GENERAL = "general",
  EMERGENCY = "emergency",
  RAMADAN = "ramadan",
  QURBANI = "qurbani",
  WINTER = "winter",
}

export enum UserRole {
  DONOR = "donor",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  EDITOR = "editor",
}

export enum Currency {
  GBP = "GBP",
  USD = "USD",
  EUR = "EUR",
  CAD = "CAD",
  AUD = "AUD",
}

export enum PaymentProvider {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay",
}

export enum PaymentLogType {
  CHARGE = "charge",
  REFUND = "refund",
  FAILED = "failed",
  DISPUTE = "dispute",
}

export enum DedicationType {
  IN_MEMORY_OF = "in_memory_of",
  IN_HONOR_OF = "in_honor_of",
  ON_BEHALF_OF = "on_behalf_of",
}

export enum HomepageSectionType {
  HERO = "hero",
  FEATURED_CAMPAIGNS = "featured_campaigns",
  EMERGENCY_APPEALS = "emergency_appeals",
  IMPACT_STATS = "impact_stats",
  TESTIMONIALS = "testimonials",
  VIDEO_STORIES = "video_stories",
  PARTNER_LOGOS = "partner_logos",
  DONATION_PROGRESS = "donation_progress",
  FAQ = "faq",
  VOLUNTEER_CTA = "volunteer_cta",
  NEWSLETTER = "newsletter",
  TRUST_BADGES = "trust_badges",
  FEATURED_BLOGS = "featured_blogs",
  RECENT_DONATIONS = "recent_donations",
  COUNTDOWN_TIMER = "countdown_timer",
  LIVE_COUNTER = "live_counter",
  CUSTOM = "custom",
}

export enum BannerType {
  BANNER = "banner",
  POPUP = "popup",
  EMERGENCY_APPEAL = "emergency_appeal",
  ANNOUNCEMENT = "announcement",
}

export enum PageBlockType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  SLIDER = "slider",
  CTA = "cta",
  STATS = "stats",
  DONATION_FORM = "donation_form",
  TESTIMONIAL = "testimonial",
  HTML = "html",
  FAQ = "faq",
  GALLERY = "gallery",
}
