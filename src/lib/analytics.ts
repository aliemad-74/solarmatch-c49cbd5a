// Lightweight analytics: GA4 (env-driven, no-op if missing) + scroll-depth.
const GA_ID = (import.meta as any).env?.VITE_GA4_ID as string | undefined;

let initialised = false;
export function initAnalytics() {
  if (initialised || typeof window === "undefined" || !GA_ID) return;
  initialised = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: unknown[]) { (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: true });

  // Scroll-depth tracking (25/50/75/100)
  const seen = new Set<number>();
  const onScroll = () => {
    const h = document.documentElement;
    const pct = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
    [25, 50, 75, 100].forEach((m) => {
      if (pct >= m && !seen.has(m)) {
        seen.add(m);
        gtag("event", "scroll_depth", { percent: m });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") gtag("event", name, params || {});
}
