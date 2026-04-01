import { useState, useEffect, useCallback } from "react";
import { fetchPanelPrices, fetchTariffs, PanelPriceData, TariffData, MarketDataResult } from "@/lib/api/marketData";
import { setActiveTariffs, getActiveTariffs } from "@/lib/egyptTariffs";

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

      // Wire scraped tariffs into the active tariff system
      if (tariffData.data && tariffData.isLive && tariffData.data.tiers?.length > 0) {
        setActiveTariffs(
          tariffData.data.tiers,
          tariffData.data.commercial_rate,
          tariffData.data.industrial_rate,
          tariffData.data.effective_date,
        );
        console.log("✅ Active tariffs updated from live data:", tariffData.data.effective_date);
      }
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

  // Get active tariff info for display
  const getActiveTariffInfo = useCallback(() => {
    return getActiveTariffs();
  }, [tariffs]);

  return {
    panelPrices,
    tariffs,
    loading,
    refresh,
    getCostPerKW,
    getActiveTariffInfo,
  };
}
