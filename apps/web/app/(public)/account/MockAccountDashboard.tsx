"use client";

import Link from "next/link";
import { Heart, TrendingUp, Repeat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/lib/mock-auth";
import { getDonationsForUser } from "@/lib/mock/donations";
import { getSubscriptionsForUser } from "@/lib/mock/subscriptions";
import { fmtMoney, fmtDate } from "@/lib/mock/format";

export default function MockAccountDashboard() {
  const { user } = useMockAuth();
  const email = user?.email ?? "user@example.com";
  const donations = getDonationsForUser(email);
  const subs = getSubscriptionsForUser(email);
  const total = donations.reduce((s, d) => s + (d.status === "succeeded" ? d.amount : 0), 0);

  return (
    <div className="container-wide py-12">
      <h1 className="font-serif text-3xl text-primary">Welcome, {user?.name ?? "Donor"}</h1>
      <p className="text-muted-foreground mt-1">Demo account — mock data only.</p>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl gradient-plum text-primary-foreground p-6">
          <TrendingUp className="w-6 h-6 text-accent" />
          <p className="mt-4 text-sm opacity-80">Total given</p>
          <p className="font-serif text-3xl">{fmtMoney(total)}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-6">
          <Heart className="w-6 h-6 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Donations</p>
          <p className="font-serif text-3xl text-primary">{donations.length}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-6">
          <Repeat className="w-6 h-6 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Active recurring</p>
          <p className="font-serif text-3xl text-primary">
            {subs.filter((s) => s.status === "active").length}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-primary">Recent donations</h2>
          <Button variant="ghost" asChild>
            <Link href="/account/history">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {donations.slice(0, 5).map((d) => (
            <li key={d.id} className="flex justify-between px-6 py-4 text-sm">
              <div>
                <p className="font-medium">{d.campaignTitle}</p>
                <p className="text-muted-foreground">{fmtDate(d.date)} · {d.frequency}</p>
              </div>
              <span className="font-semibold">{fmtMoney(d.amount, d.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
