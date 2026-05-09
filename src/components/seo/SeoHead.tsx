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
  const ogImage = `${SITE}/og-image.png`;

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
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="SolarMatch — Go Solar, Get Matched" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@solarmatch" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

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
  alternateName: ["Solar Match", "SolarMatch Egypt", "سولار ماتش"],
  url: SITE,
  logo: {
    "@type": "ImageObject",
    url: `${SITE}/logo-512.png`,
    width: 1024,
    height: 1024,
    caption: "SolarMatch",
  },
  image: `${SITE}/logo-512.png`,
  areaServed: { "@type": "Country", name: "Egypt" },
  sameAs: [],
  description:
    "SolarMatch — AI-powered rooftop solar feasibility platform for Egypt. Calculate solar system size, ROI, savings, payback and installation cost for homes, farms, and businesses.",
};

export const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SolarMatch",
  alternateName: "Solar Match",
  url: SITE,
  inLanguage: ["en", "ar"],
  publisher: { "@type": "Organization", name: "SolarMatch" },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE}/blog?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export const howToSchema = (
  name: string,
  description: string,
  steps: { name: string; text: string }[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name,
  description,
  step: steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.name,
    text: s.text,
  })),
});

export const speakableSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SpeakableSpecification",
  cssSelector: ["h1", "h2", "[data-speakable]"],
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

export const breadcrumbSchema = (
  items: { name: string; path: string }[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE}${item.path}`,
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
    logo: { "@type": "ImageObject", url: `${SITE}/logo-512.png`, width: 1024, height: 1024 },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${path}` },
  datePublished: "2026-01-01",
});

export const localBusinessSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SolarMatch",
  url: SITE,
  image: `${SITE}/logo-512.png`,
  logo: `${SITE}/logo-512.png`,
  telephone: "+201111009619",
  email: "support@solarmatch.app",
  areaServed: { "@type": "Country", name: "Egypt" },
  address: { "@type": "PostalAddress", addressCountry: "EG" },
  priceRange: "$$",
};

export { SITE };
