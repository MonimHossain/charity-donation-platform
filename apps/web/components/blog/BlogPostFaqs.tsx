"use client";

import { useState } from "react";
import RichContentRenderer from "@/components/blog/RichContentRenderer";
import type { EntityFaqItem } from "@repo/shared-types";
import { cn } from "@/lib/utils";

export function BlogPostFaqs({ faqs, className }: { faqs: EntityFaqItem[]; className?: string }) {
  const items = faqs.filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (!items.length) return null;

  return (
    <section className={cn("mt-12 border-t border-gray-200 pt-10", className)}>
      <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
      <ul className="mt-6 space-y-3">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                {item.question}
                <span className="text-purple-600 text-xl leading-none">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <RichContentRenderer content={item.answer} className="!text-base" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
