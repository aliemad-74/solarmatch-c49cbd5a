// Bills, comparisons, guides, financing, ROI topics — small but high-intent.
export interface BillTopic {
  slug: string; amountEGP: number; estKwh: number; recommendedKwp: number;
}
export const BILLS: BillTopic[] = [
  { slug: "500-egp",    amountEGP: 500,    estKwh: 280,   recommendedKwp: 2 },
  { slug: "1000-egp",   amountEGP: 1000,   estKwh: 520,   recommendedKwp: 3.5 },
  { slug: "2000-egp",   amountEGP: 2000,   estKwh: 950,   recommendedKwp: 6 },
  { slug: "3000-egp",   amountEGP: 3000,   estKwh: 1350,  recommendedKwp: 9 },
  { slug: "5000-egp",   amountEGP: 5000,   estKwh: 2100,  recommendedKwp: 14 },
  { slug: "10000-egp",  amountEGP: 10000,  estKwh: 4000,  recommendedKwp: 27 },
  { slug: "25000-egp",  amountEGP: 25000,  estKwh: 9500,  recommendedKwp: 65 },
  { slug: "50000-egp",  amountEGP: 50000,  estKwh: 18500, recommendedKwp: 130 },
  { slug: "100000-egp", amountEGP: 100000, estKwh: 36000, recommendedKwp: 250 },
];
export const getBill = (slug: string) => BILLS.find((b) => b.slug === slug);

export interface ComparisonTopic { slug: string; nameEn: string; nameAr: string; }
export const COMPARISONS: ComparisonTopic[] = [
  { slug: "solar-vs-generator",   nameEn: "Solar vs Diesel Generator",        nameAr: "الطاقة الشمسية مقابل المولد الديزل" },
  { slug: "solar-vs-grid",        nameEn: "Solar vs Grid Electricity",        nameAr: "الطاقة الشمسية مقابل كهرباء الشبكة" },
  { slug: "on-grid-vs-off-grid",  nameEn: "On-Grid vs Off-Grid Solar",        nameAr: "أنظمة on-grid مقابل off-grid" },
  { slug: "lithium-vs-gel",       nameEn: "Lithium vs Gel Batteries",         nameAr: "بطاريات الليثيوم مقابل الجل" },
  { slug: "monocrystalline-vs-polycrystalline", nameEn: "Monocrystalline vs Polycrystalline Panels", nameAr: "ألواح مونو مقابل بولي" },
  { slug: "string-vs-microinverter", nameEn: "String vs Micro Inverters",     nameAr: "إنفرتر مركزي مقابل مايكرو" },
];
export const getComparison = (slug: string) => COMPARISONS.find((c) => c.slug === slug);

export interface GuideTopic { slug: string; nameEn: string; nameAr: string; }
export const GUIDES: GuideTopic[] = [
  { slug: "how-solar-panels-work",   nameEn: "How Solar Panels Work",        nameAr: "كيف تعمل الألواح الشمسية" },
  { slug: "net-metering-egypt",      nameEn: "Net Metering in Egypt",        nameAr: "صافي القياس في مصر" },
  { slug: "solar-maintenance",       nameEn: "Solar Panel Maintenance",      nameAr: "صيانة الألواح الشمسية" },
  { slug: "solar-myths",             nameEn: "Top Solar Myths Debunked",     nameAr: "أشهر خرافات الطاقة الشمسية" },
  { slug: "solar-installation-guide", nameEn: "Solar Installation Guide",     nameAr: "دليل تركيب الطاقة الشمسية" },
  { slug: "khamaseen-and-dust",      nameEn: "Khamaseen Dust & Solar Output", nameAr: "الخماسين والغبار وإنتاج الطاقة" },
];
export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export interface FinancingTopic { slug: string; nameEn: string; nameAr: string; }
export const FINANCING: FinancingTopic[] = [
  { slug: "installment-plans",  nameEn: "Solar Installment Plans Egypt", nameAr: "أنظمة تقسيط الطاقة الشمسية في مصر" },
  { slug: "bank-solar-loans",   nameEn: "Bank Solar Loans Egypt",        nameAr: "قروض الطاقة الشمسية من البنوك" },
  { slug: "solar-leasing",      nameEn: "Solar Leasing in Egypt",        nameAr: "تأجير الطاقة الشمسية في مصر" },
  { slug: "ppa-egypt",          nameEn: "Power Purchase Agreements (PPA)", nameAr: "اتفاقيات شراء الطاقة (PPA)" },
];
export const getFinancing = (slug: string) => FINANCING.find((f) => f.slug === slug);

export interface RoiTopic { slug: string; nameEn: string; nameAr: string; }
export const ROI_TOPICS: RoiTopic[] = [
  { slug: "is-solar-worth-it-egypt",  nameEn: "Is Solar Worth It in Egypt?", nameAr: "هل الطاقة الشمسية تستحق التكلفة في مصر؟" },
  { slug: "solar-roi-2026",           nameEn: "Solar ROI in Egypt 2026",     nameAr: "عائد الاستثمار في الطاقة الشمسية 2026" },
  { slug: "payback-period-calculator", nameEn: "Solar Payback Period",       nameAr: "فترة استرداد الاستثمار الشمسي" },
  { slug: "savings-by-bill-size",     nameEn: "Savings by Electricity Bill Size", nameAr: "التوفير حسب حجم فاتورة الكهرباء" },
];
export const getRoi = (slug: string) => ROI_TOPICS.find((r) => r.slug === slug);
