import { supabase } from "@/integrations/supabase/client";

export interface PanelPriceData {
  economy: { costPerKW: number; confidence: string; notes: string };
  standard: { costPerKW: number; confidence: string; notes: string };
  premium: { costPerKW: number; confidence: string; notes: string };
  currency: string;
  market_date: string;
  sources_analyzed: number;
}

export interface TariffTierData {
  minKWh: number;
  maxKWh: number | null;
  rateEGP: number;
  tierName: string;
  tierNameAr: string;
}

export interface TariffData {
  tiers: TariffTierData[];
  commercial_tiers?: TariffTierData[];
  industrial_tiers?: TariffTierData[];
  commercial_rate: number;
  industrial_rate: number;
  effective_date: string;
  confidence: string;
  sources_analyzed: number;
}

export interface MarketDataResult<T> {
  data: T | null;
  source: "cache" | "fresh" | "fallback";
  scraped_at: string | null;
  isLive: boolean;
}

const FALLBACK_2026_TARIFFS: TariffData = {
  tiers: [
    { minKWh: 0, maxKWh: 50, rateEGP: 0.68, tierName: "Tier 1 (0-50 kWh)", tierNameAr: "الشريحة الأولى (0-50 ك.و.س)" },
    { minKWh: 51, maxKWh: 100, rateEGP: 0.78, tierName: "Tier 2 (51-100 kWh)", tierNameAr: "الشريحة الثانية (51-100 ك.و.س)" },
    { minKWh: 101, maxKWh: 200, rateEGP: 0.95, tierName: "Tier 3 (101-200 kWh)", tierNameAr: "الشريحة الثالثة (101-200 ك.و.س)" },
    { minKWh: 201, maxKWh: 350, rateEGP: 1.55, tierName: "Tier 4 (201-350 kWh)", tierNameAr: "الشريحة الرابعة (201-350 ك.و.س)" },
    { minKWh: 351, maxKWh: 650, rateEGP: 1.95, tierName: "Tier 5 (351-650 kWh)", tierNameAr: "الشريحة الخامسة (351-650 ك.و.س)" },
    { minKWh: 651, maxKWh: 1000, rateEGP: 2.1, tierName: "Tier 6 (651-1000 kWh)", tierNameAr: "الشريحة السادسة (651-1000 ك.و.س)" },
    { minKWh: 1001, maxKWh: null, rateEGP: 2.23, tierName: "Tier 7 (>1000 kWh)", tierNameAr: "الشريحة السابعة (>1000 ك.و.س)" },
  ],
  commercial_tiers: [
    { minKWh: 0, maxKWh: 100, rateEGP: 1.40, tierName: "Commercial 1 (0-100 kWh)", tierNameAr: "تجاري 1 (0-100 ك.و.س)" },
    { minKWh: 101, maxKWh: 250, rateEGP: 1.80, tierName: "Commercial 2 (101-250 kWh)", tierNameAr: "تجاري 2 (101-250 ك.و.س)" },
    { minKWh: 251, maxKWh: 600, rateEGP: 2.20, tierName: "Commercial 3 (251-600 kWh)", tierNameAr: "تجاري 3 (251-600 ك.و.س)" },
    { minKWh: 601, maxKWh: 1000, rateEGP: 2.85, tierName: "Commercial 4 (601-1000 kWh)", tierNameAr: "تجاري 4 (601-1000 ك.و.س)" },
    { minKWh: 1001, maxKWh: 2500, rateEGP: 3.15, tierName: "Commercial 5 (1001-2500 kWh)", tierNameAr: "تجاري 5 (1001-2500 ك.و.س)" },
    { minKWh: 2501, maxKWh: null, rateEGP: 3.45, tierName: "Commercial 6 (>2500 kWh)", tierNameAr: "تجاري 6 (>2500 ك.و.س)" },
  ],
  industrial_tiers: [
    { minKWh: 0, maxKWh: 200, rateEGP: 1.18, tierName: "Industrial 1 (0-200 kWh)", tierNameAr: "صناعي 1 (0-200 ك.و.س)" },
    { minKWh: 201, maxKWh: 500, rateEGP: 1.45, tierName: "Industrial 2 (201-500 kWh)", tierNameAr: "صناعي 2 (201-500 ك.و.س)" },
    { minKWh: 501, maxKWh: 1000, rateEGP: 1.72, tierName: "Industrial 3 (501-1000 kWh)", tierNameAr: "صناعي 3 (501-1000 ك.و.س)" },
    { minKWh: 1001, maxKWh: 5000, rateEGP: 1.95, tierName: "Industrial 4 (1001-5000 kWh)", tierNameAr: "صناعي 4 (1001-5000 ك.و.س)" },
    { minKWh: 5001, maxKWh: null, rateEGP: 2.10, tierName: "Industrial 5 (>5000 kWh)", tierNameAr: "صناعي 5 (>5000 ك.و.س)" },
  ],
  commercial_rate: 2.85,
  industrial_rate: 1.95,
  effective_date: "2026",
  confidence: "high",
  sources_analyzed: 0,
};

