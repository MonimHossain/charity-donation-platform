"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRamadanDate, type RamadanNightPreview } from "@/lib/ramadan-split";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nights: RamadanNightPreview[];
  total: number;
  currency: string;
};

export default function RamadanPreviewModal({
  open,
  onOpenChange,
  nights,
  total,
  currency,
}: Props) {
  const sym = CURRENCIES[(currency as CurrencyCode) || "GBP"]?.symbol ?? "£";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">
            Donation schedule preview
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your total is split equally across {nights.length} night
          {nights.length === 1 ? "" : "s"}. Each installment is charged on its scheduled date.
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Date</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {nights.map((n) => (
                <tr key={n.date} className="border-t border-border">
                  <td className="px-4 py-2.5">{formatRamadanDate(n.date)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {sym}
                    {n.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-secondary/40 border-t border-border">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-primary">Total</td>
                <td className="px-4 py-2.5 text-right font-bold tabular-nums text-accent-deep">
                  {sym}
                  {total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
