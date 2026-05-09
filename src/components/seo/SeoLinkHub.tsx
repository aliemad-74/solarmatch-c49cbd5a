import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GOVERNORATES } from "@/seo/data/governorates";
import { PROPERTY_TYPES } from "@/seo/data/propertyTypes";
import { BILLS, GUIDES, COMPARISONS } from "@/seo/data/topics";

const Pill = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="inline-block text-xs md:text-sm px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted hover:text-primary transition-colors"
  >
    {children}
  </Link>
);

const fmt = new Intl.NumberFormat("en-US");

const SeoLinkHub = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const ar = (s: string) => (isAr ? `/ar/${s}` : `/${s}`);

  const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="font-display text-base font-semibold text-foreground mb-3">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  return (
    <section
      aria-label={isAr ? "استكشف الطاقة الشمسية" : "Explore solar"}
      className="border-t border-border bg-muted/30 py-12 mt-8"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          {isAr ? "استكشف الطاقة الشمسية في مصر" : "Explore Solar in Egypt"}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
          {isAr
            ? "محتوى مخصص حسب المحافظة، نوع العقار، وحجم فاتورتك — مدعوم ببيانات NASA و Google Solar."
            : "Tailored content by governorate, property type, and bill size — backed by NASA & Google Solar data."}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Col title={isAr ? "حسب المحافظة" : "By Governorate"}>
            {GOVERNORATES.slice(0, 12).map((g) => (
              <Pill
                key={g.slug}
                to={isAr ? `/ar/solar/${encodeURIComponent(g.arSlug)}` : `/solar/${g.slug}`}
              >
                {isAr ? g.nameAr : g.nameEn}
              </Pill>
            ))}
          </Col>

          <Col title={isAr ? "حسب نوع العقار" : "By Property Type"}>
            {PROPERTY_TYPES.map((pt) => (
              <Pill
                key={pt.slug}
                to={isAr ? `/ar/solar-for/${encodeURIComponent(pt.arSlug)}` : `/solar-for/${pt.slug}`}
              >
                {isAr ? pt.nameAr : pt.nameEn}
              </Pill>
            ))}
          </Col>

          <Col title={isAr ? "حسب فاتورة الكهرباء" : "By Bill Size"}>
            {BILLS.map((b) => (
              <Pill key={b.slug} to={isAr ? `/ar/solar-bill/${b.slug}` : `/solar-bill/${b.slug}`}>
                {isAr ? `${fmt.format(b.amountEGP)} ج.م` : `EGP ${fmt.format(b.amountEGP)}`}
              </Pill>
            ))}
          </Col>

          <Col title={isAr ? "أدلة إرشادية" : "Guides"}>
            {GUIDES.map((g) => (
              <Pill key={g.slug} to={isAr ? `/ar/guides/${g.slug}` : `/guides/${g.slug}`}>
                {isAr ? g.nameAr : g.nameEn}
              </Pill>
            ))}
          </Col>

          <Col title={isAr ? "مقارنات" : "Comparisons"}>
            {COMPARISONS.map((c) => (
              <Pill key={c.slug} to={isAr ? `/ar/compare/${c.slug}` : `/compare/${c.slug}`}>
                {isAr ? c.nameAr : c.nameEn}
              </Pill>
            ))}
          </Col>

          <Col title={isAr ? "موارد" : "Resources"}>
            <Pill to={ar("blog")}>{isAr ? "المدونة" : "Blog"}</Pill>
            <Pill to={ar("methodology")}>{isAr ? "المنهجية" : "Methodology"}</Pill>
            <Pill to={ar("financing")}>{isAr ? "حاسبة التمويل" : "Financing Calculator"}</Pill>
            <Pill to={ar("why-solarmatch")}>{isAr ? "لماذا SolarMatch" : "Why SolarMatch"}</Pill>
            <Pill to={ar("about")}>{isAr ? "من نحن" : "About"}</Pill>
          </Col>
        </div>
      </div>
    </section>
  );
};

export default SeoLinkHub;
