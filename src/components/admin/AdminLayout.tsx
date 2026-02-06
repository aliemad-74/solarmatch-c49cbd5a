import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminSidebar from "./AdminSidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminLayout = () => {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const isRTL = i18n.language === "ar";

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      <AdminSidebar />
      <main
        className={cn(
          "min-h-screen transition-all",
          isMobile ? "p-4" : isRTL ? "mr-64 p-6" : "ml-64 p-6"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
