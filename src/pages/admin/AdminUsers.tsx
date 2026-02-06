import { useTranslation } from "react-i18next";
import UsersTable from "@/components/admin/UsersTable";

const AdminUsers = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("admin.users.title")}</h1>
        <p className="text-muted-foreground">{t("admin.users.subtitle")}</p>
      </div>

      {/* Table */}
      <UsersTable />
    </div>
  );
};

export default AdminUsers;
