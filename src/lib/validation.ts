import { z } from "zod";

// Lead/Contact form validation schema
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(200, { message: "Name must be less than 200 characters" }),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{7,20}$/, { message: "Invalid phone number format" }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  preferredContact: z.enum(["call", "whatsapp", "email"]),
  bestTime: z.enum(["morning", "afternoon", "evening"]),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Solar advisor request validation
export const solarAdvisorSchema = z.object({
  solarData: z.object({
    locationName: z.string().max(500).optional(),
    rooftopArea: z.number().positive().max(1000000),
    kWInstalled: z.number().positive().max(10000),
    energyYear: z.number().nonnegative(),
    monthlyConsumption: z.number().nonnegative(),
    coverageRatio: z.number().nonnegative().max(1000),
    pvType: z.string().max(100),
    buildingType: z.string().max(100),
    totalCost: z.number().nonnegative(),
    savingsYear: z.number(),
    paybackYears: z.number(),
    co2Reduction: z.number().nonnegative(),
  }),
  language: z.enum(["en", "ar"]),
});

// Building footprints request validation
export const buildingFootprintsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().positive().max(500).optional().default(50),
});
