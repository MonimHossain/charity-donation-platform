import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageAltFromSrc } from "@/lib/utils";

const CTA_IMG =
  "/images/cta-girl-C8v8b8Jp.webp";

const CTA = () => (
  <section className="container-wide py-20">
    <div className="relative overflow-hidden rounded-[2.5rem] gradient-plum text-primary-foreground p-10 md:p-16 lg:p-20 shadow-lift">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <Heart className="w-10 h-10 text-accent mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance">
            Your gift today becomes <span className="underline-brush">someone&apos;s tomorrow</span>.
          </h2>
          <p className="mt-6 text-primary-foreground/85 text-lg max-w-2xl">
            Join thousands of donors delivering food, water and dignity to families in crisis. Every donation, no matter the size, makes a measurable difference.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg">
              <Link href="/donate">Donate Now <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <img
            src={CTA_IMG}
            alt={imageAltFromSrc(CTA_IMG)}
            loading="lazy"
            className="w-full max-w-sm h-auto object-contain drop-shadow-2xl rounded-3xl"
          />
        </div>
      </div>
    </div>
  </section>
);

export default CTA;
