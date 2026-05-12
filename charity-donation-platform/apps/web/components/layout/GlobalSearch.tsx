"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Command } from "cmdk";

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
  { group: "Account", label: "Sign In", to: "/login" },
  { group: "Account", label: "My Account", to: "/account" },
];

interface Props {
  variant?: "icon" | "pill";
}

export default function GlobalSearch({ variant = "pill" }: Props) {
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

  const go = useCallback(
    (to: string) => {
      setOpen(false);
      router.push(to);
    },
    [router]
  );

  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/60 hover:bg-secondary/60 text-xs text-muted-foreground transition-colors"
          aria-label="Search the site"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition"
          aria-label="Search the site"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-[15vh] max-w-lg w-full px-4">
            <Command className="bg-card border border-border rounded-2xl shadow-lift overflow-hidden">
              <div className="flex items-center border-b border-border px-4">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Command.Input
                  placeholder="Search appeals, pages, actions…"
                  className="flex-1 h-12 px-3 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
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
