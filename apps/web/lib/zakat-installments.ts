import { ceilAmount } from "@/lib/currency";

export const ZAKAT_INSTALLMENT_MONTHS = [1, 3, 6, 12] as const;
export type ZakatInstallmentMonths = (typeof ZAKAT_INSTALLMENT_MONTHS)[number];

export function zakatInstallmentAmount(totalDue: number, months: number): number {
  if (!Number.isFinite(totalDue) || totalDue <= 0) return 0;
  if (months <= 1) return ceilAmount(totalDue);
  return ceilAmount(totalDue / months);
}

export function zakatInstallmentCancelAt(months: number): number {
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  return Math.floor(end.getTime() / 1000);
}

export function buildZakatDonateHref(params: {
  totalDue: number;
  currency: string;
  months: ZakatInstallmentMonths;
}): string {
  const { totalDue, currency, months } = params;
  const installment = zakatInstallmentAmount(totalDue, months);
  const search = new URLSearchParams({
    cause: "zakat",
    amount: String(installment),
    currency: currency.toUpperCase(),
  });

  if (months > 1) {
    search.set("freq", "monthly");
    search.set("interval", "month");
    search.set("intervalCount", "1");
    search.set("cancelAt", String(zakatInstallmentCancelAt(months)));
    search.set("zakatMonths", String(months));
    search.set("zakatTotal", String(totalDue));
  }

  return `/donate?${search.toString()}`;
}

export function zakatInstallmentPlanLabel(months: ZakatInstallmentMonths): string {
  if (months === 1) return "Pay in full";
  return `${months} months`;
}
