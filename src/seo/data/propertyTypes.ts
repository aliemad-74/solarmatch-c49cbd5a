export interface PropertyType {
  slug: string;
  arSlug: string;
  nameEn: string;
  nameAr: string;
  category: "residential" | "commercial" | "industrial" | "agricultural";
  typicalAreaM2: [number, number];
  typicalKwp: [number, number];
  monthlyKwh: [number, number];
  loadProfile: "daytime-heavy" | "evening-heavy" | "balanced" | "24-7";
  bestConfig: "on-grid" | "hybrid" | "off-grid";
}

export const PROPERTY_TYPES: PropertyType[] = [
  { slug: "villas",         arSlug: "الفيلات",       nameEn: "Villas",          nameAr: "الفيلات",        category: "residential", typicalAreaM2: [80, 250],  typicalKwp: [5, 15],   monthlyKwh: [800, 2500],   loadProfile: "evening-heavy", bestConfig: "hybrid" },
  { slug: "apartments",     arSlug: "الشقق",         nameEn: "Apartments",      nameAr: "الشقق",          category: "residential", typicalAreaM2: [20, 60],   typicalKwp: [1.5, 4],  monthlyKwh: [200, 600],    loadProfile: "evening-heavy", bestConfig: "on-grid" },
  { slug: "factories",      arSlug: "المصانع",       nameEn: "Factories",       nameAr: "المصانع",        category: "industrial",  typicalAreaM2: [1000, 20000], typicalKwp: [100, 2000], monthlyKwh: [50000, 1000000], loadProfile: "daytime-heavy", bestConfig: "on-grid" },
  { slug: "farms",          arSlug: "المزارع",       nameEn: "Farms",           nameAr: "المزارع",        category: "agricultural", typicalAreaM2: [2000, 100000], typicalKwp: [20, 1000], monthlyKwh: [10000, 500000], loadProfile: "daytime-heavy", bestConfig: "off-grid" },
  { slug: "warehouses",     arSlug: "المخازن",       nameEn: "Warehouses",      nameAr: "المخازن",        category: "commercial",  typicalAreaM2: [500, 10000], typicalKwp: [50, 500], monthlyKwh: [10000, 200000], loadProfile: "daytime-heavy", bestConfig: "on-grid" },
  { slug: "malls",          arSlug: "المولات",       nameEn: "Malls",           nameAr: "المولات",        category: "commercial",  typicalAreaM2: [2000, 50000], typicalKwp: [200, 2000], monthlyKwh: [80000, 800000], loadProfile: "balanced", bestConfig: "on-grid" },
  { slug: "schools",        arSlug: "المدارس",       nameEn: "Schools",         nameAr: "المدارس",        category: "commercial",  typicalAreaM2: [500, 3000], typicalKwp: [30, 200], monthlyKwh: [3000, 30000], loadProfile: "daytime-heavy", bestConfig: "on-grid" },
  { slug: "hospitals",      arSlug: "المستشفيات",   nameEn: "Hospitals",       nameAr: "المستشفيات",    category: "commercial",  typicalAreaM2: [1000, 8000], typicalKwp: [100, 1000], monthlyKwh: [30000, 300000], loadProfile: "24-7", bestConfig: "hybrid" },
  { slug: "hotels",         arSlug: "الفنادق",       nameEn: "Hotels",          nameAr: "الفنادق",        category: "commercial",  typicalAreaM2: [800, 6000], typicalKwp: [80, 800], monthlyKwh: [25000, 250000], loadProfile: "24-7", bestConfig: "hybrid" },
  { slug: "poultry-farms",  arSlug: "مزارع-الدواجن", nameEn: "Poultry Farms",   nameAr: "مزارع الدواجن", category: "agricultural", typicalAreaM2: [500, 5000], typicalKwp: [30, 300], monthlyKwh: [5000, 80000], loadProfile: "24-7", bestConfig: "hybrid" },
  { slug: "cold-storage",   arSlug: "التبريد",       nameEn: "Cold Storage",    nameAr: "مخازن التبريد", category: "industrial",  typicalAreaM2: [500, 5000], typicalKwp: [80, 800], monthlyKwh: [20000, 200000], loadProfile: "24-7", bestConfig: "hybrid" },
  { slug: "irrigation",     arSlug: "الري",          nameEn: "Irrigation Pumps", nameAr: "مضخات الري",   category: "agricultural", typicalAreaM2: [200, 3000], typicalKwp: [10, 200], monthlyKwh: [2000, 50000], loadProfile: "daytime-heavy", bestConfig: "off-grid" },
  { slug: "petrol-stations", arSlug: "محطات-الوقود", nameEn: "Petrol Stations", nameAr: "محطات الوقود",  category: "commercial",  typicalAreaM2: [200, 1500], typicalKwp: [20, 150], monthlyKwh: [3000, 25000], loadProfile: "24-7", bestConfig: "hybrid" },
];

export const getPropertyType = (slug: string) =>
  PROPERTY_TYPES.find((p) => p.slug === slug || p.arSlug === slug);
