"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";

const items = [
  { group: "Pages", label: "Home", to: "/" },
  { group: "Pages", label: "Campaigns", to: "/campaigns" },
  { group: "Pages", label: "Zakat Calculator", to: "/zakat-calculator" },
  { group: "Pages", label: "About Us", to: "/about" },
  { group: "Pages", label: "Stories & Blog", to: "/blog" },
  { group: "Pages", label: "Contact", to: "/contact" },
  { group: "Appeals", label: "Gaza Emergency Appeal", to: "/donate?cause=gaza" },
  { group: "Appeals", label: "Orphan Sponsorship", to: "/donate?cause=orphans" },
  { group: "Appeals", label: "Clean Water Wells", to: "/donate?cause=water" },
  { group: "Appeals", label: "Food Aid", to: "/donate?cause=food" },
  { group: "Actions", label: "Donate Now", to: "/donate" },
  { group: "Account", label: "Sign In", to: "/auth/login" },
  { group: "Account", label: "My Account", to: "/account" },
];

interface Props {
  variant?: "icon" | "pill" | "mobile";
  className?: string;
}

export default function GlobalSearch({ variant = "pill", className }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-search-open", "true");
    return () => {
      document.body.style.overflow = prev;
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

  const groups = Array.from(new Set(items.map((i) => i.group)));

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
          "flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/60",
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

      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-[12vh]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg min-w-0">
            <Command
              label="Site search"
              className="bg-card border border-border rounded-2xl shadow-lift overflow-hidden"
            >
              <div className="px-3 py-3 border-b border-border">
                <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 h-12">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Command.Input
                    placeholder="Search appeals, pages, actions…"
                    className="flex-1 min-w-0 h-full text-sm bg-transparent border-0 outline-none shadow-none placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                    autoFocus
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
              <Command.List className="max-h-[min(50vh,320px)] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                {groups.map((g) => (
                  <Command.Group
                    key={g}
                    heading={g}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:font-semibold"
                  >
                    {items
                      .filter((i) => i.group === g)
                      .map((i) => (
                        <Command.Item
                          key={i.to}
                          value={i.label}
                          onSelect={() => go(i.to)}
                          className="px-3 py-2.5 text-sm rounded-lg cursor-pointer text-foreground hover:bg-secondary data-[selected=true]:bg-secondary transition-colors"
                        >
                          {i.label}
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
