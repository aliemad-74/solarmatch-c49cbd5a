import { useTranslation } from "react-i18next";
import ReportsTable from "@/components/admin/ReportsTable";

const AdminReports = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("admin.reports.title")}</h1>
        <p className="text-muted-foreground">{t("admin.reports.subtitle")}</p>
      </div>

      {/* Table */}
      <ReportsTable />
    </div>
  );
};

export default AdminReports;
