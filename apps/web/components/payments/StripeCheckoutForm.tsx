"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type {
  PaymentRequest as StripePaymentRequest,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { confirmStripePayment, createStripePaymentIntent } from "@/lib/api";

const CURRENCY_COUNTRY: Record<string, string> = {
  GBP: "GB",
  USD: "US",
  EUR: "IE",
  CAD: "CA",
  AUD: "AU",
};

function OrPayByCardDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="flex-1 border-t border-border" />
      <span className="px-3 text-xs text-muted-foreground">or pay by card</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function WalletSetupHint({ showHttpsHelp }: { showHttpsHelp: boolean }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-950 space-y-2">
      {showHttpsHelp && (
        <p>
          <span className="font-semibold">HTTPS is required</span> for Google Pay and Apple Pay.
          Stop the app and run{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px]">
            pnpm --filter frontend dev:https
          </code>
          , then open{" "}
          <span className="font-medium">https://localhost:3001</span> (accept the browser security
          warning).
        </p>
      )}
      <p>
        <span className="font-semibold">Google Pay:</span> Chrome + card saved in Google Wallet.
      </p>
      <p>
        <span className="font-semibold">Apple Pay:</span> Safari + card in Wallet. Stripe may show
        &ldquo;Apple Pay not ready&rdquo; for localhost until you use HTTPS or a deployed domain.
      </p>
      <p>
        In Stripe → Settings → Payment method domains, keep <span className="font-medium">localhost</span>{" "}
        registered (you already did this).
      </p>
    </div>
  );
}

function WalletPaymentRequestFallback({
  amount,
  currencyCode,
  donationId,
  onAvailable,
  onSuccess,
  onError,
}: {
  amount: number;
  currencyCode: string;
  donationId: string;
  onAvailable: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null);

  const country = useMemo(
    () => CURRENCY_COUNTRY[currencyCode.toUpperCase()] ?? "GB",
    [currencyCode]
  );

  useEffect(() => {
    if (!stripe) return;

    let cancelled = false;
    const pr = stripe.paymentRequest({
      country,
      currency: currencyCode.toLowerCase(),
      total: {
        label: "Donation",
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (cancelled || !result) return;
      setPaymentRequest(pr);
      onAvailable();
    });

    const handlePaymentMethod = async (ev: {
      complete: (status: "success" | "fail") => void;
      paymentMethod: { id: string };
    }) => {
      try {
        const { clientSecret } = await createStripePaymentIntent({
          amount,
          currency: currencyCode,
          donationId,
        });

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          ev.complete("fail");
          onError(error.message || "Payment failed");
          return;
        }

        let intent = paymentIntent;
        if (intent?.status === "requires_action") {
          const followUp = await stripe.confirmCardPayment(clientSecret);
          if (followUp.error) {
            ev.complete("fail");
            onError(followUp.error.message || "Payment failed");
            return;
          }
          intent = followUp.paymentIntent;
        }

        ev.complete("success");
        if (intent?.id) {
          await confirmStripePayment({ paymentIntentId: intent.id, donationId });
          onSuccess();
        }
      } catch (err: unknown) {
        ev.complete("fail");
        onError(err instanceof Error ? err.message : "Payment failed");
      }
    };

    pr.on("paymentmethod", handlePaymentMethod);

    return () => {
      cancelled = true;
      pr.off("paymentmethod", handlePaymentMethod);
    };
  }, [amount, country, currencyCode, donationId, onAvailable, onError, onSuccess, stripe]);

  if (!paymentRequest) return null;

  return (
    <div className="stripe-payment-request w-full min-h-[48px]">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: "default",
              theme: "dark",
              height: "48px",
            },
          },
        }}
      />
    </div>
  );
}

