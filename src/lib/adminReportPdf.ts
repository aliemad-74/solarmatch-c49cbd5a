import { calculateSolarFeasibility, BuildingType, PackageType } from "./solarData";
import { calculateBillForCategory } from "./egyptTariffs";
import { generateSolarReport, ReportLanguage } from "./pdfReport";

const VALID_BUILDINGS: BuildingType[] = [
  "residential",
  "apartment",
  "commercial",
  "industrial",
  "agricultural",
];

const VALID_PACKAGES: PackageType[] = ["economy", "standard", "premium"];

const pvFromPackage: Record<PackageType, "A_high_power_mono" | "B_standard_mono" | "C_poly_economy"> = {
  premium: "A_high_power_mono",
  standard: "B_standard_mono",
  economy: "C_poly_economy",
};

/**
 * Reconstruct a SolarCalculation from a stored assessment + report record
 * and trigger a PDF download. Used by the admin dashboard.
 */
export async function downloadAdminReportPdf(
  report: any,
  language: ReportLanguage = "en"
): Promise<void> {
  const a = report?.assessment || {};

  const buildingType: BuildingType = VALID_BUILDINGS.includes(a.building_type)
    ? a.building_type
    : "residential";
  const pkg: PackageType = VALID_PACKAGES.includes(a.pv_package)
    ? a.pv_package
    : "standard";

  const monthlyConsumption = Number(a.monthly_consumption) || 500;
  const rooftopArea = Number(a.rooftop_area) || Number(report.system_size_kw) * 7 || 50;

  // Derive electricity price from tariff brackets
  const billing = calculateBillForCategory(monthlyConsumption, buildingType);
  const electricityPrice = billing.effectiveRate || 1.95;

  const results = calculateSolarFeasibility(
    rooftopArea,
    null, // use default Egypt climate
    electricityPrice,
    pvFromPackage[pkg],
    buildingType,
    "medium",
    monthlyConsumption,
    false,
    1,
    monthlyConsumption
  );

  // Switch selected package to the user's stored choice when available
  const selected = results.packageOptions.find((p) => p.packageKey === pkg);
  if (selected) {
    const ratio = results.kWInstalled > 0 ? selected.kWInstalled / results.kWInstalled : 1;
    results.selectedPackage = pkg;
    results.kWInstalled = selected.kWInstalled;
    results.energyYear = selected.energyYear;
    results.energyMonth = selected.energyYear / 12;
    results.monthlyProduction = results.monthlyProduction.map((m) => m * ratio);
    results.savingsYear = selected.savingsYear;
    results.savingsMonth = selected.savingsYear / 12;
    results.totalCost = selected.totalCost;
    results.costPerKW = selected.package.costPerKW;
    results.paybackYears = selected.paybackYears;
    results.coverageRatio = selected.coverageRatio;
    results.panelCount = selected.panelCount;
    results.panelWattage = selected.package.typicalPanelWattage;
  }

