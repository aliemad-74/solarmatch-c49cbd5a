import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import {
  MapPin, Home, Receipt, Ruler, Cpu, PlugZap,
  Zap, Sun, BatteryCharging, Wallet, TrendingUp, Clock, Leaf, LineChart,
  CheckCircle2, Download, Share2, GitCompare, ArrowRight, Sparkles,
  Building2, Factory,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ---------- Animated Counter ---------- */
const CountUp = ({
  value, decimals = 0, prefix = "", suffix = "", duration = 1500, start = false,
}: { value: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; start?: boolean }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, start]);
  const formatted = decimals > 0
    ? v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(v).toLocaleString();
  return <span>{prefix}{formatted}{suffix}</span>;
};

/* ---------- Result Card ---------- */
interface RCProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  accent?: "green" | "gold" | "blue" | "teal";
  delay?: number;
  start: boolean;
}
const accentMap = {
  green: { bg: "bg-solar-green-soft", text: "text-solar-green", ring: "ring-solar-green/20" },
  gold:  { bg: "bg-solar-gold-soft",  text: "text-solar-gold",  ring: "ring-solar-gold/20" },
  blue:  { bg: "bg-solar-blue-soft",  text: "text-solar-blue",  ring: "ring-solar-blue/20" },
  teal:  { bg: "bg-solar-green-soft", text: "text-solar-teal",  ring: "ring-solar-teal/20" },
};
const StatCard = ({ icon, label, value, decimals = 0, prefix = "", suffix = "", sub, accent = "blue", delay = 0, start }: RCProps) => {
  const a = accentMap[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={start ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <Card className="p-5 h-full hover:shadow-card-hover transition-all duration-200 border-border/70">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.bg} ${a.text} ring-1 ${a.ring}`}>
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        <p className={`text-2xl md:text-[28px] font-display font-bold leading-tight ${a.text}`}>
          <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} start={start} />
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </Card>
    </motion.div>
  );
};

/* ---------- Main Component ---------- */
const DemoCaseStudy = ({ onCtaClick }: { onCtaClick?: () => void }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  const t = (en: string, ar: string) => (isAr ? ar : en);

  /* 25y projection chart data — bill grows ~7%/yr; with solar covers 87% */
  const chartData = (() => {
    const arr: { year: string; bill: number; solar: number }[] = [];
    const monthlyBill = 1200;
    let yearlyBill = monthlyBill * 12;
    const inflation = 0.07;
    for (let y = 1; y <= 25; y += 2) {
      const projected = yearlyBill * Math.pow(1 + inflation, y - 1);
      const withSolar = projected * 0.13; // 87% covered
      arr.push({
        year: `${t("Y", "س")}${y}`,
        bill: Math.round(projected),
        solar: Math.round(withSolar),
      });
    }
    return arr;
  })();

  return (
    <section ref={ref} className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <Badge variant="secondary" className="mb-4 bg-solar-gold-soft text-solar-gold border-solar-gold/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {t("Live Demo", "عرض حي")}
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            {t("See What You'll Get in 60 Seconds", "شوف هتحصل على إيه في 60 ثانية")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {t(
              "A real example of a solar feasibility report for a home in New Cairo",
              "مثال حقيقي لتقرير جدوى الطاقة الشمسية لمنزل في القاهرة الجديدة"
            )}
          </p>
        </motion.div>

        {/* Case title bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8 p-5 rounded-xl bg-card border border-border shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-solar-green-soft text-solar-green flex items-center justify-center ring-1 ring-solar-green/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg md:text-xl font-bold text-foreground">
                {t("Villa in New Cairo", "فيلا في القاهرة الجديدة")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("Monthly Bill: 1,200 EGP", "فاتورة شهرية: 1,200 ج.م")}
              </p>
            </div>
          </div>
          <Badge className="self-start md:self-auto bg-solar-green text-white hover:bg-solar-green-dark border-0">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t("Highly Suitable", "مناسب جداً")}
          </Badge>
        </motion.div>

        {/* Layout: Inputs + Results */}
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? 20 : -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-4"
          >
            <Card className="p-6 h-full">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                {t("User Inputs", "بيانات المستخدم")}
              </h4>
              <ul className="space-y-3.5">
                {[
                  { icon: <MapPin className="w-4 h-4" />, label: t("Location", "الموقع"), value: t("New Cairo", "القاهرة الجديدة") },
                  { icon: <Home className="w-4 h-4" />, label: t("Building Type", "نوع المبنى"), value: t("Residential Villa", "فيلا سكنية") },
                  { icon: <Receipt className="w-4 h-4" />, label: t("Monthly Bill", "الفاتورة الشهرية"), value: t("1,200 EGP", "1,200 ج.م") },
                  { icon: <Ruler className="w-4 h-4" />, label: t("Roof Area", "مساحة السطح"), value: "60 m²" },
                  { icon: <Cpu className="w-4 h-4" />, label: t("Panel Type", "نوع الألواح"), value: "Mono PERC" },
                  { icon: <PlugZap className="w-4 h-4" />, label: t("System Type", "نوع النظام"), value: t("On-grid", "متصل بالشبكة") },
                ].map((row, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0">
                    <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <span className="text-solar-blue">{row.icon}</span>
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground text-right">{row.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Result cards grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard start={inView} delay={0.20} accent="blue"  icon={<Zap className="w-5 h-5" />}
              label={t("System Size", "حجم النظام")} value={8.4} decimals={1} suffix=" kW" sub={t("18 panels", "18 لوح")} />
            <StatCard start={inView} delay={0.25} accent="gold"  icon={<Sun className="w-5 h-5" />}
              label={t("Annual Production", "الإنتاج السنوي")} value={15120} suffix=" kWh" />
            <StatCard start={inView} delay={0.30} accent="green" icon={<BatteryCharging className="w-5 h-5" />}
              label={t("Coverage", "التغطية")} value={87} suffix="%" sub={t("of usage", "من الاستهلاك")} />
            <StatCard start={inView} delay={0.35} accent="teal"  icon={<Wallet className="w-5 h-5" />}
              label={t("Total Cost", "التكلفة الكلية")} value={159600} suffix=" EGP" />
            <StatCard start={inView} delay={0.40} accent="green" icon={<TrendingUp className="w-5 h-5" />}
              label={t("Annual Savings", "التوفير السنوي")} value={29484} suffix=" EGP" />
            <StatCard start={inView} delay={0.45} accent="gold"  icon={<Clock className="w-5 h-5" />}
              label={t("Payback Period", "فترة الاسترداد")} value={5.4} decimals={1} suffix={t(" yrs", " سنة")} />
            <StatCard start={inView} delay={0.50} accent="green" icon={<Leaf className="w-5 h-5" />}
              label={t("CO₂ Reduction", "خفض الكربون")} value={8.3} decimals={1} suffix={t(" t/yr", " طن/سنة")} />
            <StatCard start={inView} delay={0.55} accent="blue"  icon={<LineChart className="w-5 h-5" />}
              label={t("25-Year Net Return", "صافي العائد 25 سنة")} value={483000} suffix=" EGP" />
          </div>
        </div>

        {/* AI Verdict + Chart */}
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-5"
          >
            <Card className="p-6 h-full bg-gradient-to-br from-solar-green-soft/60 to-card border-solar-green/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-solar-gold" />
                <h4 className="font-display text-lg font-bold text-foreground">
                  {t("AI Recommendation", "توصية الذكاء الاصطناعي")}
                </h4>
              </div>
              <Badge className="bg-solar-green text-white hover:bg-solar-green-dark mb-4 border-0">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {t("Highly Suitable", "مناسب جداً")}
              </Badge>
              <p className="text-sm text-foreground/80 leading-relaxed mb-5">
                {t(
                  "Based on your consumption, location, and solar potential, installing a solar system is financially viable with strong long-term returns.",
                  "بناءً على استهلاكك وموقعك والإمكانات الشمسية، تركيب نظام شمسي مجدي مالياً مع عوائد قوية على المدى الطويل."
                )}
              </p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("Confidence Score", "درجة الثقة")}
                  </span>
                  <span className="text-sm font-bold text-solar-green">91%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: "91%" } : {}}
                    transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-solar-green to-solar-gold rounded-full"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-7"
          >
            <Card className="p-6 h-full">
              <h4 className="font-display text-lg font-bold text-foreground mb-1">
                {t("Electricity Bill vs Solar Savings", "فاتورة الكهرباء مقابل التوفير")}
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                {t("Projected over 25 years (EGP / year)", "التوقعات على مدى 25 سنة (ج.م / سنة)")}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => v.toLocaleString() + " EGP"}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="bill" name={t("Without Solar", "بدون طاقة شمسية")} fill="hsl(var(--solar-blue))" radius={[4,4,0,0]} />
                    <Bar dataKey="solar" name={t("With Solar", "مع الطاقة الشمسية")} fill="hsl(var(--solar-green))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* PDF / Sharing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mb-10"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="font-display text-lg font-bold text-foreground mb-1">
                  {t("Get Your Full Report", "احصل على تقريرك الكامل")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("Download, share, and compare scenarios — all included.", "حمّل، شارك، وقارن السيناريوهات — كل ده متضمن.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted text-sm font-medium text-foreground">
                  <Download className="w-4 h-4 text-solar-blue" />
                  {t("PDF (AR & EN)", "PDF (عربي وإنجليزي)")}
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted text-sm font-medium text-foreground">
                  <Share2 className="w-4 h-4 text-solar-green" />
                  {t("Share Report", "مشاركة التقرير")}
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted text-sm font-medium text-foreground">
                  <GitCompare className="w-4 h-4 text-solar-gold" />
                  {t("Compare Scenarios", "مقارنة السيناريوهات")}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Mini Case Studies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid md:grid-cols-2 gap-4 mb-10"
        >
          {[
            {
              icon: <Leaf className="w-5 h-5" />,
              accent: "green" as const,
              title: t("Farm in Beheira", "مزرعة في البحيرة"),
              meta: t("12 Feddans • Irrigation", "12 فدان • ري"),
              stats: [
                { l: t("System", "النظام"), v: "55 kW" },
                { l: t("Savings/yr", "توفير/سنة"), v: "180k EGP" },
                { l: t("Payback", "الاسترداد"), v: t("4.8 yrs", "4.8 سنة") },
              ],
            },
            {
              icon: <Factory className="w-5 h-5" />,
              accent: "blue" as const,
              title: t("Factory in Alexandria", "مصنع في الإسكندرية"),
              meta: t("Industrial • 3-Phase", "صناعي • 3 فاز"),
              stats: [
                { l: t("System", "النظام"), v: "120 kW" },
                { l: t("Savings/yr", "توفير/سنة"), v: "420k EGP" },
                { l: t("Payback", "الاسترداد"), v: t("4.2 yrs", "4.2 سنة") },
              ],
            },
          ].map((c, i) => {
            const a = accentMap[c.accent];
            return (
              <Card key={i} className="p-5 hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.bg} ${a.text} ring-1 ${a.ring}`}>
                    {c.icon}
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-foreground">{c.title}</h5>
                    <p className="text-xs text-muted-foreground">{c.meta}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {c.stats.map((s, j) => (
                    <div key={j} className="rounded-lg bg-muted/60 p-2.5 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{s.l}</p>
                      <p className={`text-sm font-bold ${a.text}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={onCtaClick}
            className="h-14 px-8 text-base bg-solar-green hover:bg-solar-green-dark text-white shadow-lg hover:shadow-xl transition-all group"
          >
            {t("Get Your Solar Report Now", "احصل على تقريرك الشمسي الآن")}
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isAr ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {t("Takes less than 60 seconds", "أقل من 60 ثانية")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoCaseStudy;
