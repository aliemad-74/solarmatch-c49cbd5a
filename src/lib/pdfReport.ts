import jsPDF from "jspdf";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES, systemPackages } from "./solarData";

export async function generateSolarReport(results: SolarCalculation, locationName?: string): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: "normal" | "bold"; color?: [number, number, number] }) => {
    const { fontSize = 10, fontStyle = "normal", color = [0, 0, 0] } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y);
    return fontSize * 0.4 + 2;
  };

  const addLine = (y: number, color: [number, number, number] = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const checkNewPage = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ============================================
  // HEADER
  // ============================================
  doc.setFillColor(20, 184, 166); // Teal color
  doc.rect(0, 0, pageWidth, 40, "F");

  addText("SOLAR FEASIBILITY REPORT", margin, 18, { fontSize: 20, fontStyle: "bold", color: [255, 255, 255] });
  addText("Powered by SunRoof Snap", margin, 28, { fontSize: 10, color: [200, 255, 250] });
  
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  addText(dateStr, pageWidth - margin - 50, 28, { fontSize: 10, color: [200, 255, 250] });

  yPos = 55;

  // ============================================
  // LOCATION INFO
  // ============================================
  if (locationName || results.climateData?.location) {
    addText("LOCATION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 8;
    
    if (locationName) {
      addText(`Location: ${locationName}`, margin, yPos, { fontSize: 10 });
      yPos += 6;
    }
    
    if (results.climateData?.location) {
      addText(`Coordinates: ${results.climateData.location.lat.toFixed(4)}°N, ${results.climateData.location.lng.toFixed(4)}°E`, margin, yPos, { fontSize: 10 });
      yPos += 6;
    }
    
    if (results.climateData?.annualAvgIrradiance) {
      addText(`Annual Avg. Irradiance: ${formatNumber(results.climateData.annualAvgIrradiance, 2)} kWh/m²/day`, margin, yPos, { fontSize: 10 });
      yPos += 6;
    }
    
    yPos += 4;
    addLine(yPos);
    yPos += 10;
  }

  // ============================================
  // KEY METRICS SUMMARY
  // ============================================
  addText("KEY METRICS SUMMARY", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 10;

  // Create a table-like summary
  const metricsData = [
    ["Installed Capacity", `${results.kWInstalled} kW`, "Max Possible", `${formatNumber(results.kWMax, 1)} kW`],
    ["Yearly Production", `${formatNumber(results.energyYear, 0)} kWh`, "Monthly Avg.", `${formatNumber(results.energyMonth, 0)} kWh`],
    ["Yearly Savings", formatCurrency(results.savingsYear), "Monthly Savings", formatCurrency(results.savingsMonth)],
    ["Payback Period", `${formatNumber(results.paybackYears, 1)} years`, "System Cost", formatCurrency(results.totalCost)],
    ["Coverage Ratio", `${formatNumber(results.coverageRatio * 100, 0)}%`, "CO₂ Reduction", `${formatNumber(results.co2Saved, 1)} tons/year`],
  ];

  metricsData.forEach((row) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos - 4, (pageWidth - margin * 2) / 2 - 2, 10, "F");
    doc.rect(margin + (pageWidth - margin * 2) / 2 + 2, yPos - 4, (pageWidth - margin * 2) / 2 - 2, 10, "F");
    
    addText(row[0], margin + 2, yPos + 2, { fontSize: 9, color: [100, 100, 100] });
    addText(row[1], margin + 55, yPos + 2, { fontSize: 9, fontStyle: "bold" });
    addText(row[2], margin + (pageWidth - margin * 2) / 2 + 4, yPos + 2, { fontSize: 9, color: [100, 100, 100] });
    addText(row[3], margin + (pageWidth - margin * 2) / 2 + 55, yPos + 2, { fontSize: 9, fontStyle: "bold" });
    yPos += 12;
  });

  yPos += 6;
  addLine(yPos);
  yPos += 12;

  // ============================================
  // BUILDING MODE (if applicable)
  // ============================================
  if (results.buildingMode) {
    checkNewPage(60);
    addText("BUILDING MODE ANALYSIS", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    const buildingData = [
      ["Total Units", `${results.numberOfUnits}`],
      ["Avg. Consumption per Unit", `${results.avgUnitConsumption} kWh/month`],
      ["Total Building Consumption", `${formatNumber(results.effectiveMonthlyConsumption, 0)} kWh/month`],
      ["Annual Consumption", `${formatNumber(results.annualConsumption, 0)} kWh`],
      ["Units Covered by Solar", `${formatNumber(results.unitsCovered, 1)} units`],
    ];

    buildingData.forEach((row) => {
      addText(row[0] + ":", margin, yPos, { fontSize: 10, color: [80, 80, 80] });
      addText(row[1], margin + 70, yPos, { fontSize: 10, fontStyle: "bold" });
      yPos += 7;
    });

    yPos += 6;
    addLine(yPos);
    yPos += 12;
  }

  // ============================================
  // SYSTEM CONFIGURATION
  // ============================================
  checkNewPage(50);
  addText("SYSTEM CONFIGURATION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 10;

  const selectedPkg = systemPackages[results.selectedPackage];
  const configData = [
    ["Building Type", results.buildingType.charAt(0).toUpperCase() + results.buildingType.slice(1)],
    ["Selected Package", selectedPkg?.name || results.selectedPackage],
    ["PV Efficiency", selectedPkg?.efficiency || "N/A"],
    ["Area per kW", `${selectedPkg?.areaPerKW || "N/A"} m²/kW`],
    ["Cost per kW", `${selectedPkg?.costPerKW?.toLocaleString() || "N/A"} EGP`],
    ["Usable Roof Area", `${formatNumber(results.usableArea, 0)} m²`],
  ];

  configData.forEach((row) => {
    addText(row[0] + ":", margin, yPos, { fontSize: 10, color: [80, 80, 80] });
    addText(row[1], margin + 60, yPos, { fontSize: 10, fontStyle: "bold" });
    yPos += 7;
  });

  yPos += 6;
  addLine(yPos);
  yPos += 12;

  // ============================================
  // CONNECTION RECOMMENDATION
  // ============================================
  if (results.connectionRecommendation) {
    checkNewPage(40);
    addText("CONNECTION RECOMMENDATION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    addText("Recommended System Type:", margin, yPos, { fontSize: 10, color: [80, 80, 80] });
    addText(results.connectionRecommendation.systemType, margin + 60, yPos, { fontSize: 10, fontStyle: "bold" });
    yPos += 8;
    
    addText("Reason:", margin, yPos, { fontSize: 10, color: [80, 80, 80] });
    yPos += 6;
    
    // Wrap long text
    const splitReason = doc.splitTextToSize(results.connectionRecommendation.reason, pageWidth - margin * 2 - 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(splitReason, margin + 5, yPos);
    yPos += splitReason.length * 5 + 4;

    yPos += 6;
    addLine(yPos);
    yPos += 12;
  }

  // ============================================
  // PACKAGE OPTIONS COMPARISON
  // ============================================
  if (results.packageOptions && results.packageOptions.length > 0) {
    checkNewPage(80);
    addText("PACKAGE OPTIONS COMPARISON", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    // Table header
    const colWidths = [45, 35, 40, 35, 30];
    const headers = ["Package", "kW Installed", "Total Cost", "Savings/Year", "Payback"];
    
    doc.setFillColor(20, 184, 166);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 10, "F");
    
    let xPos = margin + 2;
    headers.forEach((header, i) => {
      addText(header, xPos, yPos + 2, { fontSize: 8, fontStyle: "bold", color: [255, 255, 255] });
      xPos += colWidths[i];
    });
    yPos += 12;

    // Table rows
    results.packageOptions.forEach((option) => {
      const isSelected = option.packageKey === results.selectedPackage;
      
      if (isSelected) {
        doc.setFillColor(236, 253, 245);
        doc.rect(margin, yPos - 4, pageWidth - margin * 2, 10, "F");
      }

      xPos = margin + 2;
      addText(option.package.name + (isSelected ? " ✓" : ""), xPos, yPos + 2, { fontSize: 8, fontStyle: isSelected ? "bold" : "normal" });
      xPos += colWidths[0];
      addText(`${option.kWInstalled} kW`, xPos, yPos + 2, { fontSize: 8 });
      xPos += colWidths[1];
      addText(formatCurrency(option.totalCost), xPos, yPos + 2, { fontSize: 8 });
      xPos += colWidths[2];
      addText(formatCurrency(option.savingsYear), xPos, yPos + 2, { fontSize: 8 });
      xPos += colWidths[3];
      addText(`${formatNumber(option.paybackYears, 1)} yrs`, xPos, yPos + 2, { fontSize: 8 });
      
      yPos += 12;
    });

    yPos += 6;
    addLine(yPos);
    yPos += 12;
  }

  // ============================================
  // MONTHLY PRODUCTION TABLE
  // ============================================
  checkNewPage(100);
  addText("MONTHLY ENERGY PRODUCTION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 10;

  // Create two columns for months
  const halfMonths = 6;
  for (let i = 0; i < halfMonths; i++) {
    const leftMonth = MONTH_NAMES[i];
    const leftValue = formatNumber(results.monthlyProduction[i], 0);
    const rightMonth = MONTH_NAMES[i + halfMonths];
    const rightValue = formatNumber(results.monthlyProduction[i + halfMonths], 0);

    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, yPos - 4, (pageWidth - margin * 2) / 2 - 2, 8, "F");
    doc.rect(margin + (pageWidth - margin * 2) / 2 + 2, yPos - 4, (pageWidth - margin * 2) / 2 - 2, 8, "F");

    addText(leftMonth, margin + 5, yPos + 1, { fontSize: 9 });
    addText(`${leftValue} kWh`, margin + 35, yPos + 1, { fontSize: 9, fontStyle: "bold" });
    addText(rightMonth, margin + (pageWidth - margin * 2) / 2 + 7, yPos + 1, { fontSize: 9 });
    addText(`${rightValue} kWh`, margin + (pageWidth - margin * 2) / 2 + 37, yPos + 1, { fontSize: 9, fontStyle: "bold" });
    
    yPos += 10;
  }

  yPos += 6;
  addLine(yPos);
  yPos += 12;

  // ============================================
  // CLIMATE DATA
  // ============================================
  if (results.climateData) {
    checkNewPage(80);
    addText("CLIMATE DATA", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    addText("Monthly Irradiance (kWh/m²/day):", margin, yPos, { fontSize: 10, fontStyle: "bold", color: [80, 80, 80] });
    yPos += 7;

    // Show irradiance for all months in two rows
    for (let row = 0; row < 2; row++) {
      let xPos = margin;
      for (let i = 0; i < 6; i++) {
        const monthIdx = row * 6 + i;
        addText(`${MONTH_NAMES[monthIdx]}: ${formatNumber(results.climateData.monthlyIrradiance[monthIdx], 1)}`, xPos, yPos, { fontSize: 8 });
        xPos += 28;
      }
      yPos += 7;
    }

    yPos += 4;
    addText("Monthly Temperature (°C):", margin, yPos, { fontSize: 10, fontStyle: "bold", color: [80, 80, 80] });
    yPos += 7;

    for (let row = 0; row < 2; row++) {
      let xPos = margin;
      for (let i = 0; i < 6; i++) {
        const monthIdx = row * 6 + i;
        addText(`${MONTH_NAMES[monthIdx]}: ${results.climateData.monthlyTemperature[monthIdx]}°`, xPos, yPos, { fontSize: 8 });
        xPos += 28;
      }
      yPos += 7;
    }
  }

  // ============================================
  // WARNINGS (if any)
  // ============================================
  if (results.warnings.length > 0) {
    checkNewPage(40);
    yPos += 6;
    addLine(yPos);
    yPos += 12;

    addText("WARNINGS & NOTES", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [220, 53, 69] });
    yPos += 10;

    results.warnings.forEach((warning) => {
      const splitWarning = doc.splitTextToSize(warning, pageWidth - margin * 2 - 10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 50, 50);
      doc.text(splitWarning, margin + 5, yPos);
      yPos += splitWarning.length * 5 + 3;
    });
  }

  // ============================================
  // FOOTER
  // ============================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by SunRoof Snap Solar Calculator", margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 8);
  }

  // Save the PDF
  const filename = `Solar_Feasibility_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
