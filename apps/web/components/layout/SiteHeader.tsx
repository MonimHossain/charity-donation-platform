"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User as UserIcon, ChevronDown, CalendarDays, Timer, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "./GlobalSearch";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { USE_MOCK_DATA } from "@/lib/config";
import { useHeaderNavCampaigns } from "@/lib/data/campaigns";
import { usePrayerTimes } from "@/lib/hooks/usePrayerTimes";
import { useDonationCart } from "@/lib/stores/donationCartStore";
import { useCurrency } from "@/lib/currency";

const mockNav = [
  { href: "/causes/food", label: "Food Aid" },
  { href: "/causes/water", label: "Water Projects" },
  { href: "/causes/livelihood", label: "Livelihood Projects" },
  { href: "/causes/orphans", label: "Orphan Sponsorship" },
  { href: "/zakat", label: "Zakat" },
];

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const aboutItems = [
  { href: "/about", label: "About" },
  { href: "/where-we-work", label: "Where we work" },
  { href: "/blog", label: "Stories" },
  { href: "/namaz-times", label: "Namaz times" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { islamicDate, nextPrayer, location: prayerLocation } = usePrayerTimes();
  const aboutRef = useRef<HTMLDivElement>(null);
  const { data: headerCampaigns } = useHeaderNavCampaigns();
  const { subtotal } = useDonationCart();
  const { formatMoney } = useCurrency();
  const basketLabel = formatMoney(subtotal, { decimals: 2 });

  const nav = useMemo(() => {
    if (USE_MOCK_DATA) return mockNav;

    const appealLinks = (headerCampaigns?.items ?? []).map((c: Record<string, unknown>) => ({
      href: `/causes/${String(c.slug)}`,
      label: String(c.title),
    }));

    return [...appealLinks, { href: "/zakat", label: "Zakat" }];
  }, [headerCampaigns?.items]);

  useEffect(() => {
    setOpen(false);
    setAboutOpen(false);
    setIsSignedIn(Boolean(localStorage.getItem("user_token")));
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled((prev) => {
          const y = window.scrollY;
          if (!prev && y > 72) return true;
          if (prev && y < 24) return false;
          return prev;
        });
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* Top bar — scrolls away naturally (avoids sticky height collapse jitter) */}
      <div className="bg-background border-b border-border/40">
        <div className="container-wide flex items-center justify-between gap-4 h-16">
          {/* Logo + Achievements */}
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Home" className="flex items-center">
              <img src="/images/logo-transparent.png" alt="Logo" className="h-10 w-auto select-none" draggable={false} />
            </Link>
            <img
              src="/images/achievements.webp"
              alt="100% Policy · Awards"
              className="hidden sm:block h-8 md:h-9 lg:h-10 w-auto select-none shrink-0"
              draggable={false}
            />
          </div>

          {/* Center: Islamic date + prayer time */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {islamicDate && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent-deep" />
                <div className="leading-tight">
                  <div className="text-[11px] text-muted-foreground">Today · Islamic Date</div>
                  <div className="font-semibold text-primary">{islamicDate}</div>
                </div>
              </div>
            )}
            {nextPrayer && (
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-accent-deep" />
                <div className="leading-tight">
                  <div className="text-[11px] text-muted-foreground">
                    Next Prayer{prayerLocation.label ? `: ${prayerLocation.label.split(",")[0]}` : ""}
                  </div>
                  <div className="font-semibold text-primary">
                    {nextPrayer.name} at {nextPrayer.time}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: search, language, currency, basket, account */}
          <div className="flex items-center gap-2">
            <GlobalSearch variant="icon" />
            <LanguageSwitcher />
            <CurrencySwitcher />
            <Link
              href="/donate"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-secondary text-primary text-xs font-semibold hover:bg-secondary/70"
              aria-label="Basket"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span className="tabular-nums">{basketLabel}</span>
            </Link>
            <Link
              href={isSignedIn ? "/account" : "/auth/login"}
              className="hidden sm:inline-flex h-9 px-3 items-center rounded-full border border-border text-xs font-semibold text-primary hover:bg-secondary transition"
            >
              {isSignedIn ? "My account" : "Sign in"}
            </Link>
            <Link
              href={isSignedIn ? "/account" : "/auth/login"}
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition"
              aria-label={isSignedIn ? "My account" : "Sign in"}
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50">
      {/* Sticky nav — fixed height, no collapse animation */}
      <div
        className={`transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300 ease-out border-b ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.4)] border-border/30"
            : "bg-background border-border/40"
        }`}
      >
        <div className="container-wide flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo appears when scrolled */}
            <Link
              href="/"
              aria-label="Home"
              aria-hidden={!scrolled}
              tabIndex={scrolled ? 0 : -1}
              className={`flex items-center shrink-0 overflow-hidden transition-[width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                scrolled ? "w-auto opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-2 pointer-events-none"
              }`}
            >
              <img src="/images/logo-transparent.png" alt="Logo" className="h-8 w-auto select-none" draggable={false} />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    isNavActive(pathname, n.href)
                      ? "text-primary bg-secondary"
                      : "text-foreground/75 hover:text-primary hover:bg-secondary/60"
                  }`}
                >
                  {n.label}
                </Link>
              ))}

              {/* About dropdown */}
              <div className="relative" ref={aboutRef}>
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full text-foreground/75 hover:text-primary hover:bg-secondary/60 inline-flex items-center gap-1 outline-none"
                >
                  About <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
                </button>
                {aboutOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lift py-1 min-w-[10rem] z-50">
                    {aboutItems.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className="block px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                      >
                        {i.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground">
              <Link href="/donate">Donate</Link>
            </Button>
            {/* Show extra controls when scrolled */}
            <div
              className={`flex items-center gap-2 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                scrolled ? "max-w-[420px] opacity-100 translate-x-0" : "max-w-0 opacity-0 translate-x-2 pointer-events-none"
              }`}
              aria-hidden={!scrolled}
            >
              <GlobalSearch variant="icon" />
              <LanguageSwitcher />
              <CurrencySwitcher />
              <Link
                href="/donate"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-secondary text-primary text-xs font-semibold hover:bg-secondary/70"
                aria-label="Basket"
                tabIndex={scrolled ? 0 : -1}
              >
                <ShoppingBasket className="w-4 h-4" />
                <span className="tabular-nums">{basketLabel}</span>
              </Link>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-1.5 ml-auto">
            <Button asChild size="sm" className="rounded-full h-9 px-3 bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground">
              <Link href="/donate">Donate</Link>
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative p-2 rounded-full text-primary hover:bg-secondary/60 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span className={`block transition-all duration-300 ${open ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}`}>
                <Menu className="w-5 h-5" />
              </span>
              <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${open ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"}`}>
                <X className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden bg-background border-b border-border/40 transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container-wide py-3 flex flex-col gap-0.5">
          {nav.map((n, idx) => (
            <Link
              key={n.href}
              href={n.href}
              style={{ transitionDelay: open ? `${idx * 30}ms` : "0ms" }}
              className={`px-4 py-3 rounded-xl text-[15px] transition-all duration-300 ${
                open ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
              } ${isNavActive(pathname, n.href) ? "bg-secondary text-primary font-semibold" : "text-foreground/80 hover:bg-secondary/50"}`}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-border/40">
            <div className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">About</div>
            {aboutItems.map((i, idx) => (
              <Link
                key={i.href}
                href={i.href}
                style={{ transitionDelay: open ? `${(nav.length + idx) * 30}ms` : "0ms" }}
                className={`block px-4 py-3 rounded-xl text-[15px] transition-all duration-300 ${
                  open ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
                } ${pathname === i.href ? "bg-secondary text-primary font-semibold" : "text-foreground/80 hover:bg-secondary/50"}`}
              >
                {i.label}
              </Link>
            ))}
          </div>
          {/* Mobile: search, language, currency, basket */}
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-2 px-1">
            <GlobalSearch variant="icon" />
            <LanguageSwitcher />
            <CurrencySwitcher />
            <Link
              href="/donate"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-secondary text-primary text-xs font-semibold hover:bg-secondary/70"
              aria-label="Basket"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span className="tabular-nums">{basketLabel}</span>
            </Link>
          </div>
          {/* Achievements badge on mobile */}
          <img
            src="/images/achievements.webp"
            alt="100% Policy · Awards"
            className="mt-3 mx-auto h-10 w-auto select-none"
            draggable={false}
          />
        </div>
      </div>
    </header>
    </>
  );
}
