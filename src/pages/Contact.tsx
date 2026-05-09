import { useTranslation } from "react-i18next";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Mail, Phone, MapPin, MessageCircle, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const Contact = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const channels = isAr
    ? [
        {
          icon: MessageCircle,
          label: "واتساب",
          value: "+20 111 100 9619",
          href: "https://wa.me/201111009619",
          cta: "افتح المحادثة",
          color: "text-[#25D366]",
        },
        {
          icon: Mail,
          label: "البريد الإلكتروني",
          value: "support@solarmatch.app",
          href: "mailto:support@solarmatch.app",
          cta: "أرسل رسالة",
          color: "text-primary",
        },
        {
          icon: Phone,
          label: "الهاتف",
          value: "+20 111 100 9619",
          href: "tel:+201111009619",
          cta: "اتصل الآن",
          color: "text-accent-foreground",
        },
      ]
    : [
        {
          icon: MessageCircle,
          label: "WhatsApp",
          value: "+20 111 100 9619",
          href: "https://wa.me/201111009619",
          cta: "Open chat",
          color: "text-[#25D366]",
        },
        {
          icon: Mail,
          label: "Email",
          value: "support@solarmatch.app",
          href: "mailto:support@solarmatch.app",
          cta: "Send a message",
          color: "text-primary",
        },
        {
          icon: Phone,
          label: "Phone",
          value: "+20 111 100 9619",
          href: "tel:+201111009619",
          cta: "Call now",
          color: "text-accent-foreground",
        },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageSeo
        path="/contact"
        en={{
          title: "Contact SolarMatch | Solar Support & Partnerships in Egypt",
          description: "Reach the SolarMatch team for support, partnerships, or expert consultation on solar panels, ROI, and feasibility studies for homes, farms, and businesses in Egypt.",
          keywords: "Contact SolarMatch, solar support Egypt, solar partnerships, solar consultation Egypt",
        }}
        ar={{
          title: "تواصل مع SolarMatch | دعم الطاقة الشمسية والشراكات في مصر",
          description: "تواصل مع فريق SolarMatch للحصول على الدعم، الشراكات، أو استشارة خبير في الطاقة الشمسية للمنازل والمزارع والشركات في مصر.",
          keywords: "تواصل مع SolarMatch, دعم الطاقة الشمسية, الطاقة الشمسية في مصر",
        }}
        breadcrumbs={[{ name: "Contact", nameAr: "تواصل معنا", path: "/contact" }]}
        localBusiness
      />
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {isAr ? "تواصل معنا" : "Contact Us"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isAr
                ? "فريقنا جاهز للإجابة على استفساراتك حول الطاقة الشمسية، التقارير، أو خطط الاشتراك."
                : "Our team is ready to answer your questions about solar energy, reports, or subscription plans."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {channels.map((c, i) => (
              <a
                key={i}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={() => {
                  const isWa = c.href.includes("wa.me");
                  const isMail = c.href.startsWith("mailto:");
                  const isTel = c.href.startsWith("tel:");
                  trackEvent(isWa ? "whatsapp_clicked" : "contact_clicked", {
                    channel: isWa ? "whatsapp" : isMail ? "email" : isTel ? "phone" : "other",
                    location: "contact_page",
                  });
                }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{c.label}</p>
                <p className="font-semibold mb-3" dir="ltr">{c.value}</p>
                <span className="text-sm text-primary group-hover:underline">{c.cta} →</span>
              </a>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isAr ? "ساعات العمل" : "Working Hours"}
                  </h3>
                  <p className="text-muted-foreground">
                    {isAr ? "السبت - الخميس" : "Saturday - Thursday"}
                    <br />
                    9:00 AM - 6:00 PM (GMT+2)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isAr ? "الموقع" : "Location"}
                  </h3>
                  <p className="text-muted-foreground">
                    {isAr ? "القاهرة، جمهورية مصر العربية" : "Cairo, Arab Republic of Egypt"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">
              {isAr ? "هل تريد تقرير جدوى؟" : "Need a feasibility report?"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isAr
                ? "ابدأ مجاناً واحصل على تحليل كامل لسطحك في أقل من دقيقة."
                : "Start free and get a full analysis of your rooftop in under a minute."}
            </p>
            <Button asChild size="lg">
              <a href="/">{isAr ? "ابدأ الآن" : "Get Started"}</a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Contact;
