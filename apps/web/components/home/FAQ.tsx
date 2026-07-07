"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";

import { useFaqs } from "@/lib/data/cms";

const AccordionItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left font-serif text-xl text-primary hover:text-primary/80 py-6 transition-colors"
      >
        {q}
        <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[min(70vh,800px)] pb-6" : "max-h-0"}`}>
        <MarkdownRenderer
          content={a}
          className="text-muted-foreground text-base leading-relaxed prose prose-sm max-w-none dark:prose-invert"
        />
      </div>
    </div>
  );
};

const FAQ = () => {
  const { data: apiFaqs, isLoading } = useFaqs();
  const published = (apiFaqs ?? []).filter(
    (f: { isPublished?: boolean }) => f.isPublished !== false
  );

  if (isLoading) return null;
  if (!published.length) return null;

  const faqs = published.map((f: { question?: string; q?: string; answer?: string; a?: string }) => ({
    q: f.question ?? f.q ?? "",
    a: f.answer ?? f.a ?? "",
  }));

  return (
  <section className="container-wide py-24">
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4">
        <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">FAQ</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary leading-tight">Frequently asked questions.</h2>
        <p className="mt-4 text-muted-foreground">Can&apos;t find your answer? Reach out to our team — we&apos;re happy to help.</p>
      </div>
      <div className="lg:col-span-8">
        {faqs.map((f, i) => (
          <AccordionItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </div>
  </section>
  );
};

export default FAQ;
