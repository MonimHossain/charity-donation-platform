export type RobotsIndex = "index" | "noindex";
export type RobotsFollow = "follow" | "nofollow";

export interface EntitySeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  seoExcerpt?: string;
  seoFeaturedImage?: string;
  seoTags?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robotsIndex?: RobotsIndex;
  robotsFollow?: RobotsFollow;
  schemaType?: string;
  customSchemaJson?: string;
}

export interface EntityFaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  /** When linked from Settings → FAQ library */
  libraryFaqId?: string | null;
}

export function emptyEntitySeoSettings(): EntitySeoSettings {
  return {
    metaTitle: "",
    metaDescription: "",
    seoExcerpt: "",
    seoFeaturedImage: "",
    seoTags: [],
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: "index",
    robotsFollow: "follow",
    schemaType: "Article",
    customSchemaJson: "",
  };
}

export function normalizeEntitySeoSettings(
  raw?: Partial<EntitySeoSettings> | null,
  legacy?: { metaTitle?: string; metaDescription?: string }
): EntitySeoSettings {
  const base = emptyEntitySeoSettings();
  const merged = { ...base, ...(raw || {}) };
  if (!merged.metaTitle?.trim() && legacy?.metaTitle) merged.metaTitle = legacy.metaTitle;
  if (!merged.metaDescription?.trim() && legacy?.metaDescription) {
    merged.metaDescription = legacy.metaDescription;
  }
  if (!Array.isArray(merged.seoTags)) merged.seoTags = [];
  if (!merged.robotsIndex) merged.robotsIndex = "index";
  if (!merged.robotsFollow) merged.robotsFollow = "follow";
  if (!merged.schemaType?.trim()) merged.schemaType = "Article";
  return merged;
}
