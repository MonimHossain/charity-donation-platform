"use client";

import { useEffect, useState } from "react";
import { fetchStripeCustomerSession, fetchUserProfile } from "@/lib/api";

export type CheckoutDonorPrefill = {
  name: string;
  email: string;
  phone: string;
};

export type StripeCustomerCheckout = {
  customerId: string;
  customerSessionClientSecret: string;
};

export function useCheckoutDonorPrefill() {
  const [prefill, setPrefill] = useState<CheckoutDonorPrefill | null>(null);
  const [stripeCustomer, setStripeCustomer] = useState<StripeCustomerCheckout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchUserProfile().catch(() => null),
      fetchStripeCustomerSession().catch(() => null),
    ])
      .then(([profile, stripeSession]) => {
        if (profile) {
          setPrefill({
            name: String(profile.fullName || profile.name || ""),
            email: String(profile.email || ""),
            phone: String(profile.phone || ""),
          });
        }
        if (stripeSession?.customerId && stripeSession?.customerSessionClientSecret) {
          setStripeCustomer(stripeSession);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { prefill, stripeCustomer, loading };
}
