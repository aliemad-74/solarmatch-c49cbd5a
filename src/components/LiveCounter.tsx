import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Zap } from "lucide-react";

const LiveCounter = () => {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [reportsResult, usersResult, totalKwResult] = await Promise.all([
        supabase.from("report_history").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("report_history").select("system_size_kw"),
      ]);

      const totalKw = totalKwResult.data?.reduce((acc, row) => 
        acc + (Number(row.system_size_kw) || 0), 0
      ) || 0;

      return {
        reports: reportsResult.count || 0,
        users: usersResult.count || 0,
        totalKw: Math.round(totalKw),
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const counters = [
    {
      icon: FileText,
      value: stats?.reports || 0,
      label: t("counter.reportsGenerated"),
      suffix: "+",
    },
    {
      icon: Users,
      value: stats?.users || 0,
      label: t("counter.happyUsers"),
      suffix: "+",
    },
    {
      icon: Zap,
      value: stats?.totalKw || 0,
      label: t("counter.kwCalculated"),
      suffix: " kW",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-8">
      {counters.map((counter, index) => (
        <div key={index} className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
            <counter.icon className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {counter.value.toLocaleString()}{counter.suffix}
          </p>
          <p className="text-sm text-muted-foreground">{counter.label}</p>
        </div>
      ))}
    </div>
  );
};

export default LiveCounter;
