import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem("sm_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("sm_session_id", sid);
  }
  return sid;
}

function detectDevice(ua: string): string {
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "mobile";
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

async function fetchIp(): Promise<string | null> {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    return d.ip || null;
  } catch {
    return null;
  }
}

export function useVisitTracker() {
  const location = useLocation();

  useEffect(() => {
    // Skip admin routes from being tracked
    if (location.pathname.startsWith("/admin")) return;

    const ua = navigator.userAgent;
    const sessionId = getOrCreateSessionId();

    (async () => {
      const ip = await fetchIp();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("page_visits").insert({
        session_id: sessionId,
        ip_address: ip,
        user_agent: ua,
        device_type: detectDevice(ua),
        browser: detectBrowser(ua),
        os: detectOS(ua),
        path: location.pathname + location.search,
        referrer: document.referrer || null,
        language: navigator.language,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        user_id: user?.id ?? null,
      });
    })();
  }, [location.pathname, location.search]);
}
