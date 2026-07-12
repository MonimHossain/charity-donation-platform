"use client";

import Link from "next/link";
import { Mail, Phone, Facebook, Instagram } from "lucide-react";
import { SiteLogo } from "./SiteLogo";
import { useLocale } from "@/lib/i18n";

export default function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer id="site-footer" className="mt-24 bg-primary text-primary-foreground">
      <div className="container-wide py-16 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" className="inline-flex items-center bg-white/95 rounded-xl px-3 py-2" aria-label="Home">
            <SiteLogo heightClass="h-10" />
          </Link>
          <p className="mt-5 text-primary-foreground/80 leading-relaxed max-w-sm">
            A faith-driven international NGO based in the UK, supporting communities affected by conflict, poverty, hunger and injustice.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="grid place-items-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="grid place-items-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-serif text-lg mb-4">{t("footer.appeals")}</h4>
          <ul className="space-y-2 text-primary-foreground/75 text-sm">
            <li><Link href="/campaigns?category=food" className="hover:text-accent transition-colors">Food Aid</Link></li>
            <li><Link href="/campaigns?category=emergency" className="hover:text-accent transition-colors">Emergency Aid</Link></li>
            <li><Link href="/campaigns?category=water" className="hover:text-accent transition-colors">Water Projects</Link></li>
            <li><Link href="/campaigns?category=livelihood" className="hover:text-accent transition-colors">Livelihood</Link></li>
            <li><Link href="/campaigns?category=orphan" className="hover:text-accent transition-colors">Orphan Sponsorship</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-serif text-lg mb-4">{t("footer.explore")}</h4>
          <ul className="space-y-2 text-primary-foreground/75 text-sm">
            <li><Link href="/about" className="hover:text-accent transition-colors">About</Link></li>
            <li><Link href="/zakat-calculator" className="hover:text-accent transition-colors">{t("nav.zakat")}</Link></li>
            <li><Link href="/blog" className="hover:text-accent transition-colors">Stories</Link></li>
            <li><Link href="/namaz-times" className="hover:text-accent transition-colors">Namaz Times</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            <li><Link href="/auth/login" className="hover:text-accent transition-colors">Sign in</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h4 className="font-serif text-lg mb-4">{t("footer.contact")}</h4>
          <ul className="space-y-3 text-primary-foreground/80 text-sm">
            <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-accent" /><a href="tel:03335330642" className="hover:text-accent transition-colors">0333 533 0642</a></li>
            <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-accent" /><a href="mailto:info@yourcharity.org" className="hover:text-accent break-all transition-colors">info@yourcharity.org</a></li>
          </ul>
          <div className="mt-6 p-4 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold">{t("footer.policy")}</p>
            <p className="text-sm mt-1 text-primary-foreground/80">{t("footer.policyDesc")}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-wide py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Your Impact Foundation. Charity Reg. No. 1192710</p>
          <p>Helping Humans Around the World in Need.</p>
        </div>
      </div>
    </footer>
  );
}
