import Link from "next/link";
import { Button } from "@/components/ui/button";

const StorySection = () => (
  <section className="container-wide py-24 grid lg:grid-cols-12 gap-12 items-center">
    <div className="lg:col-span-6 relative">
      <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
        <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=70" alt="Aid distribution" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="hidden md:block absolute -bottom-8 -right-6 bg-accent text-accent-foreground rounded-2xl p-6 max-w-xs shadow-glow">
        <p className="font-serif text-3xl font-bold leading-tight">Sadaqah Jariyah</p>
        <p className="text-sm mt-1 text-accent-foreground/80">Ongoing charity that rewards you for generations.</p>
      </div>
    </div>

    <div className="lg:col-span-6">
      <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Why Your Impact</p>
      <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary leading-tight text-balance">
        Trust, clarity and <span className="underline-brush">real impact</span>.
      </h2>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        Recognised among the best Islamic charities in the UK, we make it simple to give Zakat, Sadaqah and emergency aid online — with full transparency every step of the way.
      </p>
      <ul className="mt-8 space-y-4">
        {[
          "UK registered & fully transparent reporting",
          "100% donation policy on Zakat",
          "Working across Palestine, Yemen, Syria, Africa & Asia",
          "Humanitarian aid in emergencies and long-term needs",
        ].map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-accent shrink-0" />
            <span className="text-foreground/85">{p}</span>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="mt-10 rounded-full">
        <Link href="/about">Read our story</Link>
      </Button>
    </div>
  </section>
);

export default StorySection;
