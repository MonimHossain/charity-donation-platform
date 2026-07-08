"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";
import { USE_MOCK_DATA } from "@/lib/config";
import { useCampaignsList } from "@/lib/data/campaigns";
import { demoCampaigns } from "@/lib/mock";

type SearchItem = {
  id: string;
  group: string;
  label: string;
  to: string;
  keywords?: string[];
};

const STATIC_PAGES: SearchItem[] = [
  { id: "page-home", group: "Pages", label: "Home", to: "/" },
  { id: "page-campaigns", group: "Pages", label: "Campaigns", to: "/campaigns" },
  { id: "page-zakat", group: "Pages", label: "Zakat Calculator", to: "/zakat-calculator" },
  { id: "page-about", group: "Pages", label: "About Us", to: "/about" },
  { id: "page-blog", group: "Pages", label: "Stories & Blog", to: "/blog" },
  { id: "page-contact", group: "Pages", label: "Contact", to: "/contact" },
  { id: "page-namaz", group: "Pages", label: "Namaz Times", to: "/namaz-times" },
  { id: "page-charities", group: "Pages", label: "Charities", to: "/charities" },
];

const MOCK_APPEALS: SearchItem[] = [
  { id: "appeal-gaza", group: "Appeals", label: "Gaza Emergency Appeal", to: "/causes/gaza", keywords: ["gaza", "emergency"] },
  { id: "appeal-orphans", group: "Appeals", label: "Orphan Sponsorship", to: "/causes/orphans", keywords: ["orphan"] },
  { id: "appeal-water", group: "Appeals", label: "Clean Water Wells", to: "/causes/water", keywords: ["water"] },
  { id: "appeal-food", group: "Appeals", label: "Food Aid", to: "/causes/food", keywords: ["food"] },
];

const STATIC_ACTIONS: SearchItem[] = [
  { id: "action-donate", group: "Actions", label: "Donate Now", to: "/donate" },
  { id: "account-login", group: "Account", label: "Sign In", to: "/auth/login" },
  { id: "account-me", group: "Account", label: "My Account", to: "/account" },
];

function campaignToSearchItem(c: Record<string, unknown>): SearchItem | null {
  const slug = String(c.slug ?? "").trim();
  if (!slug) return null;
  const title = String(c.title ?? slug).trim();
  const tags = Array.isArray(c.tags) ? (c.tags as string[]).map((t) => String(t).trim()).filter(Boolean) : [];
  const category = c.category ? String(c.category) : "";
  return {
    id: `campaign-${String(c.id ?? slug)}`,
    group: "Appeals",
    label: title,
    to: `/causes/${slug}`,
    keywords: [slug, category, ...tags].filter(Boolean),
  };
}

function buildAppealItems(campaignRows: unknown[]): SearchItem[] {
  if (USE_MOCK_DATA) {
    return MOCK_APPEALS;
  }
  const items: SearchItem[] = [];
  for (const row of campaignRows) {
    const item = campaignToSearchItem(row as Record<string, unknown>);
    if (item) items.push(item);
  }
  return items.sort((a, b) => a.label.localeCompare(b.label));
}

interface Props {
  variant?: "icon" | "pill" | "mobile";
  className?: string;
}

export default function GlobalSearch({ variant = "pill", className }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: campaignsData } = useCampaignsList({ limit: "100" });

  const appealSource = USE_MOCK_DATA ? demoCampaigns : (campaignsData?.items ?? []);
  const items = useMemo(() => {
    const appeals = buildAppealItems(appealSource);
    return [...STATIC_PAGES, ...appeals, ...STATIC_ACTIONS];
  }, [appealSource]);

  const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group))), [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-search-open", "true");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.removeAttribute("data-search-open");
    };
  }, [open]);

  const go = useCallback(
    (to: string) => {
      setOpen(false);
      router.push(to);
    },
    [router]
  );

  const trigger =
    variant === "pill" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/60 hover:bg-secondary/60 text-xs text-muted-foreground transition-colors",
          className
        )}
        aria-label="Search the site"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search…</span>
        <kbd className="ml-2 hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    ) : variant === "mobile" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full max-w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/60 min-w-0",
          className
        )}
        aria-label="Search the site"
      >
        <Search className="w-4 h-4 shrink-0 text-primary/70" />
        <span className="truncate">Search appeals, pages, actions…</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition",
          className
        )}
        aria-label="Search the site"
      >
        <Search className="w-4 h-4" />
      </button>
    );

  return (
    <>
      {trigger}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Site search"
        overlayClassName="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] sm:top-[12vh] z-[501] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 p-0 border-0 bg-transparent shadow-none outline-none notranslate"
        className="bg-card border border-border rounded-2xl shadow-lift overflow-hidden flex flex-col max-h-[min(85dvh,calc(100dvh-1.5rem))]"
        loop
        vimBindings={false}
      >
        <div className="shrink-0 px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 h-12 min-w-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search appeals, pages, actions…"
              className="flex-1 min-w-[6rem] h-full text-base sm:text-sm bg-transparent border-0 outline-none shadow-none placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Command.List className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 max-h-[min(50dvh,320px)]">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>
          {groups.map((g) => (
            <Command.Group
              key={g}
              heading={g}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:font-semibold"
            >
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <Command.Item
                    key={i.id}
                    value={i.id}
                    keywords={[i.label, ...(i.keywords ?? [])]}
                    onSelect={() => go(i.to)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="px-3 py-2.5 text-sm rounded-lg cursor-pointer text-foreground hover:bg-secondary data-[selected=true]:bg-secondary transition-colors"
                  >
                    {i.label}
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
