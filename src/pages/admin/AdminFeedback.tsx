import { useTranslation } from "react-i18next";
import FeedbackTable from "@/components/admin/FeedbackTable";

const AdminFeedback = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isAr ? "آراء المستخدمين" : "User Feedback"}
        </h1>
        <p className="text-muted-foreground">
          {isAr
            ? "تقييمات وملاحظات المستخدمين بعد مشاهدة التقارير"
            : "User ratings and comments after viewing reports"}
        </p>
      </div>
      <FeedbackTable />
    </div>
  );
};

export default AdminFeedback;
