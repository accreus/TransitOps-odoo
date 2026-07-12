import { z } from "zod";

// ─── Driver ───────────────────────────────────────────────────────────────────

export const createDriverSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  licenseNumber: z.string().trim().min(1, "License number is required").max(50),
  licenseExpiry: z.string().trim().min(1, "License expiry is required"),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  email: z.string().trim().email("Invalid email").max(100),
  status: z.enum(["available", "on_trip", "off_duty", "suspended"]),
  region: z.string().trim().min(1, "Region is required"),
  safetyScore: z.number().int().min(0).max(100).default(0),
  assignedVehicleId: z.string().nullable().default(null),
  joinDate: z.string().trim().min(1, "Join date is required"),
  totalTrips: z.number().int().min(0).default(0),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  regNumber: z.string().trim().min(1, "Registration number is required").max(20),
  type: z.enum(["truck", "van", "trailer", "tanker"]),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.number().int().min(1900).max(2100),
  status: z.enum(["available", "on_trip", "in_shop", "retired"]),
  region: z.string().trim().min(1),
  maxLoadKg: z.number().int().min(0),
  acquisitionCost: z.number().min(0),
  currentOdometer: z.number().int().min(0),
  lastServiceDate: z.string().trim(),
  fuelType: z.enum(["diesel", "petrol", "electric", "cng"]),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// ─── Trip ─────────────────────────────────────────────────────────────────────

export const createTripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  cargoDescription: z.string().trim().min(1).max(200),
  cargoWeightKg: z.number().int().min(1, "Cargo weight must be positive"),
  scheduledDeparture: z.string().min(1, "Scheduled departure is required"),
  scheduledArrival: z.string().min(1, "Scheduled arrival is required"),
  distanceKm: z.number().min(0.1, "Distance must be positive"),
});

export const updateTripSchema = z.object({
  source: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  cargoDescription: z.string().trim().min(1).max(200).optional(),
  cargoWeightKg: z.number().int().min(1).optional(),
  scheduledDeparture: z.string().min(1).optional(),
  scheduledArrival: z.string().min(1).optional(),
  distanceKm: z.number().min(0.1).optional(),
});

export const completeTripSchema = z.object({
  revenue: z.number().min(0, "Revenue cannot be negative"),
  fuelUsedLiters: z.number().min(0, "Fuel used cannot be negative"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;

// ─── Maintenance Log ──────────────────────────────────────────────────────────

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  description: z.string().trim().min(1, "Description is required").max(500),
  date: z.string().trim().optional(),
  cost: z.number().min(0, "Cost cannot be negative"),
  state: z.enum(["open", "closed"]).default("open"),
});

export const updateMaintenanceSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  cost: z.number().min(0).optional(),
  state: z.enum(["open", "closed"]).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

// ─── Fuel Log ─────────────────────────────────────────────────────────────────

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().nullable().optional(),
  date: z.string().trim().optional(),
  liters: z.number().min(0.01, "Liters must be positive"),
  costPerLiter: z.number().min(0, "Cost per liter cannot be negative"),
  totalCost: z.number().min(0, "Total cost cannot be negative"),
  odometerReading: z.number().int().min(0),
  station: z.string().trim().min(1, "Station is required").max(100),
});

export const updateFuelLogSchema = createFuelLogSchema.partial().extend({
  vehicleId: z.string().min(1).optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogInput = z.infer<typeof updateFuelLogSchema>;

// ─── Expense ──────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().nullable().optional(),
  date: z.string().trim().optional(),
  category: z.enum(["toll", "insurance", "repair", "fine", "parking", "other"]),
  description: z.string().trim().min(1, "Description is required").max(500),
  amount: z.number().min(0.01, "Amount must be positive"),
  receiptUrl: z.string().url().nullable().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(["toll", "insurance", "repair", "fine", "parking", "other"]).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  amount: z.number().min(0.01).optional(),
  receiptUrl: z.string().url().nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ─── Document ─────────────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  referenceType: z.enum(["vehicle", "driver"]),
  referenceId: z.string().min(1, "Reference ID is required"),
  documentType: z.string().trim().min(1, "Document type is required").max(100),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
