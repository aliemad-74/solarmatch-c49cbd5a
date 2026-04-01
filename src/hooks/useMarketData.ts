import { useState, useEffect, useCallback } from "react";
import { fetchPanelPrices, fetchTariffs, PanelPriceData, TariffData, MarketDataResult } from "@/lib/api/marketData";

export function useMarketData() {
  const [panelPrices, setPanelPrices] = useState<MarketDataResult<PanelPriceData>>({
    data: null, source: "fallback", scraped_at: null, isLive: false,
  });
  const [tariffs, setTariffs] = useState<MarketDataResult<TariffData>>({
    data: null, source: "fallback", scraped_at: null, isLive: false,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prices, tariffData] = await Promise.all([
        fetchPanelPrices(),
        fetchTariffs(),
      ]);
      setPanelPrices(prices);
      setTariffs(tariffData);
    } catch (e) {
      console.error("Market data fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get dynamic cost per kW with fallback
  const getCostPerKW = useCallback((pkg: "economy" | "standard" | "premium"): number => {
    const fallbacks = { economy: 15000, standard: 19000, premium: 26000 };
    return panelPrices.data?.[pkg]?.costPerKW ?? fallbacks[pkg];
  }, [panelPrices.data]);

  return {
    panelPrices,
    tariffs,
    loading,
    refresh,
    getCostPerKW,
  };
}
