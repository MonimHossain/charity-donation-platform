"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function CheckoutForm({
  donationId,
  onSuccess,
  onError,
}: {
  donationId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate/complete?provider=stripe&donationId=${donationId}`,
      },
      redirect: "if_required",
    });
    setProcessing(false);
    if (error) {
      onError(error.message || "Payment failed");
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button type="button" className="w-full h-12 rounded-2xl" onClick={handlePay} disabled={!stripe || processing}>
        {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : "Pay now"}
      </Button>
    </div>
  );
}

export function StripeCheckoutForm({
  publishableKey,
  clientSecret,
  donationId,
  onSuccess,
  onError,
}: {
  publishableKey: string;
  clientSecret: string;
  donationId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm donationId={donationId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
