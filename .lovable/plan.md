
# User Access & Monetization System Implementation Plan

## Overview
Implement a complete user registration, email verification, free trial, and paywall system to monetize the solar report generation feature.

---

## Database Schema Changes

### New Table: `app_users`
Stores user registration data separately from Supabase Auth users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | Unique, user email |
| name | text | Full name |
| phone | text | Mobile number |
| status | text | "unverified" or "verified" |
| reports_generated | integer | Counter (starts at 0) |
| report_limit | integer | Max reports allowed (default: 1) |
| verification_token | text | Unique token for email verification |
| token_expires_at | timestamptz | Token expiration (24 hours) |
| ip_address | text | Last used IP (abuse prevention) |
| created_at | timestamptz | Registration timestamp |

### New Table: `report_history`
Tracks each report generation for auditing.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to app_users |
| location_name | text | Location of calculation |
| system_size_kw | numeric | kW installed |
| created_at | timestamptz | When report was generated |
| ip_address | text | IP at generation time |

### RLS Policies
- `app_users`: Public INSERT (registration), authenticated READ own record
- `report_history`: Authenticated INSERT/READ own records only

---

## User Flow Architecture

```text
+------------------+     +--------------------+     +------------------+
| 1. User clicks   | --> | 2. Registration    | --> | 3. Email sent    |
|   "Calculate"    |     |    Modal shown     |     |    with link     |
+------------------+     +--------------------+     +------------------+
                                                            |
                                                            v
+------------------+     +--------------------+     +------------------+
| 6. Report        | <-- | 5. Status =        | <-- | 4. User clicks   |
|    Generated     |     |    "verified"      |     |    verify link   |
+------------------+     +--------------------+     +------------------+
        |
        v
+------------------+     +--------------------+     +------------------+
| 7. reports_      | --> | 8. Next attempt    | --> | 9. Paywall       |
|    generated = 1 |     |    blocked         |     |    shown         |
+------------------+     +--------------------+     +------------------+
```

---

## Components to Create

### 1. Registration Modal (`src/components/RegistrationModal.tsx`)
- Form fields: Name, Email, Mobile Phone
- Validation using Zod schema
- Saves to `app_users` table with status = "unverified"
- Triggers email verification edge function
- Shows "Check your email" message after submission

### 2. Email Verification Page (`src/pages/Verify.tsx`)
- Route: `/verify?token=xxx`
- Validates token against database
- Updates user status to "verified"
- Shows success message with redirect to calculator

### 3. Paywall Modal (`src/components/PaywallModal.tsx`)
- Shows when `reports_generated >= report_limit`
- Displays pricing options:
  - 1 report: 49 EGP
  - 3 reports: 99 EGP
  - Company subscription (contact sales)
- Integrates with Stripe for payments

### 4. User Context Provider (`src/contexts/UserContext.tsx`)
- Manages user state across the app
- Checks localStorage for user session
- Provides `user`, `isVerified`, `canGenerateReport` states

---

## Edge Functions to Create

### 1. `send-verification-email` 
- Generates unique verification token
- Saves token to database with 24hr expiry
- Sends email via Resend API
- Email contains: verification link to `/verify?token=xxx`

### 2. `verify-email`
- Validates token exists and not expired
- Updates user status to "verified"
- Returns success/failure response

### 3. `check-report-access`
- Checks if user can generate a report
- Validates: email verified, reports_generated < report_limit
- Returns access status and remaining reports

### 4. `record-report-generation`
- Called after successful PDF generation
- Increments `reports_generated` counter
- Logs to `report_history` table

### 5. `process-payment` (Stripe webhook handler)
- Handles successful payment events
- Increases user's `report_limit` accordingly
- 1 report purchase: +1 to limit
- 3 report bundle: +3 to limit

---

## File Changes Summary

### New Files
| Path | Purpose |
|------|---------|
| `src/components/RegistrationModal.tsx` | User registration form |
| `src/components/PaywallModal.tsx` | Payment gate after free trial |
| `src/components/VerificationPending.tsx` | "Check your email" UI |
| `src/pages/Verify.tsx` | Email verification handler |
| `src/contexts/UserContext.tsx` | User state management |
| `src/hooks/useUser.tsx` | User hook for components |
| `src/lib/userValidation.ts` | Zod schemas for user forms |
| `supabase/functions/send-verification-email/index.ts` | Email sender |
| `supabase/functions/verify-email/index.ts` | Token validator |
| `supabase/functions/check-report-access/index.ts` | Access control |
| `supabase/functions/record-report-generation/index.ts` | Usage tracker |

### Modified Files
| Path | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add registration gate before calculation |
| `src/components/ResultsDashboard.tsx` | Gate PDF download, track usage |
| `src/App.tsx` | Add `/verify` route, UserProvider wrapper |
| `src/i18n/locales/en.json` | Add registration/paywall translations |
| `src/i18n/locales/ar.json` | Add Arabic translations |
| `supabase/config.toml` | Register new edge functions |

---

## Security Measures

1. **Email Validation**: Server-side validation via database trigger
2. **Token Security**: Cryptographically random tokens, 24hr expiry
3. **Rate Limiting**: Edge functions have request limits
4. **IP Tracking**: Secondary abuse prevention (not primary identifier)
5. **RLS Policies**: Users can only access their own data
6. **CORS Headers**: Proper origin control on edge functions

---

## Privacy & Trust

The app will display:
> "Your contact information is used only to generate your solar report and provide relevant service updates."

- No auto-subscription
- No data selling
- Clear payment requirements upfront

---

## Pricing Structure

| Option | Price | Reports |
|--------|-------|---------|
| Free Trial | 0 EGP | 1 |
| Single Report | 49 EGP | +1 |
| Bundle | 99 EGP | +3 |
| Company Monthly | Contact | Unlimited + PDF + Branding |

---

## Required Secrets

Before implementation, the following secret needs to be configured:

- **RESEND_API_KEY**: For sending verification emails
  - Get from: https://resend.com/api-keys
  - User must have a verified domain at: https://resend.com/domains

---

## Implementation Order

1. Database migrations (tables + RLS)
2. User context and hooks
3. Registration modal component
4. Send verification email edge function
5. Verification page
6. Calculate button gate (require registration)
7. Report access check
8. Report generation tracking
9. Paywall modal
10. Stripe integration for payments
11. Translations (EN/AR)
12. Testing and refinement
