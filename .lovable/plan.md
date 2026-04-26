# Google APIs to Improve SolarMatch

## Already in use
- **Maps JavaScript API** — map display
- **Places Autocomplete API** — address search
- **Geocoding API** — coordinates ↔ address
- **Solar API** — building insights, roof segments, sunshine hours
- **Gemini API** (via Lovable AI Gateway) — chatbot & advisor

---

## High-impact additions (recommended)

### 1. Air Quality API
Show local AQI and pollution levels on the results dashboard. Strong selling point for solar — dirty air = more reason to go clean. Also affects panel soiling rate.
- **Use:** Add an "Environmental Impact" badge showing local AQI next to the CO₂ savings card.

### 2. Pollen API
Egypt has high dust/pollen seasons that soil panels and reduce output. Use to refine the soiling-loss factor in calculations and warn users about cleaning frequency.
- **Use:** Adjust annual energy output by 2–5% based on local pollen/dust index.

### 3. Elevation API
Roof tilt, shading and irradiance models improve when elevation is known. Already partially used in `solar-engine` — could be expanded.
- **Use:** More accurate panel orientation recommendations.

### 4. Time Zone API
Critical for accurate peak-sun-hour calculations and time-of-use tariff modeling (when Egypt rolls out ToU pricing).
- **Use:** Backend calculation precision; no UI change.

### 5. Street View Static API
Show a street-level photo of the user's property next to the map for confidence ("this is your building").
- **Use:** Add a small image card in the results header.

### 6. Distance Matrix API
For the **installer/lead matching** flow (Business plan): match users with the nearest verified installers and show distance/drive time.
- **Use:** Powers a future "Get 3 quotes from nearby installers" feature.

---

## Medium-impact additions

### 7. Weather API (Google Weather, newly GA)
Replace/augment NASA POWER fallback with live and forecast weather. Better short-term production forecasts ("Expected output this week: X kWh").
- **Use:** Add a 7-day production forecast widget.

### 8. Routes API
If you add an installer marketplace, plan service-call routes for installers.

### 9. Address Validation API
Verify that the entered address is real and deliverable before saving leads — improves lead quality for the Business plan.

### 10. reCAPTCHA Enterprise
Protect the lead capture and registration endpoints from bots (you already have IP-based limits; this strengthens it).

---

## Lower priority / niche

- **Map Tiles API (Photorealistic 3D Tiles)** — show a 3D view of the building. Visually impressive but heavy and costly.
- **Aerial View API** — auto-generated cinematic flyover of the property. Wow-factor for shareable reports.
- **Imagen API (via Gemini)** — generate marketing visuals, social share cards.

---

## Recommended next step
Pick **2–3** to implement first. My suggestion:
1. **Air Quality API** — visible value-add on results dashboard
2. **Pollen API** — improves calculation accuracy (dust/soiling)
3. **Street View Static API** — quick visual win on the report

Tell me which ones you want and I'll implement them (each needs the Google Maps API key — already configured in your edge functions — with the relevant API enabled in Google Cloud Console).
