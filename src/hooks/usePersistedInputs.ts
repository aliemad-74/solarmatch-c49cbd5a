import { useState, useEffect } from "react";

const STORAGE_KEY = "solarmatch_last_inputs";

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
