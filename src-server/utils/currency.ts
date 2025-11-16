// Simple currency normalization from XAF to configured Stripe currency.
// Stripe does not support XAF directly; we map to USD/EUR with static rate (approx).

const STATIC_RATES: Record<string, number> = {
  // base currency -> XAF units per 1 base
  USD: 620, // 1 USD ≈ 620 XAF (illustrative; update periodically)
  EUR: 655, // 1 EUR ≈ 655 XAF
};

export interface NormalizedPrice {
  originalAmountXaf: number; // original amount in XAF (integer)
  convertedAmountMinor: number; // amount in minor units for target currency (e.g. cents) integer
  currency: string; // target currency
  rateUsed: number; // XAF per 1 target currency
}

export function normalizeXafToCurrency(xafAmount: number, targetCurrency: string): NormalizedPrice {
  const upper = targetCurrency.toUpperCase();
  if (!STATIC_RATES[upper]) {
    // Fallback: treat XAF as if already minor units of target (not ideal, but prevents crash)
    return {
      originalAmountXaf: xafAmount,
      convertedAmountMinor: xafAmount,
      currency: upper,
      rateUsed: 1,
    };
  }
  const rate = STATIC_RATES[upper];
  // Convert: target = XAF / rate. For Stripe minor units, multiply by 100 then round.
  const major = xafAmount / rate; // e.g. USD amount
  const minor = Math.round(major * 100); // cents
  return {
    originalAmountXaf: xafAmount,
    convertedAmountMinor: minor,
    currency: upper.toLowerCase(),
    rateUsed: rate,
  };
}
