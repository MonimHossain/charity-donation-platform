import { ShieldCheck, BadgeCheck, Lock, HeartHandshake } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "UK Reg. Charity", value: "No. 1192710" },
  { icon: BadgeCheck, label: "100% Donation", value: "Zakat policy" },
  { icon: Lock, label: "Secure Checkout", value: "256-bit SSL" },
  { icon: HeartHandshake, label: "120,000+ Donors", value: "Trust us monthly" },
];

const TrustBadges = () => (
  <section className="border-y border-border bg-secondary/40">
    <div className="container-wide py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
            <it.icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight">{it.label}</p>
            <p className="text-xs text-muted-foreground truncate">{it.value}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TrustBadges;
