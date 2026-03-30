import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarCalculation } from "@/lib/solarData";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AIAdvisorProps {
  results: SolarCalculation;
  locationName: string;
  monthlyConsumption: number;
  pvType: string;
  buildingType: string;
  preloadedRecommendation?: string;
  preloadedLoading?: boolean;
}

const AIAdvisor = ({ results, locationName, monthlyConsumption, pvType, buildingType, preloadedRecommendation, preloadedLoading }: AIAdvisorProps) => {
  const { t, i18n } = useTranslation();
  const [advice, setAdvice] = useState<string>(preloadedRecommendation || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(!!preloadedRecommendation);

  // Update when preloaded recommendation arrives
  useEffect(() => {
    if (preloadedRecommendation && preloadedRecommendation !== "AI analysis unavailable. Results are based on engineering calculations.") {
      setAdvice(preloadedRecommendation);
      setHasAsked(true);
    }
  }, [preloadedRecommendation]);

    setIsLoading(true);
    setAdvice("");
    setHasAsked(true);

    try {
      const solarData = {
        locationName,
        rooftopArea: results.usableArea,
        kWInstalled: results.kWInstalled,
        energyYear: results.energyYear,
        monthlyConsumption,
        coverageRatio: results.coverageRatio,
        pvType,
        buildingType,
        co2Reduction: results.co2Saved,
        totalCost: results.totalCost,
        savingsYear: results.savingsYear,
        paybackYears: results.paybackYears,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ solarData, language: i18n.language }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(t('ai.rateLimitError'));
          return;
        }
        if (response.status === 402) {
          toast.error(t('ai.paymentError'));
          return;
        }
        throw new Error("Failed to get AI advice");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAdvice = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullAdvice += content;
              setAdvice(fullAdvice);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Advisor error:", error);
      toast.error(t('ai.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-solar-orange/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('ai.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAsked ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4 text-sm">
              {t('ai.description')}
            </p>
            <Button
              onClick={getAdvice}
              className="gradient-solar text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {t('ai.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 me-2" />
                  {t('ai.getAdvice')}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {isLoading && !advice ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('ai.analyzing')}
                </div>
              ) : (
                <ReactMarkdown>{advice}</ReactMarkdown>
              )}
            </div>
            {!isLoading && advice && (
              <Button
                variant="outline"
                size="sm"
                onClick={getAdvice}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                {t('ai.refresh')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAdvisor;
