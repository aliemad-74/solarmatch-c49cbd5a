// URL sharing utilities for SolarMatch
// Encodes calculation parameters into a shareable URL

import { PVType, BuildingType, CostScenario } from "./solarData";

export interface ShareableParams {
  rooftopArea: number;
  pvType: PVType;
  buildingType: BuildingType;
  costScenario: CostScenario;
  electricityPrice: number;
  monthlyConsumption: number;
  buildingMode: boolean;
  numberOfUnits: number;
  avgUnitConsumption: number;
  lat?: number;
  lng?: number;
  locationName?: string;
}

// Encode parameters to a URL-safe base64 string
export function encodeShareParams(params: ShareableParams): string {
  const jsonStr = JSON.stringify(params);
  // Use btoa for base64 encoding, handle unicode characters
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  // Make it URL-safe by replacing special characters
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decode parameters from URL-safe base64 string
export function decodeShareParams(encoded: string): ShareableParams | null {
  try {
    // Restore base64 format
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const params = JSON.parse(jsonStr);
    
    // Validate required fields
    if (
      typeof params.rooftopArea !== 'number' ||
      typeof params.electricityPrice !== 'number'
    ) {
      return null;
    }
    
    return {
      rooftopArea: params.rooftopArea || 100,
      pvType: params.pvType || 'B_standard_mono',
      buildingType: params.buildingType || 'apartment',
      costScenario: params.costScenario || 'medium',
      electricityPrice: params.electricityPrice || 1.95,
      monthlyConsumption: params.monthlyConsumption || 500,
      buildingMode: params.buildingMode || false,
      numberOfUnits: params.numberOfUnits || 10,
      avgUnitConsumption: params.avgUnitConsumption || 300,
      lat: params.lat,
      lng: params.lng,
      locationName: params.locationName,
    };
  } catch (error) {
    console.error('Error decoding share params:', error);
    return null;
  }
}

// Generate a full shareable URL
export function generateShareUrl(params: ShareableParams): string {
  const encoded = encodeShareParams(params);
  const baseUrl = window.location.origin;
  return `${baseUrl}/?share=${encoded}`;
}

// Parse share data from URL search params
export function parseShareFromUrl(): ShareableParams | null {
  const urlParams = new URLSearchParams(window.location.search);
  const shareData = urlParams.get('share');
  
  if (shareData) {
    return decodeShareParams(shareData);
  }
  
  return null;
}

// Copy text to clipboard with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
