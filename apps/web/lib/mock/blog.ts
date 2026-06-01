import type { DemoBlogPost } from "./types";
import { daysAgo } from "./format";

const img = (name: string) => `/images/${name}`;

export const demoBlogPosts: DemoBlogPost[] = [
  {
    id: "b1",
    slug: "inside-gaza-kitchens",
    title: "Inside Gaza's Community Kitchens",
    excerpt: "How our local partners are feeding thousands every day.",
    body: "Our partners operate community kitchens across Gaza, serving hot meals to families who have lost everything. Your donations fund flour, rice, cooking fuel and volunteer stipends.\n\nEvery meal is prepared with dignity — halal, nutritious, and delivered where conventional aid cannot reach.",
    status: "published",
    author: "Editor Demo",
    publishedAt: daysAgo(3),
    cover: img("appeal-gaza.jpg"),
  },
  {
    id: "b2",
    slug: "one-well-changes-lives",
    title: "One Well Changes Lives Forever",
    excerpt: "The lasting impact of clean water on a single village.",
    body: "When we completed the well in rural Sindh, women who had walked three hours each day wept with relief. Clean water means healthier children, more time for education, and sadaqah jariyah that outlives us all.",
    status: "published",
    author: "Editor Demo",
    publishedAt: daysAgo(10),
    cover: img("appeal-water.jpg"),
  },
  {
    id: "b3",
    slug: "ramadan-2026-appeal",
    title: "Ramadan 2026 Appeal Recap",
    excerpt: "Together you raised more than £1.2M during the blessed month.",
    body: "Alhamdulillah — your generosity during Ramadan 2026 funded iftar packs, Zakat distribution, and orphan sponsorship renewals across twelve countries.",
    status: "published",
    author: "Admin Demo",
    publishedAt: daysAgo(20),
    cover: img("appeal-food.jpg"),
  },
  {
    id: "b4",
    slug: "draft-orphan-stories",
    title: "Stories from our Orphan Programme",
    excerpt: "Coming soon — voices from the children you sponsor.",
    status: "draft",
    author: "Editor Demo",
    publishedAt: daysAgo(1),
    cover: img("appeal-orphan.jpg"),
  },
];

export const getBlogBySlug = (slug: string) =>
  demoBlogPosts.find((p) => p.slug === slug && p.status === "published");
