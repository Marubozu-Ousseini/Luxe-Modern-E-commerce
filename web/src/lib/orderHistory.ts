export type OrderHistoryItem = {
  orderNumber: string;
  createdAtIso: string;
  paymentMethodLabel: string;
  items: Array<{ slug: string; name: string; quantity: number; priceXaf: number }>;
  totalXaf: number;
};

export const ORDER_HISTORY_KEY = "malafaareh_orders_history_v1";

export function safeParseOrderHistory(value: string | null): OrderHistoryItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(Boolean)
      .map((o) => o as Partial<OrderHistoryItem>)
      .filter(
        (o): o is OrderHistoryItem =>
          typeof o.orderNumber === "string" &&
          typeof o.createdAtIso === "string" &&
          typeof o.paymentMethodLabel === "string" &&
          Array.isArray(o.items) &&
          typeof o.totalXaf === "number" &&
          Number.isFinite(o.totalXaf)
      )
      .map((o) => ({
        orderNumber: o.orderNumber,
        createdAtIso: o.createdAtIso,
        paymentMethodLabel: o.paymentMethodLabel,
        totalXaf: o.totalXaf,
        items: o.items
          .filter(Boolean)
          .map((l) => l as any)
          .filter((l) => typeof l?.slug === "string" && typeof l?.name === "string" && typeof l?.quantity === "number" && typeof l?.priceXaf === "number")
          .map((l) => ({ slug: l.slug, name: l.name, quantity: l.quantity, priceXaf: l.priceXaf })),
      }));
  } catch {
    return [];
  }
}

export function addToOrderHistory(item: OrderHistoryItem) {
  try {
    const current = safeParseOrderHistory(localStorage.getItem(ORDER_HISTORY_KEY));

    const exists = current.some((o) => o.orderNumber === item.orderNumber);
    const next = exists ? current : [item, ...current];

    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
