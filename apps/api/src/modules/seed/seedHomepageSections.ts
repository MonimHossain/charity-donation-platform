import { DataSource } from "typeorm";
import { HomepageSection } from "../../components/cms/homepageSection.entity.js";
import { HeroSlide } from "../../components/cms/heroSlide.entity.js";

export async function seedHomepageSections(ds: DataSource) {
  const sectionRepo = ds.getRepository(HomepageSection);
  const heroRepo = ds.getRepository(HeroSlide);

  if ((await sectionRepo.count()) === 0) {
    const sections = [
      { type: "hero", title: "Hero Section", sortOrder: 0, isEnabled: true, layout: "default" },
      { type: "featured_campaigns", title: "Featured Campaigns", sortOrder: 1, isEnabled: true, layout: "grid" },
      { type: "emergency_appeals", title: "Emergency Appeals", sortOrder: 2, isEnabled: true, layout: "carousel" },
      { type: "impact_stats", title: "Impact Statistics", sortOrder: 3, isEnabled: true, layout: "default" },
      { type: "testimonials", title: "Testimonials", sortOrder: 4, isEnabled: true, layout: "carousel" },
      { type: "video_stories", title: "Video Stories", sortOrder: 5, isEnabled: true, layout: "grid" },
      { type: "featured_blogs", title: "Latest Stories", sortOrder: 6, isEnabled: true, layout: "grid" },
      { type: "partner_logos", title: "Our Partners", sortOrder: 7, isEnabled: true, layout: "default" },
      { type: "newsletter", title: "Newsletter Signup", sortOrder: 8, isEnabled: true, layout: "default" },
      { type: "faq", title: "Frequently Asked Questions", sortOrder: 9, isEnabled: true, layout: "default" },
      { type: "trust_badges", title: "Trust & Transparency", sortOrder: 10, isEnabled: true, layout: "default" },
      { type: "volunteer_cta", title: "Volunteer With Us", sortOrder: 11, isEnabled: true, layout: "default" },
    ];
    for (const s of sections) {
      await sectionRepo.save(sectionRepo.create(s));
    }
    console.log("Homepage sections seeded");
  }

  if ((await heroRepo.count()) === 0) {
    const slides = [
      {
        title: "Together We Can Make a Difference",
        subtitle: "Your donation delivers life-saving aid to families in crisis around the world.",
        ctaText: "Donate Now",
        ctaUrl: "/donate",
        sortOrder: 0,
        isVisible: true,
      },
      {
        title: "Emergency Appeal: Gaza Crisis",
        subtitle: "Urgent humanitarian aid needed. Every pound saves lives.",
        ctaText: "Give Now",
        ctaUrl: "/donate?cause=gaza",
        sortOrder: 1,
        isVisible: true,
      },
      {
        title: "Sponsor a Cause Today",
        subtitle: "From clean water to education — choose where your impact goes.",
        ctaText: "Browse Campaigns",
        ctaUrl: "/campaigns",
        sortOrder: 2,
        isVisible: true,
      },
    ];
    for (const s of slides) {
      await heroRepo.save(heroRepo.create(s));
    }
    console.log("Hero slides seeded");
  }
}
