"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (!USE_MOCK_DATA) {
        await subscribeNewsletter(email);
      }
      setDone(true);
      toast.success("You're subscribed. Jazak Allah Khair!");
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-wide py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl gradient-plum text-primary-foreground p-8 sm:p-12 lg:p-16 shadow-lift">
        <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
              <Mail className="w-3.5 h-3.5" /> Stay updated
            </span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-balance">
              Stories of impact, straight to your inbox.
            </h2>
            <p className="mt-3 text-primary-foreground/80 max-w-md">
              Monthly updates on emergency appeals, Zakat distribution and the lives changed by your generosity. No spam — unsubscribe anytime.
            </p>
          </div>

          <form onSubmit={submit} className="lg:justify-self-end w-full max-w-md">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-accent"
              />
              <Button type="submit" disabled={loading || done} className="rounded-full whitespace-nowrap bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground" size="lg">
                {done ? <><CheckCircle2 className="w-4 h-4" /> Subscribed</> : loading ? "Subscribing…" : "Subscribe"}
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-primary-foreground/60">
              By subscribing you agree to our privacy policy. Read by 28,000+ donors monthly.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
