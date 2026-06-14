import { Heart, Globe, Users, ShieldCheck, Award, Target } from "lucide-react";
import { statValueSmClass } from "@/lib/home-buttons";

const values = [
  { icon: Heart, title: "Compassion", desc: "We lead with empathy, treating every person with dignity and respect regardless of background." },
  { icon: ShieldCheck, title: "Transparency", desc: "100% donation policy on Zakat. Every penny is accounted for with full public audits." },
  { icon: Globe, title: "Global Reach", desc: "We operate across 30+ countries, delivering aid where it's needed most." },
  { icon: Target, title: "Impact Focused", desc: "Data-driven approach ensuring maximum impact per donation received." },
  { icon: Users, title: "Community", desc: "Building lasting partnerships with local communities for sustainable change." },
  { icon: Award, title: "Excellence", desc: "Award-winning charity recognized for operational efficiency and donor care." },
];

const stats = [
  { value: "30+", label: "Countries Reached" },
  { value: "2.4M+", label: "Lives Impacted" },
  { value: "12K+", label: "Active Donors" },
  { value: "98%", label: "Donor Satisfaction" },
];

export default function AboutPage() {
  return (
    <>
      <section className="gradient-hero py-16 lg:py-24">
        <div className="container-wide text-center">
          <span className="text-xs uppercase tracking-widest font-bold text-primary">About Us</span>
          <h1 className="mt-3 font-serif text-4xl lg:text-5xl text-foreground text-balance">
            Making a <em className="not-italic italic text-primary">Difference</em> Together
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We are a UK-registered charity dedicated to delivering life-saving aid and sustainable
            development programs to communities affected by conflict, poverty, and natural disasters.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-primary">Our Mission</span>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-foreground">
                Empowering Communities Worldwide
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Founded with the belief that every human being deserves access to basic necessities,
                our charity works tirelessly to provide food, clean water, education, healthcare, and
                emergency relief to those who need it most.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Through transparent operations and a 100% donation policy on Zakat, we ensure that
                your generosity reaches the people who need it — without any deductions for
                administrative costs.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lift h-[400px] bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <div className="text-center text-primary-foreground p-8">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <p className="font-serif text-2xl italic">&ldquo;Together we can change the world, one life at a time.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container-wide">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-6 rounded-3xl bg-card border border-border shadow-soft">
                <p className={statValueSmClass}>{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest font-bold text-primary">Our Values</span>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-foreground">What Drives Us</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="p-6 rounded-3xl bg-card border border-border shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
