import jsPDF from "jspdf";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES, systemPackages } from "./solarData";
import { calculateROIProjection } from "./roiProjections";

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

  // Draw a progress bar
  const drawProgressBar = (x: number, y: number, width: number, height: number, progress: number, color: [number, number, number]) => {
    // Background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(x, y, width, height, 2, 2, "F");
    // Progress
    doc.setFillColor(...color);
    doc.roundedRect(x, y, width * Math.min(progress, 1), height, 2, 2, "F");
  };

  // ============================================
  // HEADER WITH GRADIENT
  // ============================================
  doc.setFillColor(20, 184, 166); // Teal color
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Add subtle gradient overlay
  doc.setFillColor(17, 94, 89);
  doc.rect(0, 35, pageWidth, 10, "F");

  addText("SOLAR FEASIBILITY REPORT", margin, 18, { fontSize: 22, fontStyle: "bold", color: [255, 255, 255] });
  addText("Powered by SolarMatch - Egypt's Solar Calculator", margin, 28, { fontSize: 10, color: [200, 255, 250] });
  
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  addText(dateStr, pageWidth - margin - 50, 28, { fontSize: 10, color: [200, 255, 250] });

  yPos = 58;

  // ============================================
  // EXECUTIVE SUMMARY BOX
  // ============================================
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 35, 3, 3, "F");
  doc.setDrawColor(20, 184, 166);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 35, 3, 3, "S");

  addText("EXECUTIVE SUMMARY", margin + 5, yPos + 3, { fontSize: 11, fontStyle: "bold", color: [20, 184, 166] });
  
  const summaryItems = [
    { label: "System Size", value: `${results.kWInstalled} kW` },
    { label: "Annual Production", value: `${formatNumber(results.energyYear, 0)} kWh` },
    { label: "Yearly Savings", value: formatCurrency(results.savingsYear) },
    { label: "Payback", value: `${formatNumber(results.paybackYears, 1)} years` },
  ];
  
  const itemWidth = (pageWidth - margin * 2 - 10) / 4;
  summaryItems.forEach((item, i) => {
    const xPos = margin + 5 + i * itemWidth;
    addText(item.label, xPos, yPos + 15, { fontSize: 8, color: [100, 100, 100] });
    addText(item.value, xPos, yPos + 23, { fontSize: 12, fontStyle: "bold", color: [30, 30, 30] });
  });

  yPos += 42;

  // ============================================
  // LOCATION INFO WITH ICON
  // ============================================
  if (locationName || results.climateData?.location) {
    doc.setFillColor(255, 251, 235); // Light yellow
    doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 22, 2, 2, "F");
    
    addText("📍 LOCATION", margin + 5, yPos + 5, { fontSize: 10, fontStyle: "bold", color: [180, 83, 9] });
    
    let locText = "";
    if (locationName) locText += locationName;
    if (results.climateData?.location) {
      if (locText) locText += " | ";
      locText += `${results.climateData.location.lat.toFixed(4)}°N, ${results.climateData.location.lng.toFixed(4)}°E`;
    }
    if (results.climateData?.annualAvgIrradiance) {
      locText += ` | Irradiance: ${formatNumber(results.climateData.annualAvgIrradiance, 2)} kWh/m²/day`;
    }
    
    addText(locText, margin + 5, yPos + 14, { fontSize: 9, color: [100, 80, 50] });
    yPos += 28;
  }

  // ============================================
  // KEY METRICS WITH ICONS
  // ============================================
  addText("KEY PERFORMANCE METRICS", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 12;

  const metrics = [
    { label: "Installed Capacity", value: `${results.kWInstalled} kW`, sub: `Max: ${formatNumber(results.kWMax, 1)} kW`, color: [20, 184, 166] as [number, number, number] },
    { label: "Yearly Production", value: `${formatNumber(results.energyYear, 0)} kWh`, sub: `${formatNumber(results.energyMonth, 0)} kWh/month`, color: [245, 158, 11] as [number, number, number] },
    { label: "Annual Savings", value: formatCurrency(results.savingsYear), sub: `${formatCurrency(results.savingsMonth)}/month`, color: [34, 197, 94] as [number, number, number] },
    { label: "Total System Cost", value: formatCurrency(results.totalCost), sub: `${formatCurrency(results.totalCost / results.kWInstalled)}/kW`, color: [99, 102, 241] as [number, number, number] },
  ];

  const metricWidth = (pageWidth - margin * 2 - 15) / 2;
  metrics.forEach((metric, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const xPos = margin + col * (metricWidth + 5);
    const yBase = yPos + row * 22;
    
    doc.setFillColor(...metric.color);
    doc.roundedRect(xPos, yBase - 3, 4, 18, 1, 1, "F");
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos + 6, yBase - 3, metricWidth - 6, 18, 2, 2, "F");
    
    addText(metric.label, xPos + 10, yBase + 3, { fontSize: 8, color: [100, 100, 100] });
    addText(metric.value, xPos + 10, yBase + 10, { fontSize: 11, fontStyle: "bold" });
    addText(metric.sub, xPos + metricWidth - 35, yBase + 10, { fontSize: 8, color: [100, 100, 100] });
  });

  yPos += 50;

  // ============================================
  // COVERAGE RATIO WITH VISUAL BAR
  // ============================================
  addText("ENERGY COVERAGE ANALYSIS", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 10;

  const coveragePercent = Math.min(results.coverageRatio * 100, 200);
  addText(`Coverage Ratio: ${formatNumber(results.coverageRatio * 100, 0)}%`, margin, yPos + 3, { fontSize: 10, fontStyle: "bold" });
  
  drawProgressBar(margin + 55, yPos - 1, 80, 8, results.coverageRatio, [20, 184, 166]);
  
  const coverageText = results.coverageRatio >= 1 
    ? "✓ Full coverage with surplus" 
    : results.coverageRatio >= 0.7 
      ? "Good coverage" 
      : "Partial coverage";
  addText(coverageText, margin + 140, yPos + 3, { fontSize: 9, color: results.coverageRatio >= 1 ? [34, 197, 94] : [100, 100, 100] });
  
  yPos += 15;

  // ============================================
  // CO2 & ENVIRONMENTAL IMPACT
  // ============================================
  doc.setFillColor(236, 253, 245); // Light green
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 18, 2, 2, "F");
  
  addText("🌱 ENVIRONMENTAL IMPACT", margin + 5, yPos + 5, { fontSize: 10, fontStyle: "bold", color: [22, 163, 74] });
  addText(`CO₂ Reduction: ${formatNumber(results.co2Saved, 1)} tons/year`, margin + 5, yPos + 12, { fontSize: 9, color: [22, 101, 52] });
  
  const treesEquivalent = Math.round(results.co2Saved * 45); // ~45 trees per ton CO2
  addText(`Equivalent to planting ${treesEquivalent} trees annually`, margin + 85, yPos + 12, { fontSize: 9, color: [22, 101, 52] });
  
  yPos += 25;
  addLine(yPos);
  yPos += 10;

  // ============================================
  // BUILDING MODE ANALYSIS (if applicable)
  // ============================================
  if (results.buildingMode) {
    checkNewPage(55);
    addText("BUILDING MODE ANALYSIS", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    const buildingData = [
      ["Total Units", `${results.numberOfUnits}`],
      ["Avg. Consumption/Unit", `${results.avgUnitConsumption} kWh/month`],
      ["Total Consumption", `${formatNumber(results.effectiveMonthlyConsumption, 0)} kWh/month`],
      ["Units Covered", `${formatNumber(results.unitsCovered, 1)} units`],
    ];

    const bWidth = (pageWidth - margin * 2 - 15) / 2;
    buildingData.forEach((row, i) => {
      const col = i % 2;
      const rowNum = Math.floor(i / 2);
      const xPos = margin + col * (bWidth + 5);
      const yBase = yPos + rowNum * 12;
      
      addText(row[0] + ":", xPos, yBase, { fontSize: 9, color: [80, 80, 80] });
      addText(row[1], xPos + 50, yBase, { fontSize: 9, fontStyle: "bold" });
    });

    yPos += 30;
    addLine(yPos);
    yPos += 10;
  }

  // ============================================
  // SYSTEM CONFIGURATION
  // ============================================
  checkNewPage(50);
  addText("SYSTEM CONFIGURATION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 10;

  const selectedPkg = systemPackages[results.selectedPackage];
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 32, 2, 2, "F");
  
  const configItems = [
    { label: "Panel Package", value: selectedPkg?.name || results.selectedPackage },
    { label: "Efficiency", value: selectedPkg?.efficiency || "N/A" },
    { label: "Area/kW", value: `${selectedPkg?.areaPerKW || "N/A"} m²` },
    { label: "Cost/kW", value: `${selectedPkg?.costPerKW?.toLocaleString() || "N/A"} EGP` },
  ];
  
  const confWidth = (pageWidth - margin * 2) / 4;
  configItems.forEach((item, i) => {
    const xPos = margin + 5 + i * confWidth;
    addText(item.label, xPos, yPos + 5, { fontSize: 8, color: [100, 100, 100] });
    addText(item.value, xPos, yPos + 14, { fontSize: 10, fontStyle: "bold" });
  });
  
  addText("Building Type:", margin + 5, yPos + 25, { fontSize: 8, color: [100, 100, 100] });
  addText(results.buildingType.charAt(0).toUpperCase() + results.buildingType.slice(1), margin + 45, yPos + 25, { fontSize: 10, fontStyle: "bold" });
  
  addText("Usable Roof:", margin + 100, yPos + 25, { fontSize: 8, color: [100, 100, 100] });
  addText(`${formatNumber(results.usableArea, 0)} m²`, margin + 135, yPos + 25, { fontSize: 10, fontStyle: "bold" });

  yPos += 40;

  // ============================================
  // PACKAGE OPTIONS COMPARISON
  // ============================================
  if (results.packageOptions && results.packageOptions.length > 0) {
    checkNewPage(80);
    addText("PACKAGE OPTIONS COMPARISON", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 12;

    // Table header
    const colWidths = [40, 30, 45, 40, 30];
    const headers = ["Package", "kW", "Total Cost", "Savings/Year", "Payback"];
    
    doc.setFillColor(20, 184, 166);
    doc.roundedRect(margin, yPos - 4, pageWidth - margin * 2, 12, 2, 2, "F");
    
    let xPos = margin + 3;
    headers.forEach((header, i) => {
      addText(header, xPos, yPos + 4, { fontSize: 8, fontStyle: "bold", color: [255, 255, 255] });
      xPos += colWidths[i];
    });
    yPos += 14;

    // Table rows
    results.packageOptions.forEach((option, idx) => {
      const isSelected = option.packageKey === results.selectedPackage;
      
      if (isSelected) {
        doc.setFillColor(236, 253, 245);
        doc.rect(margin, yPos - 4, pageWidth - margin * 2, 12, "F");
      } else if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 4, pageWidth - margin * 2, 12, "F");
      }

      xPos = margin + 3;
      addText(option.package.name + (isSelected ? " ✓" : ""), xPos, yPos + 4, { fontSize: 8, fontStyle: isSelected ? "bold" : "normal", color: isSelected ? [22, 163, 74] : [0, 0, 0] });
      xPos += colWidths[0];
      addText(`${option.kWInstalled}`, xPos, yPos + 4, { fontSize: 8 });
      xPos += colWidths[1];
      addText(formatCurrency(option.totalCost), xPos, yPos + 4, { fontSize: 8 });
      xPos += colWidths[2];
      addText(formatCurrency(option.savingsYear), xPos, yPos + 4, { fontSize: 8 });
      xPos += colWidths[3];
      addText(`${formatNumber(option.paybackYears, 1)} yrs`, xPos, yPos + 4, { fontSize: 8 });
      
      yPos += 12;
    });

    yPos += 8;
  }

  // ============================================
  // MONTHLY PRODUCTION CHART (Visual Bar Chart)
  // ============================================
  checkNewPage(80);
  addText("MONTHLY ENERGY PRODUCTION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
  yPos += 12;

  const maxProduction = Math.max(...results.monthlyProduction);
  const barWidth = (pageWidth - margin * 2 - 24) / 12;
  const barMaxHeight = 35;

  results.monthlyProduction.forEach((production, i) => {
    const barHeight = (production / maxProduction) * barMaxHeight;
    const xPos = margin + i * (barWidth + 2);
    
    // Bar
    doc.setFillColor(20, 184, 166);
    doc.roundedRect(xPos, yPos + (barMaxHeight - barHeight), barWidth, barHeight, 1, 1, "F");
    
    // Month label
    addText(MONTH_NAMES[i].substring(0, 3), xPos + 1, yPos + barMaxHeight + 8, { fontSize: 6, color: [100, 100, 100] });
    
    // Value on top
    addText(formatNumber(production, 0), xPos, yPos + (barMaxHeight - barHeight) - 3, { fontSize: 5, color: [100, 100, 100] });
  });

  yPos += barMaxHeight + 18;

  // ============================================
  // 25-YEAR ROI PROJECTION
  // ============================================
  // Calculate electricity price from savings/energy
  const impliedElectricityPrice = results.savingsYear / results.energyYear;
  
  const roiAnalysis = calculateROIProjection(
    results.totalCost,
    results.energyYear,
    impliedElectricityPrice,
    {}
  );
  
  if (roiAnalysis.yearlyProjections.length > 0) {
    checkNewPage(70);
    addText("25-YEAR FINANCIAL PROJECTION", margin, yPos, { fontSize: 12, fontStyle: "bold", color: [20, 184, 166] });
    yPos += 10;

    // Key milestones
    const breakEvenYear = roiAnalysis.yearlyProjections.findIndex(p => p.netPosition >= 0) + 1;
    const finalValue = roiAnalysis.yearlyProjections[roiAnalysis.yearlyProjections.length - 1];
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 20, 2, 2, "F");
    
    addText("Break-Even Year:", margin + 5, yPos + 5, { fontSize: 9, color: [100, 100, 100] });
    addText(`Year ${breakEvenYear}`, margin + 45, yPos + 5, { fontSize: 10, fontStyle: "bold", color: [34, 197, 94] });
    
    addText("Total 25-Year Savings:", margin + 75, yPos + 5, { fontSize: 9, color: [100, 100, 100] });
    addText(formatCurrency(finalValue.cumulativeSavings), margin + 125, yPos + 5, { fontSize: 10, fontStyle: "bold", color: [20, 184, 166] });
    
    addText("Net Value:", margin + 5, yPos + 14, { fontSize: 9, color: [100, 100, 100] });
    addText(formatCurrency(finalValue.netPosition), margin + 35, yPos + 14, { fontSize: 10, fontStyle: "bold" });
    
    const totalROI = ((finalValue.netPosition / results.totalCost) * 100);
    addText("Total ROI:", margin + 75, yPos + 14, { fontSize: 9, color: [100, 100, 100] });
    addText(`${formatNumber(totalROI, 0)}%`, margin + 100, yPos + 14, { fontSize: 10, fontStyle: "bold", color: totalROI > 0 ? [34, 197, 94] : [239, 68, 68] });

    yPos += 28;
  }

  // ============================================
  // CONNECTION RECOMMENDATION
  // ============================================
  if (results.connectionRecommendation) {
    checkNewPage(35);
    
    const recColor = results.connectionRecommendation.icon === "offgrid" 
      ? [34, 197, 94] as [number, number, number]
      : results.connectionRecommendation.icon === "hybrid"
        ? [245, 158, 11] as [number, number, number]
        : [20, 184, 166] as [number, number, number];
    
    doc.setFillColor(recColor[0], recColor[1], recColor[2]);
    doc.roundedRect(margin, yPos - 3, 4, 25, 1, 1, "F");
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + 6, yPos - 3, pageWidth - margin * 2 - 6, 25, 2, 2, "F");
    
    addText("RECOMMENDED SYSTEM TYPE", margin + 10, yPos + 4, { fontSize: 9, fontStyle: "bold", color: recColor });
    addText(results.connectionRecommendation.systemType, margin + 75, yPos + 4, { fontSize: 10, fontStyle: "bold" });
    
    const splitReason = doc.splitTextToSize(results.connectionRecommendation.reason, pageWidth - margin * 2 - 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(splitReason, margin + 10, yPos + 14);
    
    yPos += 32;
  }

  // ============================================
  // WARNINGS (if any)
  // ============================================
  if (results.warnings.length > 0) {
    checkNewPage(40);
    
    doc.setFillColor(254, 243, 199); // Light yellow warning
    doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 8 + results.warnings.length * 8, 2, 2, "F");
    
    addText("⚠️ IMPORTANT NOTES", margin + 5, yPos + 4, { fontSize: 9, fontStyle: "bold", color: [180, 83, 9] });
    yPos += 10;

    results.warnings.forEach((warning) => {
      const splitWarning = doc.splitTextToSize("• " + warning, pageWidth - margin * 2 - 15);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 80, 40);
      doc.text(splitWarning, margin + 8, yPos);
      yPos += splitWarning.length * 5 + 2;
    });
    
    yPos += 5;
  }

  // ============================================
  // FOOTER
  // ============================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer gradient
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
    
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Generated by SolarMatch - Egypt's Solar Calculator", margin, pageHeight - 8);
    doc.text(`solarmatch.lovable.app`, margin, pageHeight - 4);
    
    doc.setFontSize(8);
    doc.setTextColor(20, 184, 166);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  // Save the PDF
  const filename = `SolarMatch_Report_${locationName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
