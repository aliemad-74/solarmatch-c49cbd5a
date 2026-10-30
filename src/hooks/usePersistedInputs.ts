import { useState, useEffect } from "react";

const STORAGE_KEY = "solarmatch_last_inputs";
const SESSION_KEY = "solarmatch_session_state";
const PENDING_CALC_KEY = "solarmatch_pending_calc";

export interface PersistedInputs {
  rooftopArea: number;
  pvType: string;
  buildingType: string;
  costScenario: string;
  electricityPrice: number;
  monthlyConsumption: number;
  buildingMode: boolean;
  numberOfUnits: number;
  avgUnitConsumption: number;
  farmMode: boolean;
  areaInFeddans: number;
  agriculturalActivity: string;
  farmEquipmentConsumption: number;
}

export const defaultInputs: PersistedInputs = {
  rooftopArea: 100,
  pvType: "B_standard_mono",
  buildingType: "apartment",
  costScenario: "medium",
  electricityPrice: 1.95,
  monthlyConsumption: 500,
  buildingMode: false,
  numberOfUnits: 10,
  avgUnitConsumption: 300,
  farmMode: false,
  areaInFeddans: 5,
  agriculturalActivity: "drip_irrigation",
  farmEquipmentConsumption: 10000,
};

export function loadPersistedInputs(): PersistedInputs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultInputs, ...JSON.parse(stored) };
    }
  } catch {}
  return defaultInputs;
}

export function saveInputs(inputs: Partial<PersistedInputs>) {
  try {
    const existing = loadPersistedInputs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...inputs }));
  } catch {}
}

export function usePersistedInputs() {
  const initial = loadPersistedInputs();
  return { initial, saveInputs };
}

// ─────────────────────────────────────────────────────────────
// Session state — map/area/session data. Kept in sessionStorage
// so it survives SPA navigation between steps and the OAuth
// redirect round-trip within the same tab, but a page REFRESH
// (reload) intentionally starts with a clean map.
// ─────────────────────────────────────────────────────────────

export interface PersistedSession {
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  polygon?: { lat: number; lng: number }[];
  polygonCenter?: { lat: number; lng: number };
  polygonArea?: number;
  polygonDrawn?: boolean;
  userSelectedLocation?: boolean;
}

// Detect that the current page load is a browser REFRESH (reload),
// not a fresh navigation (SPA route change or OAuth redirect back).
function wasPageReload(): boolean {
  try {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries && entries.length > 0) return entries[0].type === "reload";
    // Legacy fallback for older browsers
    const legacy = (performance as unknown as { navigation?: { type?: number } }).navigation;
    return legacy?.type === 1;
  } catch {
    return false;
  }
}

// Evaluate reload status only once per page load, so later SPA
// remounts of Index never re-clear a session that is already live.
let reloadChecked = false;
let clearedForReload = false;

function checkReloadOnce(): boolean {
  if (reloadChecked) return false;
  reloadChecked = true;
  if (wasPageReload()) {
    clearedForReload = true;
    return true;
  }
  return false;
}

/** True only if THIS page load was a refresh and the session was cleared. */
export function didClearForReload(): boolean {
  return clearedForReload;
}

export function loadPersistedSession(): PersistedSession {
  try {
    if (checkReloadOnce()) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(PENDING_CALC_KEY);
      return {};
    }
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

export function savePersistedSession(patch: Partial<PersistedSession>) {
  try {
    const existing = loadPersistedSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

export function clearPersistedSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

// Pending calculation flag — set when user clicks Calculate but isn't logged in.
// After successful login (same tab) the page auto-resumes the calculation.
// Lives in sessionStorage so a refresh also drops it.
export function setPendingCalculationFlag() {
  try { sessionStorage.setItem(PENDING_CALC_KEY, "1"); } catch {}
}
export function consumePendingCalculationFlag(): boolean {
  try {
    const v = sessionStorage.getItem(PENDING_CALC_KEY);
    if (v) {
      sessionStorage.removeItem(PENDING_CALC_KEY);
      return true;
    }
  } catch {}
  return false;
}
