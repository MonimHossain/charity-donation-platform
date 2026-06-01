"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import { demoBlogPosts, getBlogBySlug as mockGetPost } from "@/lib/mock/blog";
import { fetchBlogPosts, fetchBlogPostBySlug } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useBlogPosts(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.blogPosts(params),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { items: demoBlogPosts, total: demoBlogPosts.length };
      }
      const res = await fetchBlogPosts(params);
      return { items: res.items ?? res.data ?? res, total: res.total ?? 0 };
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: queryKeys.blogPost(slug),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const post = mockGetPost(slug);
        if (!post) throw new Error("Not found");
        return post;
      }
      return fetchBlogPostBySlug(slug);
    },
    enabled: Boolean(slug),
  });
}
