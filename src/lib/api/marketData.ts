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
      const cacheAge = Date.now() - new Date(cached.scraped_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return {
          data: cached.data as unknown as TariffData,
          source: "cache",
          scraped_at: cached.scraped_at,
          isLive: true,
        };
      }
    }

    const { data, error } = await supabase.functions.invoke("scrape-tariffs");
    if (error) throw error;

    if (data?.success) {
      return {
        data: data.data as TariffData,
        source: data.source,
        scraped_at: data.scraped_at,
        isLive: (data.data as TariffData)?.confidence !== "low",
      };
    }
  } catch (e) {
    console.error("Failed to fetch tariffs:", e);
  }

  return { data: null, source: "fallback", scraped_at: null, isLive: false };
}
