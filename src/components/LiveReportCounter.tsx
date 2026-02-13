import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <span>{display}</span>;
}

const LiveReportCounter = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{ reports: number; users: number; kw: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc("get_public_stats");
      if (data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setStats({
          reports: parsed.total_reports || 0,
          users: parsed.total_users || 0,
          kw: Math.round(parsed.total_kw || 0),
        });
      }
    };
    fetchStats();
  }, []);

  if (!stats || (stats.reports === 0 && stats.users === 0)) return null;

  const items = [
    { icon: FileText, value: stats.reports, label: t("counter.reportsGenerated") },
    { icon: Users, value: stats.users, label: t("counter.happyUsers") },
    { icon: Zap, value: stats.kw, label: t("counter.kwCalculated") },
  ];

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {items.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <item.icon className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">
              <AnimatedNumber value={item.value} />+
            </span>
            <span className="text-muted-foreground">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveReportCounter;
