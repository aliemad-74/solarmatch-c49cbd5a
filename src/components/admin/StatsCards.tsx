import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserCheck, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    totalReports: number;
    totalLeads: number;
    newLeadsToday: number;
    usersToday: number;
  } | null;
  isLoading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t("admin.stats.totalUsers"),
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("admin.stats.totalReports"),
      value: stats?.totalReports ?? 0,
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("admin.stats.totalLeads"),
      value: stats?.totalLeads ?? 0,
      icon: UserCheck,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: t("admin.stats.newLeadsToday"),
      value: stats?.newLeadsToday ?? 0,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