function isValid2026TariffData(data: TariffData | null | undefined): data is TariffData {
  if (!data || !Array.isArray(data.tiers) || data.tiers.length < 7) return false;

  const rates = data.tiers
    .map((tier) => Number(tier.rateEGP))
    .filter((rate) => Number.isFinite(rate));

  if (rates.length === 0) return false;

  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const has2026Date = String(data.effective_date ?? "").includes("2026");

  return has2026Date && minRate >= 0.65 && maxRate >= 2.2;
}

function buildFallbackTariffResult(scrapedAt: string | null = null): MarketDataResult<TariffData> {
  return {
    data: FALLBACK_2026_TARIFFS,
    source: "fallback",
    scraped_at: scrapedAt,
    isLive: false,
  };
}

// Fetch latest panel prices (from cache or trigger scrape)
export async function fetchPanelPrices(): Promise<MarketDataResult<PanelPriceData>> {
  try {
    // Try cached data first from DB
    const { data: cached } = await supabase
      .from("market_data")
      .select("*")
      .eq("type", "panel_price")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.scraped_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return {
          data: cached.data as unknown as PanelPriceData,
          source: "cache",
          scraped_at: cached.scraped_at,
          isLive: true,
        };
      }
    }

    // Trigger fresh scrape
    const { data, error } = await supabase.functions.invoke("scrape-solar-prices");
    if (error) throw error;

    if (data?.success) {
      return {
        data: data.data as PanelPriceData,
        source: data.source,
        scraped_at: data.scraped_at,
        isLive: (data.data as PanelPriceData)?.economy?.confidence !== "low",
      };
    }
  } catch (e) {
    console.error("Failed to fetch panel prices:", e);
  }

  return { data: null, source: "fallback", scraped_at: null, isLive: false };
}

// Fetch latest electricity tariffs
export async function fetchTariffs(): Promise<MarketDataResult<TariffData>> {
  try {
    const { data: cached } = await supabase
      .from("market_data")
      .select("*")
      .eq("type", "tariff")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      const cachedTariffs = cached.data as unknown as TariffData;
      const cacheAge = Date.now() - new Date(cached.scraped_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000 && isValid2026TariffData(cachedTariffs)) {
        return {
          data: cachedTariffs,
          source: "cache",
          scraped_at: cached.scraped_at,
          isLive: true,
        };
      }
    }

    const { data, error } = await supabase.functions.invoke("scrape-tariffs");
    if (error) throw error;

    if (data?.success) {
      const scrapedTariffs = data.data as TariffData;
      if (!isValid2026TariffData(scrapedTariffs)) {
        console.warn("Tariff scrape returned non-2026 rates, using validated 2026 fallback");
        return buildFallbackTariffResult(data.scraped_at ?? null);
      }

      return {
        data: scrapedTariffs,
        source: data.source,
        scraped_at: data.scraped_at,
        isLive: scrapedTariffs?.confidence !== "low",
      };
    }
  } catch (e) {
    console.error("Failed to fetch tariffs:", e);
  }

  return buildFallbackTariffResult();
}
