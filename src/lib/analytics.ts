// Lightweight GA4 event tracker. No-ops if gtag is missing (e.g. preview/dev).
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type GAEventName =
  | "calculate_clicked"
  | "report_generated"
  | "signup_completed"
  | "whatsapp_clicked"
  | "contact_clicked";

export function trackEvent(
  name: GAEventName | string,
  params: Record<string, unknown> = {}
): void {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...params });
    }
  } catch {
    // Never let analytics break the app.
  }
}

// Optional initializer (gtag snippet is in index.html). Reserved for future setup.
export function initAnalytics(): void {
  // No-op: GA4 is bootstrapped via the gtag snippet in index.html.
}
