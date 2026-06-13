import type { CampaignUpsell } from "@/lib/checkout-campaign-config";

type Props = {
  upsells: CampaignUpsell[];
  selectedUpsellIds: Set<string>;
  currencySymbol: string;
  onToggleUpsell: (id: string) => void;
};

export default function CheckoutUpsellList({
  upsells,
  selectedUpsellIds,
  currencySymbol,
  onToggleUpsell,
}: Props) {
  if (!upsells.length) return null;

  return (
    <div className="grid gap-3">
      {upsells.map((upsell) => {
        const selected = selectedUpsellIds.has(upsell.id);
        const title = upsell.name || upsell.label || "Upsell";
        return (
          <label
            key={upsell.id}
            className={`flex items-start gap-3 cursor-pointer rounded-2xl border bg-card p-4 transition-colors ${
              selected ? "border-accent ring-1 ring-accent/30" : "border-border hover:border-accent/40"
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleUpsell(upsell.id)}
              className="mt-1 h-4 w-4 accent-accent rounded shrink-0"
            />
            {upsell.image ? (
              <img
                src={upsell.image}
                alt=""
                className="h-16 w-16 rounded-xl object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-muted shrink-0" />
            )}
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              {upsell.description?.trim() && (
                <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">
                  {upsell.description}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm font-bold text-accent tabular-nums">
              {currencySymbol}
              {Number(upsell.amount || 0).toFixed(2)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
