// Lightweight analytics instrumentation with sendBeacon fallback.
// In production, back this endpoint with server collection.

export type AnalyticsEvent = {
  type:
    | 'pdp_cta_click'
    | 'pdp_view_time'
    | 'plp_filter_used'
    | 'plp_sort_changed'
    | 'checkout_completed'
    | 'search_query'
    | 'search_suggestion_click'
    | 'pdp_sticky_cta_click'
    | 'promo_impression'
    | 'promo_click';
  payload?: Record<string, any>;
  ts?: number;
};

const endpoint = '/api/analytics';

export function track(event: AnalyticsEvent) {
  const body = JSON.stringify({ ...event, ts: Date.now() });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
    // Fallback
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(()=>{});
  } catch (e) {
    // As a last fallback, log to console in dev
    console.debug('[analytics]', event);
  }
}
