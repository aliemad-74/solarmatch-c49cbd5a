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

const defaultInputs: PersistedInputs = {
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
// Session state — survives OAuth redirect / page reload so that
// after login the user finds their map, polygon, and inputs intact.
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

export function loadPersistedSession(): PersistedSession {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

export function savePersistedSession(patch: Partial<PersistedSession>) {
  try {
    const existing = loadPersistedSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

// Pending calculation flag — set when user clicks Calculate but isn't logged in.
// After successful login the page auto-resumes the calculation.
export function setPendingCalculationFlag() {
  try { localStorage.setItem(PENDING_CALC_KEY, "1"); } catch {}
}
export function consumePendingCalculationFlag(): boolean {
  try {
    const v = localStorage.getItem(PENDING_CALC_KEY);
    if (v) {
      localStorage.removeItem(PENDING_CALC_KEY);
      return true;
    }
  } catch {}
  return false;
}
