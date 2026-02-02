
# Ideal System Sizing Formula Implementation

## Overview
This plan adds an engineering-grade ideal system sizing calculation to the solar feasibility calculator. It computes the theoretically optimal system size based on user consumption and location-specific Peak Sun Hours (PSH), then compares it with the roof-constrained installed system to show oversizing/undersizing percentages with actionable recommendations.

## The Formula

### Ideal System Size Calculation
```text
P_ideal = E_day / (PSH × PR)

Where:
- E_day = Daily energy consumption (kWh/day)
- PSH = Peak Sun Hours (h/day) - derived from annual irradiance
- PR = Performance Ratio (0.75-0.85, using 0.80 as default)
```

### Converting User Input to Daily Consumption
```text
E_day = Monthly_Consumption / 30.44  (average days per month)
```

### Oversizing Percentage
```text
Oversize% = ((P_system - P_ideal) / P_ideal) × 100

- Positive = System is larger than needed
- Negative = System is smaller than needed (undersized)
```

## Implementation Details

### Step 1: Extend Data Model (`src/lib/solarData.ts`)

Add new interface fields and calculation logic:

```text
+-----------------------------------------------+
| New IdealSizingAnalysis Interface             |
+-----------------------------------------------+
| dailyConsumption: number (kWh/day)            |
| peakSunHours: number (h/day from NASA data)   |
| performanceRatio: number (0.80 default)       |
| idealSystemSize: number (kW)                  |
| installedSystemSize: number (kW)              |
| oversizePercent: number (positive/negative)   |
| recommendation: IdealSizingRecommendation     |
| optimalPackage: PackageType | null            |
+-----------------------------------------------+
```

New recommendation types:
- **oversized**: System is 20%+ larger than needed
- **slightly_oversized**: System is 5-20% larger
- **optimal**: System is within ±5% of ideal
- **undersized**: System is more than 5% smaller than needed
- **severely_undersized**: System is 30%+ smaller than needed

### Step 2: Add Calculation Logic

The calculation will derive PSH from NASA climate data:

```text
PSH Calculation:
PSH = Annual Average Irradiance (kWh/m²/day)
     (NASA POWER provides this directly as ALLSKY_SFC_SW_DWN)

For Egypt default: PSH ≈ 5.78 h/day (from defaultClimateData.annualAvgIrradiance)
```

Implementation in `calculateSolarFeasibility()`:
1. Convert monthly consumption to daily: `E_day = effectiveMonthlyConsumption / 30.44`
2. Get PSH from climate data: `PSH = climateData.annualAvgIrradiance`
3. Calculate ideal size: `P_ideal = E_day / (PSH × PR)`
4. Calculate oversize: `Oversize% = ((kWInstalled - P_ideal) / P_ideal) × 100`
5. Generate recommendation based on oversize percentage

### Step 3: New UI Component (`src/components/IdealSizingCard.tsx`)

A new card component in the Results Dashboard displaying:

```text
+--------------------------------------------------+
| Ideal System Sizing Analysis                      |
+--------------------------------------------------+
| Your Consumption: 500 kWh/month → 16.4 kWh/day   |
| Peak Sun Hours: 5.78 h/day (based on location)   |
| Performance Ratio: 80%                            |
|                                                   |
| ┌─────────────────────────────────────────────┐  |
| │  Ideal Size      │  Your System  │ Difference│  |
| │     3.5 kW       │     6 kW      │   +71%    │  |
| └─────────────────────────────────────────────┘  |
|                                                   |
| Recommendation:                                   |
| Your system is OVERSIZED by 71%.                 |
| This is common for residential to:               |
| • Offset future consumption growth               |
| • Maximize roof utilization                      |
| • Generate surplus for net metering              |
|                                                   |
| Optimal Package: Economy (3 kW would suffice)    |
+--------------------------------------------------+
```

### Step 4: Update ResultsDashboard.tsx

Insert the new IdealSizingCard component after the "Coverage Ratio & Calculation Breakdown" section, before the ROI Timeline.

### Step 5: Add Translations

New translation keys for both English and Arabic:

```text
"idealSizing": {
  "title": "Ideal System Sizing Analysis",
  "formula": "P_ideal = E_day ÷ (PSH × PR)",
  "dailyConsumption": "Daily Consumption",
  "peakSunHours": "Peak Sun Hours",
  "performanceRatio": "Performance Ratio",
  "idealSize": "Ideal System Size",
  "yourSystem": "Your System",
  "difference": "Difference",
  "oversized": "Oversized",
  "undersized": "Undersized",
  "optimal": "Optimal",
  "recommendation": "Recommendation",
  "oversizedMessage": "Your system is larger than needed...",
  "undersizedMessage": "Your system is smaller than needed...",
  "optimalMessage": "Your system is well-sized...",
  "optimalPackage": "Suggested Package",
  "whyOversizing": "Why oversizing matters:",
  "oversizingBenefits": "• Future consumption growth\n• Net metering income\n• Maximum roof utilization",
  "undersizingImpact": "Impact of undersizing:",
  "undersizingEffects": "• Partial coverage only\n• Continued grid dependency"
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/solarData.ts` | Add IdealSizingAnalysis interface and calculation logic |
| `src/components/IdealSizingCard.tsx` | **NEW** - Display component for ideal sizing analysis |
| `src/components/ResultsDashboard.tsx` | Import and render IdealSizingCard |
| `src/i18n/locales/en.json` | Add English translations |
| `src/i18n/locales/ar.json` | Add Arabic translations |

## User Experience Flow

1. User enters consumption (monthly or via Building Mode)
2. System converts to daily consumption automatically
3. Upon calculation, the Ideal Sizing Analysis card appears
4. User sees clear comparison: Ideal vs Installed with percentage
5. Color-coded recommendation explains the situation
6. If oversized: Explains benefits (future growth, net metering)
7. If undersized: Suggests increasing system or switching package
8. Suggests the optimal package tier based on ideal size

## Recommendation Logic

```text
If Oversize% > 50%:
  "Significantly oversized - ideal for future growth or net metering"
  Suggest: Consider Economy package for cost savings

If Oversize% between 20-50%:
  "Moderately oversized - good buffer for consumption growth"
  Status: Acceptable

If Oversize% between 5-20%:
  "Slightly oversized - well balanced"
  Status: Optimal

If Oversize% between -5% and 5%:
  "Perfectly sized for current consumption"
  Status: Optimal

If Oversize% between -5% and -20%:
  "Slightly undersized - covers ~85-95% of needs"
  Suggest: Consider upgrading or adding panels

If Oversize% < -20%:
  "Significantly undersized - consider larger system"
  Suggest: Switch to higher-density panels or increase area
```

## Technical Considerations

- PSH is derived from NASA's annual average irradiance (already available in ClimateData)
- Performance Ratio of 0.80 is industry standard for well-maintained systems
- The calculation respects the existing 150% residential coverage cap
- Works with both single-consumption and Building Mode multi-unit inputs
- All calculations are deterministic and do not require external API calls
