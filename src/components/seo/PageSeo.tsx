import { useTranslation } from "react-i18next";
import {
  SeoHead,
  orgSchema,
  websiteSchema,
  breadcrumbSchema,
  articleSchema,
  faqSchema,
  localBusinessSchema,
} from "./SeoHead";

export interface PageSeoConfig {
  /** Path for English (must start with /) */
  path: string;
  /** Path for Arabic (defaults to `/ar` + path) */
  arPath?: string;
  /** English meta */
  en: { title: string; description: string; keywords?: string };
  /** Arabic meta */
  ar: { title: string; description: string; keywords?: string };
  /** Optional breadcrumb (English labels). Auto-localizes home label. */
  breadcrumbs?: { name: string; nameAr: string; path: string }[];
  /** Optional FAQ entries to attach FAQPage schema */
  faqs?: { en: { q: string; a: string }[]; ar: { q: string; a: string }[] };
  /** Include LocalBusiness schema (contact page) */
  localBusiness?: boolean;
  type?: "website" | "article";
}

/**
 * Drop-in SEO wrapper for legacy pages that don't go through SeoPage.
 * Reads current i18n language to pick EN vs AR metadata.
 */
export const PageSeo = ({
  path,
  arPath,
  en,
  ar,
  breadcrumbs,
  faqs,
  localBusiness,
  type = "website",
}: PageSeoConfig) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const lang: "en" | "ar" = isAr ? "ar" : "en";

  const enPath = path;
  const aPath = arPath ?? `/ar${path}`;
  const currentPath = isAr ? aPath : enPath;
  const altPath = isAr ? enPath : aPath;

  const meta = isAr ? ar : en;

  const schemas: Record<string, unknown>[] = [orgSchema, websiteSchema];
  if (type === "article") {
    schemas.push(articleSchema(meta.title, meta.description, currentPath));
  }
  if (breadcrumbs && breadcrumbs.length) {
    const homeName = isAr ? "الرئيسية" : "Home";
    schemas.push(
      breadcrumbSchema([
        { name: homeName, path: "/" },
        ...breadcrumbs.map((b) => ({
          name: isAr ? b.nameAr : b.name,
          path: b.path,
        })),
      ])
    );
  }
  if (faqs) {
    schemas.push(faqSchema(isAr ? faqs.ar : faqs.en));
  }
  if (localBusiness) {
    schemas.push(localBusinessSchema);
  }

  return (
    <SeoHead
      title={meta.title}
      description={meta.description}
      path={currentPath}
      altPath={altPath}
      lang={lang}
      type={type}
      schema={schemas}
      keywords={meta.keywords}
    />
  );
};
