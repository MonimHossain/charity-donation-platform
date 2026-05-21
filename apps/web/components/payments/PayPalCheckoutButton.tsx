"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPayPalOrder, capturePayPalOrder } from "@/lib/api";

export function PayPalCheckoutButton({
  clientId,
  amount,
  currency,
  donationId,
  onSuccess,
  onError,
}: {
  clientId: string;
  amount: number;
  currency: string;
  donationId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency,
        intent: "capture",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", height: 48 }}
        createOrder={async () => {
          const order = await createPayPalOrder({ amount, currency, donationId });
          return order.id;
        }}
        onApprove={async (data) => {
          try {
            await capturePayPalOrder({ orderId: data.orderID, donationId });
            onSuccess();
          } catch (e: unknown) {
            onError(e instanceof Error ? e.message : "PayPal capture failed");
          }
        }}
        onError={() => onError("PayPal payment failed")}
      />
    </PayPalScriptProvider>
  );
}
