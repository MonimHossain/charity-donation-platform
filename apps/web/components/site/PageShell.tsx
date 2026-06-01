"use client";

import { useEffect, type ReactNode } from "react";

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function PageShell({ title, description, children }: PageShellProps) {
  useEffect(() => {
    document.title = title;
    const meta =
      document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
    if (!meta.parentElement) document.head.appendChild(meta);
    window.scrollTo(0, 0);
  }, [title, description]);

  return <>{children}</>;
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <section className="gradient-warm border-b border-border">
      <div className="container-wide pt-24 pb-20 lg:pt-32 lg:pb-28">
        <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl lg:text-7xl text-primary leading-[1.05] max-w-4xl text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
    </section>
  );
}
