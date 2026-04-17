import { Helmet } from "react-helmet-async";

const SITE = "https://solarmatch.site";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;          // e.g. "/features" or "/ar/features"
  altPath?: string;      // hreflang counterpart, e.g. "/ar/features"
  lang?: "en" | "ar";
  type?: "website" | "article";
  schema?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string;
}

export const SeoHead = ({
  title,
  description,
  path,
  altPath,
  lang = "en",
  type = "website",
  schema,
  keywords,
}: SeoHeadProps) => {
  const url = `${SITE}${path}`;
  const altUrl = altPath ? `${SITE}${altPath}` : undefined;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <Helmet>
      <html lang={lang} dir={dir} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* hreflang */}
      <link rel="alternate" hrefLang={lang} href={url} />
      {altUrl && (
        <link rel="alternate" hrefLang={lang === "en" ? "ar" : "en"} href={altUrl} />
      )}
      <link rel="alternate" hrefLang="x-default" href={lang === "en" ? url : (altUrl || url)} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="SolarMatch" />
      <meta property="og:locale" content={lang === "ar" ? "ar_EG" : "en_US"} />
      {altUrl && (
        <meta property="og:locale:alternate" content={lang === "ar" ? "en_US" : "ar_EG"} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SolarMatch",
  url: SITE,
  logo: `${SITE}/favicon.png`,
  sameAs: [],
  description:
    "SolarMatch — Egypt's rooftop solar feasibility platform. NASA & Google Solar data, real 2026 tariffs, AI-verified financial analysis.",
};

export const faqSchema = (
  items: { q: string; a: string }[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});

export const articleSchema = (
  title: string,
  description: string,
  path: string
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  author: { "@type": "Organization", name: "SolarMatch" },
  publisher: {
    "@type": "Organization",
    name: "SolarMatch",
    logo: { "@type": "ImageObject", url: `${SITE}/favicon.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${path}` },
  datePublished: "2026-01-01",
});

export { SITE };
