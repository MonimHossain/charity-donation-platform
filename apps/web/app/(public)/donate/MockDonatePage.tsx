"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ShieldCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import CurrencySwitcher from "@/components/layout/CurrencySwitcher";
import {
  CURRENCIES,
  type CurrencyCode,
  convert,
  formatCurrency,
  getCurrency,
  setCurrency,
} from "@/lib/currency";

const causes = [
  { id: "where-needed-most", label: "Where Needed Most" },
  { id: "gaza", label: "Gaza Emergency" },
  { id: "orphans", label: "Orphan Sponsorship" },
  { id: "water", label: "Water Wells" },
  { id: "food", label: "Food Aid" },
  { id: "zakat", label: "Zakat" },
];

export default function MockDonatePage() {
  const params = useSearchParams();
  const router = useRouter();
  const currency = getCurrency();

  useEffect(() => {
    const ccy = params.get("ccy") as CurrencyCode | null;
    if (ccy && CURRENCIES[ccy]) setCurrency(ccy);
  }, [params]);

  const [cause, setCause] = useState(params.get("cause") || "where-needed-most");
  const [amount, setAmount] = useState(Number(params.get("amount")) || convert(50));
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<"single" | "monthly">(
    (params.get("freq") as "single" | "monthly") || "single"
  );
  const [giftAid, setGiftAid] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const presets = useMemo(() => [25, 50, 100, 250, 500].map(convert), [currency.code]);

  const final = Number(custom) || amount;
  const giftAidExtra =
    giftAid && currency.code === "GBP" ? +(final * 0.25).toFixed(2) : 0;
  const total = (final + giftAidExtra).toFixed(2);

  const format = (n: number) => formatCurrency(n, currency.code);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    const q = new URLSearchParams({
      amount: String(final),
      currency: currency.code,
      frequency: freq,
      giftAid: String(giftAid),
      campaign: cause,
    });
    router.push(`/thank-you?${q.toString()}`);
  };

  return (
    <PageShell
      title="Donate — Express Checkout"
      description="Donate in seconds. Secure checkout (demo)."
    >
      <section className="bg-secondary/40 border-b border-border">
        <div className="container-wide py-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Secure 256-bit SSL
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Reg. Charity 1192710
            </span>
          </div>
        </div>
      </section>

      <section className="container-wide py-10 lg:py-14 grid lg:grid-cols-12 gap-8">
        <form onSubmit={submit} className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-primary">Donate in seconds</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  One page. No account required. Demo checkout.
                </p>
              </div>
              <CurrencySwitcher />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-full bg-secondary">
              {(["single", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFreq(f)}
                  className={`py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${
                    freq === f
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  {f === "single" ? "Single gift" : "Monthly"}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Amount ({currency.symbol})
              </Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {presets.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustom("");
                    }}
                    className={`py-3 rounded-xl font-bold text-base transition-all ${
                      amount === a && !custom
                        ? "bg-accent text-accent-foreground shadow-glow"
                        : "bg-secondary hover:bg-secondary/70"
                    }`}
                  >
                    {format(a)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Other amount"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="mt-3 rounded-xl h-12"
              />
            </div>

            <div className="mt-6">
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">Cause</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {causes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCause(c.id)}
                    className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
                      cause === c.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {currency.code === "GBP" && (
              <label className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftAid}
                  onChange={(e) => setGiftAid(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-semibold text-primary">Add Gift Aid (+25%)</span>
                  <span className="block text-muted-foreground mt-0.5">
                    Boost your {format(final)} by {format(giftAidExtra)} at no extra cost.
                  </span>
                </span>
              </label>
            )}
          </div>

          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
            >
              <Heart className="w-5 h-5" />
              {submitting ? "Processing…" : `Donate ${format(Number(total))} now`}
            </Button>
          </div>
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift">
            <p className="text-xs uppercase tracking-widest text-accent font-bold">Your gift</p>
            <p className="font-serif text-5xl mt-1">{format(Number(total))}</p>
            <p className="text-sm text-primary-foreground/75 mt-1">
              {format(final)} to {causes.find((c) => c.id === cause)?.label}
            </p>
          </div>
          <Link
            href="/campaigns/gaza"
            className="mt-4 flex items-center justify-between gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm"
          >
            <span className="font-semibold text-destructive">Gaza emergency</span>
            <ArrowRight className="w-4 h-4 text-destructive" />
          </Link>
        </aside>
      </section>
    </PageShell>
  );
}
