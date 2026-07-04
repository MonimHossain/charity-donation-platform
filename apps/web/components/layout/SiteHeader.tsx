"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User as UserIcon, ChevronDown, CalendarDays, Timer, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "./GlobalSearch";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { SiteLogo } from "./SiteLogo";
import { USE_MOCK_DATA } from "@/lib/config";
import { useHeaderNavCampaigns, headerNavLabel } from "@/lib/data/campaigns";
import { usePrayerTimes } from "@/lib/hooks/usePrayerTimes";
import { useDonationCart } from "@/lib/stores/donationCartStore";
import { useCurrency } from "@/lib/currency";
import { useLocale } from "@/lib/i18n";
import { DropdownPortal } from "./DropdownPortal";
import { DonateButtonEffect } from "@/components/ui/DonateButtonEffect";
import { UserNotificationBell } from "@/components/notifications/UserNotificationBell";
import { cn } from "@/lib/utils";

const mockNav = [
  { href: "/causes/food", label: "Food Aid" },
  { href: "/causes/water", label: "Water Projects" },
  { href: "/causes/livelihood", label: "Livelihood Projects" },
  { href: "/causes/orphans", label: "Orphan Sponsorship" },
  { href: "/zakat", label: "Zakat", highlight: true },
];

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { islamicDate, nextPrayer, location: prayerLocation } = usePrayerTimes();
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const { data: headerCampaigns } = useHeaderNavCampaigns();
  const { basketDisplayTotal } = useDonationCart();
  const { formatMoney } = useCurrency();
  const { t } = useLocale();
  const basketLabel = formatMoney(basketDisplayTotal);

  const aboutItems = useMemo(
    () => [
      { href: "/about", label: t("nav.about") },
      { href: "/where-we-work", label: t("nav.whereWeWork") },
      { href: "/blog", label: t("nav.blog") },
      { href: "/namaz-times", label: t("nav.namazTimes") },
      { href: "/contact", label: t("nav.contact") },
    ],
    [t]
  );

  const nav = useMemo(() => {
    if (USE_MOCK_DATA) {
      return mockNav.map((item) =>
        item.href === "/zakat" ? { ...item, label: t("nav.zakat") } : item
      );
    }

    const appealLinks = (headerCampaigns?.items ?? []).map((c: Record<string, unknown>) => ({
      href: `/causes/${String(c.slug)}`,
      label: headerNavLabel(c),
    }));

    return [...appealLinks, { href: "/zakat", label: t("nav.zakat"), highlight: true }];
  }, [headerCampaigns?.items, t]);

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
      const target = e.target as Node;
      if (aboutRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-dropdown-portal]")) return;
      setAboutOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinkClass = (href: string, highlight?: boolean) =>
    cn(
      "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
      highlight
        ? "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground donate-button-effect"
        : isNavActive(pathname, href)
          ? "text-primary bg-secondary"
          : "text-foreground/75 hover:text-primary hover:bg-secondary/60"
    );

  const donateButton = (
    <DonateButtonEffect className="rounded-full">
      <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground h-9 px-3">
        <Link href="/donate">{t("nav.donate")}</Link>
      </Button>
    </DonateButtonEffect>
  );

  return (
    <>
      <div className="bg-background border-b border-border/40">
        <div className="container-wide flex items-center justify-between gap-2 sm:gap-4 h-14 md:h-16">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/" aria-label="Home" className="flex items-center shrink-0">
              <SiteLogo heightClass="h-8 sm:h-9 md:h-10" />
            </Link>
            <img
              src="/images/achievements.webp"
              alt="100% Policy · Awards"
              className="hidden sm:block h-8 md:h-9 lg:h-10 w-auto select-none shrink-0"
              draggable={false}
            />
          </div>

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

          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <GlobalSearch variant="icon" />
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
            <div className="flex md:hidden items-center gap-0.5 shrink-0">
              <LanguageSwitcher compact />
              <CurrencySwitcher compact />
            </div>
            <Link
              href="/donate"
              className="inline-flex items-center justify-center gap-1 h-9 min-w-9 px-2 sm:px-3 rounded-full bg-secondary text-primary text-xs font-semibold hover:bg-secondary/70"
              aria-label="Basket"
            >
              <ShoppingBasket className="w-4 h-4 shrink-0" />
              <span className="tabular-nums hidden sm:inline">{basketLabel}</span>
            </Link>
            {isSignedIn && (
              <span className="hidden sm:inline-flex">
                <UserNotificationBell />
              </span>
            )}
            <Link
              href={isSignedIn ? "/account" : "/auth/login"}
              className="hidden md:inline-flex h-9 px-3 items-center rounded-full border border-border text-xs font-semibold text-primary hover:bg-secondary transition"
            >
              {isSignedIn ? t("nav.account") : t("nav.login")}
            </Link>
            <Link
              href={isSignedIn ? "/account" : "/auth/login"}
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition"
              aria-label={isSignedIn ? t("nav.account") : t("nav.login")}
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50">
        <div
          className={`transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300 ease-out border-b ${
            scrolled
              ? "bg-background/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.4)] border-border/30"
              : "bg-background border-border/40"
          }`}
        >
          <div className="container-wide flex items-center justify-between h-12 sm:h-14 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none">
              {!scrolled && (
                <img
                  src="/images/achievements.webp"
                  alt="100% Policy · Awards"
                  className="lg:hidden h-7 sm:h-8 w-auto max-w-[min(100%,10rem)] object-contain object-left select-none shrink"
                  draggable={false}
                />
              )}
              <Link
                href="/"
                aria-label="Home"
                className={cn(
                  "flex items-center shrink-0 overflow-hidden transition-[width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
                  scrolled ? "w-auto opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-2 pointer-events-none"
                )}
                aria-hidden={!scrolled}
                tabIndex={scrolled ? 0 : -1}
              >
                <SiteLogo heightClass="h-8" />
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className={navLinkClass(n.href, n.highlight)}>
                    {n.label}
                  </Link>
                ))}

                <div className="relative" ref={aboutRef}>
                  <button
                    ref={aboutButtonRef}
                    onClick={() => setAboutOpen(!aboutOpen)}
                    className="px-3 py-1.5 text-sm font-medium rounded-full text-foreground/75 hover:text-primary hover:bg-secondary/60 inline-flex items-center gap-1 outline-none"
                  >
                    {t("nav.about")}{" "}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
                  </button>
                  <DropdownPortal
                    open={aboutOpen}
                    triggerRef={aboutButtonRef}
                    className="bg-card border border-border rounded-xl shadow-lift py-1 min-w-[10rem]"
                  >
                    {aboutItems.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className="block px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                        onClick={() => setAboutOpen(false)}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </DropdownPortal>
                </div>
              </nav>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              {donateButton}
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

            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              {donateButton}
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

        <div
          className={`lg:hidden overflow-hidden bg-background border-b border-border/40 transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="container-wide py-3 flex flex-col gap-0.5">
            <div className="px-1 pb-3 lg:hidden">
              <GlobalSearch variant="mobile" />
            </div>
            {nav.map((n, idx) => (
              <Link
                key={n.href}
                href={n.href}
                style={{ transitionDelay: open ? `${idx * 30}ms` : "0ms" }}
                className={cn(
                  "px-4 py-3 rounded-xl text-[15px] transition-all duration-300",
                  open ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
                  n.highlight
                    ? "bg-accent text-accent-foreground font-semibold donate-button-effect"
                    : isNavActive(pathname, n.href)
                      ? "bg-secondary text-primary font-semibold"
                      : "text-foreground/80 hover:bg-secondary/50"
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                {t("nav.about")}
              </div>
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
          </div>
        </div>
      </header>
    </>
  );
}