function CheckoutForm({
  donationId,
  donorName: initialName,
  donorEmail: initialEmail,
  amount,
  currencySymbol,
  currencyCode,
  onSuccess,
  onError,
}: {
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currencySymbol: string;
  currencyCode: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [donorName, setDonorName] = useState(initialName);
  const [donorEmail, setDonorEmail] = useState(initialEmail);
  const [expressReady, setExpressReady] = useState(false);
  const [expressWalletsAvailable, setExpressWalletsAvailable] = useState(false);
  const [fallbackWalletAvailable, setFallbackWalletAvailable] = useState(false);
  const [needsHttps, setNeedsHttps] = useState(false);

  useEffect(() => {
    setNeedsHttps(typeof window !== "undefined" && !window.isSecureContext);
  }, []);

  const formattedAmount = useMemo(
    () => `${currencySymbol}${amount.toFixed(2)}`,
    [amount, currencySymbol]
  );

  const returnUrl = useMemo(
    () =>
      `${window.location.origin}/donate/complete?provider=stripe&donationId=${donationId}`,
    [donationId]
  );

  const finalizePayment = useCallback(
    async (paymentIntentId: string) => {
      await confirmStripePayment({ paymentIntentId, donationId });
      onSuccess();
    },
    [donationId, onSuccess]
  );

  const confirmWithNewIntent = useCallback(async () => {
    if (!stripe || !elements) {
      throw new Error("Stripe is not ready yet.");
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw new Error(submitError.message || "Please check your payment details.");
    }

    const { clientSecret } = await createStripePaymentIntent({
      amount,
      currency: currencyCode,
      donationId,
    });

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: {
            name: donorName.trim() || undefined,
            email: donorEmail.trim() || undefined,
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      throw new Error(error.message || "Payment failed");
    }

    if (!paymentIntent?.id) {
      throw new Error("Payment could not be confirmed");
    }

    await finalizePayment(paymentIntent.id);
  }, [
    amount,
    currencyCode,
    donationId,
    donorEmail,
    donorName,
    elements,
    finalizePayment,
    returnUrl,
    stripe,
  ]);

  const handleExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    setProcessing(true);
    try {
      await confirmWithNewIntent();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment could not be confirmed";
      event.paymentFailed({ reason: "fail", message });
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPay = async () => {
    if (!donorName.trim() || !donorEmail.trim()) {
      onError("Please enter your name and email.");
      return;
    }

    setProcessing(true);
    try {
      await confirmWithNewIntent();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Payment could not be confirmed");
    } finally {
      setProcessing(false);
    }
  };

  const showWalletHint =
    expressReady && !expressWalletsAvailable && !fallbackWalletAvailable;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft space-y-5">
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-deep">
          Express checkout
        </p>
        <div className="stripe-express-checkout min-h-[48px] w-full">
          <ExpressCheckoutElement
            onConfirm={handleExpressConfirm}
            onReady={({ availablePaymentMethods }) => {
              setExpressReady(true);
              setExpressWalletsAvailable(
                Boolean(availablePaymentMethods?.applePay || availablePaymentMethods?.googlePay)
              );
            }}
            onAvailablePaymentMethodsChange={({ paymentMethods }) => {
              setExpressWalletsAvailable(
                Boolean(paymentMethods?.applePay || paymentMethods?.googlePay)
              );
            }}
            onLoadError={({ error }) => {
              setExpressReady(true);
              onError(error.message || "Wallet buttons could not load");
            }}
            options={{
              business: { name: "Your Impact Foundation" },
              buttonTheme: {
                applePay: "black",
                googlePay: "black",
              },
              buttonType: {
                applePay: "plain",
                googlePay: "plain",
              },
              layout: {
                maxColumns: 2,
                maxRows: 1,
              },
              buttonHeight: 48,
              paymentMethodOrder: ["apple_pay", "google_pay"],
              paymentMethods: {
                applePay: "always",
                googlePay: "always",
                link: "never",
                paypal: "never",
                amazonPay: "never",
                klarna: "never",
              },
            }}
          />
        </div>
        {expressReady && !expressWalletsAvailable && (
          <WalletPaymentRequestFallback
            amount={amount}
            currencyCode={currencyCode}
            donationId={donationId}
            onAvailable={() => setFallbackWalletAvailable(true)}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}
        {showWalletHint && <WalletSetupHint showHttpsHelp={needsHttps} />}
      </div>

      <OrPayByCardDivider />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="stripe-donor-name" className="text-sm font-medium text-primary">
            Full name
          </Label>
          <Input
            id="stripe-donor-name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stripe-donor-email" className="text-sm font-medium text-primary">
            Email (receipt)
          </Label>
          <Input
            id="stripe-donor-email"
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="stripe-payment-fields">
        <PaymentElement
          options={{
            paymentMethodOrder: ["card"],
            wallets: {
              applePay: "never",
              googlePay: "never",
              link: "never",
            },
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
                address: "never",
                phone: "never",
              },
            },
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleCardPay}
        disabled={!stripe || processing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Heart className="h-5 w-5" strokeWidth={2.25} />
            Donate {formattedAmount} now
          </>
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By donating you agree to our terms. You can cancel monthly gifts anytime. Charged in{" "}
        {currencyCode}.
      </p>
    </div>
  );
}

export function StripeCheckoutForm({
  publishableKey,
  donationId,
  donorName,
  donorEmail,
  amount,
  currencySymbol,
  currencyCode,
  onSuccess,
  onError,
}: {
  publishableKey: string;
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currencySymbol: string;
  currencyCode: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  const elementsOptions = useMemo(
    () => ({
      mode: "payment" as const,
      amount: Math.round(amount * 100),
      currency: currencyCode.toLowerCase(),
      paymentMethodTypes: ["card"],
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#84cc16",
          borderRadius: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
          colorText: "#1a1228",
          colorTextPlaceholder: "#8b8499",
        },
        rules: {
          ".Input": {
            border: "1px solid hsl(270 25% 90%)",
            boxShadow: "none",
          },
          ".Input:focus": {
            border: "1px solid hsl(268 100% 51%)",
            boxShadow: "0 0 0 1px hsl(268 100% 51%)",
          },
          ".Tab, .TabLabel, .p-TabList": {
            display: "none",
          },
        },
      },
    }),
    [amount, currencyCode]
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm
        donationId={donationId}
        donorName={donorName}
        donorEmail={donorEmail}
        amount={amount}
        currencySymbol={currencySymbol}
        currencyCode={currencyCode}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
