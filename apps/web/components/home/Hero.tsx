"use client";

import { ArrowRight } from "lucide-react";
import QuickDonate from "./QuickDonate";
import { homeOutlineButtonClass } from "@/lib/home-buttons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

import { heroSlides as fallbackSlides } from "@/lib/mock/home";
import { useHeroSlides } from "@/lib/data/cms";

function normalizeSlides(raw: unknown[]): typeof fallbackSlides {
  if (!raw?.length) return fallbackSlides;
  return raw.map((s: Record<string, string>, i) => ({
    img: s.backgroundImage || fallbackSlides[i % fallbackSlides.length]?.img || "/images/hero-1.webp",
    alt: s.title || "Hero slide",
    quote: s.title || s.subtitle || "",
    cite: s.subtitle ? `— ${s.subtitle}` : "",
  }));
}

const Hero = () => {
  const { data: rawSlides } = useHeroSlides();
  const slides = normalizeSlides((rawSlides as unknown[]) ?? fallbackSlides);
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [imgHeight, setImgHeight] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      if (window.innerWidth < 1024) {
        setImgHeight(null);
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY;
      const available = window.innerHeight - top - 24;
      const clamped = Math.max(360, Math.min(available, 640));
      setImgHeight(clamped);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background">
      <div aria-hidden className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-mint-soft/60 blur-3xl -z-10" />

      <div className="container-wide pt-2 pb-5 lg:pt-4 lg:pb-8 grid lg:grid-cols-12 gap-6 items-center">
        {/* LEFT: focused copy */}
        <div className="lg:col-span-6 animate-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-accent-deep text-[11px] font-bold tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Delivering mercy worldwide
          </span>

          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-[1.05] tracking-tight text-primary text-balance">
            Give with purpose.{" "}
            <span className="underline-brush">change lives</span>.
          </h1>

          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-lg leading-relaxed">
            Your Zakat and Sadaqah reach the world&apos;s most vulnerable — from Gaza to Sudan — transforming hardship into lasting hope.
          </p>

          <div className="mt-5">
            <QuickDonate variant="banner" campaign="gaza" defaultAmount={50} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/campaigns" className={`${homeOutlineButtonClass} px-6 py-3 text-sm`}>
              Browse appeals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* RIGHT: editorial image slider */}
        <div
          className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-lift h-[320px] sm:h-[420px] lg:h-[540px] xl:h-[600px]"
          style={imgHeight ? { height: `${imgHeight}px` } : undefined}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== index}
            >
              <img
                src={s.img}
                alt={s.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
                <p className="font-serif italic text-lg lg:text-xl leading-snug max-w-md">&ldquo;{s.quote}&rdquo;</p>
                <p className="text-xs text-primary-foreground/80 mt-1.5 tracking-widest uppercase">{s.cite}</p>
              </div>
            </div>
          ))}

          <div className="absolute bottom-3 right-5 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/50 hover:bg-primary-foreground/80"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
