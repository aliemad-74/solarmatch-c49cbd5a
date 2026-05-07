import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/integrations/supabase/client";

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem("sm_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("sm_session_id", sid);
  }
  return sid;
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

// Try to get high-entropy device model via UA Client Hints (Chromium browsers)
async function getDeviceModelHint(): Promise<string | null> {
  try {
    // @ts-ignore - userAgentData is not in all TS libs
    const uaData = (navigator as any).userAgentData;
    if (!uaData?.getHighEntropyValues) return null;
    const hints = await uaData.getHighEntropyValues(["model", "platformVersion", "platform"]);
    const parts = [hints.model, hints.platform, hints.platformVersion]
      .filter(Boolean)
      .map((p: string) => p.trim());
    return parts.length ? parts.join(" ") : null;
  } catch {
    return null;
  }
}

export function useVisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const ua = navigator.userAgent;
    const sessionId = getOrCreateSessionId();
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const deviceVendor = result.device.vendor || "";
    const deviceModelRaw = result.device.model || "";
    const deviceTypeRaw = (result.device.type || "desktop").toLowerCase();
    const deviceType = ["mobile", "tablet", "smarttv", "wearable", "console"].includes(deviceTypeRaw)
      ? deviceTypeRaw
      : "desktop";
    const browserName = result.browser.name || "Other";
    const browserVersion = result.browser.version ? ` ${result.browser.version.split(".")[0]}` : "";
    const osName = result.os.name || "Other";
    const osVersion = result.os.version ? ` ${result.os.version}` : "";

    (async () => {
      const [ip, hintModel, userRes] = await Promise.all([
        fetchIp(),
        getDeviceModelHint(),
        supabase.auth.getUser(),
      ]);

      // Compose human-readable device model:
      // 1) UA-CH high entropy (best on Android/Chromium)
      // 2) ua-parser vendor + model
      // 3) Apple: derive "iPhone / iPad" + iOS version (Apple hides exact model)
      let deviceModel = "";
      if (hintModel) {
        deviceModel = hintModel;
      } else if (deviceVendor || deviceModelRaw) {
        deviceModel = `${deviceVendor} ${deviceModelRaw}`.trim();
      } else if (/iPhone/i.test(ua)) {
        deviceModel = `Apple iPhone (iOS${osVersion})`.trim();
      } else if (/iPad/i.test(ua)) {
        deviceModel = `Apple iPad (iPadOS${osVersion})`.trim();
      } else if (/Macintosh/i.test(ua)) {
        deviceModel = `Apple Mac (${osName}${osVersion})`.trim();
      } else {
        deviceModel = `${osName} ${deviceType}`.trim();
      }

      await supabase.from("page_visits").insert({
        session_id: sessionId,
        ip_address: ip,
        user_agent: ua,
        device_type: deviceType,
        device_model: deviceModel,
        browser: `${browserName}${browserVersion}`.trim(),
        os: `${osName}${osVersion}`.trim(),
        path: location.pathname + location.search,
        referrer: document.referrer || null,
        language: navigator.language,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        user_id: userRes.data.user?.id ?? null,
      });
    })();
  }, [location.pathname, location.search]);
}
