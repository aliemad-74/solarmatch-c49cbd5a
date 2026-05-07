import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Wallet, Banknote, Landmark } from "lucide-react";
import { Link } from "react-router-dom";

// Indicative Egyptian bank rates for solar / personal loans (annual %)
const BANKS = [
  { name: "CIB", nameAr: "البنك التجاري الدولي", rate: 26.5, maxYears: 7 },
  { name: "NBE", nameAr: "البنك الأهلي المصري", rate: 25.0, maxYears: 8 },
  { name: "Banque Misr", nameAr: "بنك مصر", rate: 25.5, maxYears: 8 },
  { name: "QNB Alahli", nameAr: "بنك قطر الوطني الأهلي", rate: 27.0, maxYears: 7 },
  { name: "AAIB", nameAr: "البنك العربي الأفريقي", rate: 26.0, maxYears: 7 },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));

function monthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const FinancingCalculator = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [systemCost, setSystemCost] = useState(150000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [years, setYears] = useState(5);
  const [annualSavings, setAnnualSavings] = useState(36000);

  const downPayment = (systemCost * downPaymentPct) / 100;
  const loanAmount = systemCost - downPayment;

  const banks = useMemo(
    () =>
      BANKS.map((b) => {
        const usableYears = Math.min(years, b.maxYears);
        const m = monthlyPayment(loanAmount, b.rate, usableYears);
        const total = m * usableYears * 12 + downPayment;
        const monthlySavings = annualSavings / 12;
        const netMonthly = m - monthlySavings;
        return { ...b, usableYears, monthly: m, total, netMonthly, monthlySavings };
      }).sort((a, b) => a.total - b.total),
    [loanAmount, years, downPayment, annualSavings]
  );

  const cashPaybackYears = annualSavings > 0 ? systemCost / annualSavings : Infinity;
  const best = banks[0];
  // Financed payback: years until cumulative savings exceed total payments + downPayment
  const financedPayback = useMemo(() => {
    if (!best || annualSavings <= 0) return Infinity;
    let cum = -downPayment;
    for (let y = 1; y <= 30; y++) {
      const yearlyOut = y <= best.usableYears ? best.monthly * 12 : 0;
      cum += annualSavings - yearlyOut;
      if (cum >= 0) return y;
    }
    return Infinity;
  }, [best, annualSavings, downPayment]);

  return (
    <div className={isAr ? "rtl" : ""} dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <Calculator className="h-4 w-4" />
              {isAr ? "أداة جديدة" : "New Tool"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {isAr ? "حاسبة تمويل الطاقة الشمسية" : "Solar Financing Calculator"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isAr
                ? "قارن بين الدفع الكاش والتقسيط البنكي، وشوف هل التوفير الشهري بيغطي القسط ولا لأ."
                : "Compare cash vs bank financing and see if your monthly savings cover the installment."}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Inputs */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{isAr ? "بيانات النظام" : "System Inputs"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{isAr ? "تكلفة النظام (جنيه)" : "System Cost (EGP)"}</Label>
                  <Input
                    type="number"
                    value={systemCost}
                    onChange={(e) => setSystemCost(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {isAr ? "التوفير السنوي المتوقع (جنيه)" : "Expected Annual Savings (EGP)"}
                  </Label>
                  <Input
                    type="number"
                    value={annualSavings}
                    onChange={(e) => setAnnualSavings(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{isAr ? "الدفعة المقدمة" : "Down Payment"}</Label>
                    <span className="text-sm font-medium">{downPaymentPct}%</span>
                  </div>
                  <Slider
                    value={[downPaymentPct]}
                    onValueChange={(v) => setDownPaymentPct(v[0])}
                    min={0}
                    max={80}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {fmt(downPayment)} {isAr ? "جنيه" : "EGP"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{isAr ? "مدة التمويل" : "Loan Term"}</Label>
                    <span className="text-sm font-medium">
                      {years} {isAr ? "سنة" : "years"}
                    </span>
                  </div>
                  <Slider
                    value={[years]}
                    onValueChange={(v) => setYears(v[0])}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Wallet className="h-4 w-4" />
                      {isAr ? "كاش - استرداد" : "Cash Payback"}
                    </div>
                    <div className="text-2xl font-bold">
                      {isFinite(cashPaybackYears) ? cashPaybackYears.toFixed(1) : "—"}{" "}
                      <span className="text-base font-normal">
                        {isAr ? "سنة" : "yrs"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Banknote className="h-4 w-4" />
                      {isAr ? "تقسيط - استرداد" : "Financed Payback"}
                    </div>
                    <div className="text-2xl font-bold">
                      {isFinite(financedPayback) ? financedPayback : "—"}{" "}
                      <span className="text-base font-normal">
                        {isAr ? "سنة" : "yrs"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <TrendingUp className="h-4 w-4" />
                      {isAr ? "توفير شهري" : "Monthly Savings"}
                    </div>
                    <div className="text-2xl font-bold">
                      {fmt(annualSavings / 12)}{" "}
                      <span className="text-base font-normal">
                        {isAr ? "جنيه" : "EGP"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    {isAr ? "مقارنة عروض البنوك" : "Bank Offers Comparison"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {banks.map((b, i) => (
                      <div
                        key={b.name}
                        className={`p-4 rounded-lg border ${
                          i === 0 ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {isAr ? b.nameAr : b.name}
                              {i === 0 && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {isAr ? "الأفضل" : "Best"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {b.rate}% {isAr ? "فائدة سنوية" : "annual rate"} ·{" "}
                              {b.usableYears} {isAr ? "سنة" : "yrs"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {isAr ? "قسط شهري" : "Monthly"}
                            </div>
                            <div className="text-xl font-bold">{fmt(b.monthly)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {isAr ? "إجمالي المدفوع" : "Total Paid"}
                            </div>
                            <div className="font-medium">{fmt(b.total)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {isAr ? "صافي شهري بعد التوفير" : "Net Monthly"}
                            </div>
                            <div
                              className={`font-medium ${
                                b.netMonthly <= 0 ? "text-primary" : ""
                              }`}
                            >
                              {b.netMonthly <= 0
                                ? (isAr ? "ربح " : "+") + fmt(Math.abs(b.netMonthly))
                                : fmt(b.netMonthly)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {isAr ? "تكلفة التمويل" : "Finance Cost"}
                            </div>
                            <div className="font-medium">
                              {fmt(b.total - systemCost)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {isAr
                      ? "* الأسعار تقديرية وللمقارنة فقط. تواصل مع البنك للحصول على العرض النهائي."
                      : "* Rates are indicative for comparison only. Contact the bank for a final offer."}
                  </p>
                </CardContent>
              </Card>

              <div className="text-center">
                <Link to={isAr ? "/ar" : "/"}>
                  <Button size="lg">
                    {isAr ? "احسب نظامك المناسب أولاً" : "Calculate Your System First"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FinancingCalculator;
