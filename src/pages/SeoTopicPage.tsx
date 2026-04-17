import { useParams } from "react-router-dom";
import { SeoPage } from "@/components/seo/SeoPage";
import { getSeoPage, SEO_SLUGS, SeoSlug } from "@/components/seo/seoContent";
import NotFound from "./NotFound";

interface Props {
  lang: "en" | "ar";
  slug?: SeoSlug;
}

const SeoTopicPage = ({ lang, slug: explicitSlug }: Props) => {
  const params = useParams<{ slug?: string }>();
  const slug = (explicitSlug ?? (params.slug as SeoSlug)) as SeoSlug;

  if (!SEO_SLUGS.includes(slug)) return <NotFound />;

  const props = getSeoPage(slug, lang);
  return <SeoPage {...props} />;
};

export default SeoTopicPage;
