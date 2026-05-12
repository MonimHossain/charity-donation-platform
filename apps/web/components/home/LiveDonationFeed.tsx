"use client";

import { useEffect, useState } from "react";
import { Heart, Clock } from "lucide-react";

interface RecentDonation {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  campaignTitle?: string;
  createdAt: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "C$", AUD: "A$",
};

export default function LiveDonationFeed() {
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/recent`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDonations(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (donations.length === 0) return;
    const id = setInterval(() => {
      setVisible((v) => (v + 1) % Math.min(donations.length, 8));
    }, 3000);
    return () => clearInterval(id);
  }, [donations]);

  if (donations.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-30 max-w-xs animate-fade-up">
      <div className="rounded-xl bg-card border border-border shadow-lift p-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
          <Heart className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {donations[visible]?.donorName} donated{" "}
            <span className="text-accent font-bold">
              {CURRENCY_SYMBOLS[donations[visible]?.currency || "GBP"]}
              {donations[visible]?.amount}
            </span>
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(donations[visible]?.createdAt || new Date().toISOString())}
            {donations[visible]?.campaignTitle && (
              <span className="truncate"> &middot; {donations[visible]?.campaignTitle}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
