import { useParams } from "react-router-dom";
import { SeoPage } from "@/components/seo/SeoPage";
import { getGovernorate } from "@/seo/data/governorates";
import { getPropertyType } from "@/seo/data/propertyTypes";
import { getBill, getComparison, getGuide, getFinancing, getRoi } from "@/seo/data/topics";
import {
  buildGovernoratePage, buildPropertyTypePage, buildBillPage,
  buildComparisonPage, buildGuidePage, buildFinancingPage, buildRoiPage,
} from "@/seo/generator";
import NotFound from "./NotFound";

type Lang = "en" | "ar";

const decode = (s?: string) => (s ? decodeURIComponent(s) : "");

export const GovernorateRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const g = getGovernorate(decode(slug));
  if (!g) return <NotFound />;
  return <SeoPage {...buildGovernoratePage(g, lang)} />;
};

export const PropertyTypeRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const pt = getPropertyType(decode(slug));
  if (!pt) return <NotFound />;
  return <SeoPage {...buildPropertyTypePage(pt, lang)} />;
};

export const BillRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const b = getBill(decode(slug));
  if (!b) return <NotFound />;
  return <SeoPage {...buildBillPage(b, lang)} />;
};

export const ComparisonRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const c = getComparison(decode(slug));
  if (!c) return <NotFound />;
  return <SeoPage {...buildComparisonPage(c, lang)} />;
};

export const GuideRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const g = getGuide(decode(slug));
  if (!g) return <NotFound />;
  return <SeoPage {...buildGuidePage(g, lang)} />;
};

export const FinancingRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const f = getFinancing(decode(slug));
  if (!f) return <NotFound />;
  return <SeoPage {...buildFinancingPage(f, lang)} />;
};

export const RoiRoute = ({ lang }: { lang: Lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const r = getRoi(decode(slug));
  if (!r) return <NotFound />;
  return <SeoPage {...buildRoiPage(r, lang)} />;
};
