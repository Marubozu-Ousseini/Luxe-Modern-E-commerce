export const PROMO_PERCENT_OFF = 10;

export function discountedXaf(priceXaf: number, percentOff: number = PROMO_PERCENT_OFF) {
  return Math.round(priceXaf * (1 - percentOff / 100));
}

export function promoAmountsXaf(priceXaf: number, quantity: number = 1, percentOff: number = PROMO_PERCENT_OFF) {
  const oldTotal = Math.max(0, Math.round(priceXaf * quantity));
  const promoUnit = discountedXaf(priceXaf, percentOff);
  const promoTotal = Math.max(0, Math.round(promoUnit * quantity));
  const gain = Math.max(0, oldTotal - promoTotal);
  return { oldTotal, promoTotal, gain, promoUnit };
}
