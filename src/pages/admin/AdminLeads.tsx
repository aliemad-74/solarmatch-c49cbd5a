import { useTranslation } from "react-i18next";
import LeadsTable from "@/components/admin/LeadsTable";

const AdminLeads = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("admin.leads.title")}</h1>
        <p className="text-muted-foreground">{t("admin.leads.subtitle")}</p>
      </div>

      {/* Table */}
      <LeadsTable />
    </div>
  );
};

export default AdminLeads;
