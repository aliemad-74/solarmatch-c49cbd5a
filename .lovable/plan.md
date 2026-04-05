

## Plan: Convert Subscription Buttons to Non-Functional Styled Buttons

Replace all WhatsApp links in the subscription flow with plain styled buttons that show a "Coming Soon" toast when clicked. No external links, no actions -- just visual buttons ready for a future payment gateway.

### Changes

**1. `src/pages/Pricing.tsx`**
- Remove `buildWhatsAppUrl` import and `WHATSAPP_NUMBER` constant
- Remove `getSubscribeUrl` function
- Replace the `<a href={...}>` subscribe buttons with plain `<Button>` elements
- On click, show a toast: "Coming soon" / "قريباً"
- Remove the WhatsApp note at the bottom
- Keep the `MessageCircle` icon or replace with a suitable icon like `ShoppingCart` or `CreditCard`

**2. `src/components/PaywallModal.tsx`**
- Remove `buildWhatsAppUrl` import and `WHATSAPP_NUMBER` constant
- Convert the three `<a>` plan cards from links to `<div>` or `<button>` elements
- On click, show a toast: "Coming soon" / "قريباً"
- Remove the WhatsApp note text at the bottom
- Keep the "View All Plans" button that navigates to `/pricing`

**3. `src/components/LimitReachedModal.tsx`**
- Remove WhatsApp link and `buildWhatsAppUrl` import
- Replace contact buttons with a single "Upgrade" button that navigates to `/pricing`
- Or show a "Coming soon" toast

**4. Translations (`en.json` / `ar.json`)**
- Add key `common.comingSoon` → "Coming soon" / "قريباً"
- Update or remove WhatsApp-related text keys

**5. Cleanup**
- If `buildWhatsAppUrl` is no longer used anywhere, remove `src/lib/externalLinks.ts`
- Otherwise keep it for any remaining usage (e.g. ShareDialog)

### What stays the same
- All plan cards, pricing, features, and styling remain identical
- Subscription gating logic, report limits, and feature locks are untouched
- No admin or database changes needed

