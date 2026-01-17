import { cn } from "@/lib/cn";
import { formatXaf } from "@/lib/money";
import { promoAmountsXaf, PROMO_PERCENT_OFF } from "@/lib/promo";

export function PromoPrice({
  priceXaf,
  quantity = 1,
  promoPriceXaf,
  percentOff = PROMO_PERCENT_OFF,
  totals,
  className,
}: {
  priceXaf: number;
  quantity?: number;
  promoPriceXaf?: number;
  percentOff?: number;
  totals?: { oldTotal: number; promoTotal: number; gain: number };
  className?: string;
}) {
  const computedTotals = (() => {
    if (totals) return totals;
    if (typeof promoPriceXaf === "number" && Number.isFinite(promoPriceXaf) && promoPriceXaf > 0) {
      const oldTotal = Math.max(0, Math.round(priceXaf * quantity));
      const promoTotal = Math.max(0, Math.round(promoPriceXaf * quantity));
      const gain = Math.max(0, oldTotal - promoTotal);
      return { oldTotal, promoTotal, gain };
    }
    const { oldTotal, promoTotal, gain } = promoAmountsXaf(priceXaf, quantity, percentOff);
    return { oldTotal, promoTotal, gain };
  })();

  const { oldTotal, promoTotal, gain } = computedTotals;

  return (
    <div className={cn("text-sm", className)}>
      <p className="leading-6">
        <span className="mr-2 text-promo-old line-through">{formatXaf(oldTotal)}</span>
        <span className="font-semibold text-text-primary">{formatXaf(promoTotal)}</span>
      </p>
      <p className="mt-1 text-sm">
        <span className="text-text-muted">Gagnez : </span>
        <span className="font-semibold text-promo-win [animation:promo-blink_1s_steps(2,end)_infinite]">
          {formatXaf(gain)}
        </span>
      </p>
    </div>
  );
}
