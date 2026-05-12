"use client";

import { Star, Quote, UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Aisha R.",
    role: "Monthly donor · London",
    quote: "I trust Your Impact Foundation with my Zakat every year. The transparency and updates make it feel personal.",
    rating: 5,
  },
  {
    name: "Mohammed K.",
    role: "Donor · Manchester",
    quote: "Sponsoring an orphan through them changed how I think about charity. I receive real updates, real photos, real impact.",
    rating: 5,
  },
  {
    name: "Fatima S.",
    role: "Gift Aid donor · Birmingham",
    quote: "Fast checkout, Apple Pay, Gift Aid added in one tap. This is how Muslim charity giving should feel in 2026.",
    rating: 5,
  },
  {
    name: "Yusuf A.",
    role: "Donor · Leeds",
    quote: "The impact reports are detailed and honest. I finally feel my donations are reaching the right hands.",
    rating: 5,
  },
  {
    name: "Hana B.",
    role: "Monthly donor · Bristol",
    quote: "Setting up a recurring donation took 30 seconds. Beautiful experience end to end.",
    rating: 5,
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setPerView(1);
      else if (window.innerWidth < 1024) setPerView(2);
      else setPerView(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, testimonials.length - perView);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [maxIndex, index]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [maxIndex]);

  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));

  return (
    <section className="bg-secondary/40 border-y border-border">
      <div className="container-wide py-16 sm:py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Trusted by donors</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-primary text-balance">
            Real people. <span className="underline-brush">Real impact.</span>
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span><strong className="text-foreground">4.9/5</strong> from 2,400+ reviews</span>
          </div>
        </div>

        <div className="relative mt-10 sm:mt-14">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
            >
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / perView}%` }}
                >
                  <div className="relative flex flex-col gap-4 p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-soft hover:shadow-lift transition-shadow h-full">
                    <Quote className="w-7 h-7 text-accent shrink-0" aria-hidden />
                    <blockquote className="text-foreground/90 leading-relaxed text-[15px]">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <div className="mt-auto flex items-center gap-3 pt-2 border-t border-border/60">
                      <div className="grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        <UserRound className="w-5 h-5" aria-hidden />
                      </div>
                      <figcaption>
                        <p className="font-semibold text-primary text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </figcaption>
                      <div className="ml-auto flex" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full h-10 w-10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/60"}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full h-10 w-10"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
