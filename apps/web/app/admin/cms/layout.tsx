"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageIcon, Calculator, Image, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CMS_TABS = [
  { label: "Hero", href: "/admin/cms/hero", icon: ImageIcon },
  { label: "Zakat page", href: "/admin/cms/zakat", icon: Calculator },
  { label: "File Manager", href: "/admin/cms/media", icon: Image },
  { label: "SEO", href: "/admin/cms/seo", icon: Search },
] as const;

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">CMS</h1>
        <p className="text-muted-foreground mt-1">Manage site content and media</p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit overflow-x-auto">
        {CMS_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
