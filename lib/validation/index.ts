import { z } from "zod";

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

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

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

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const createTripSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  cargoDescription: z.string().trim().min(1).max(200),
  cargoWeightKg: z.number().int().min(1, "Cargo weight must be positive"),
  scheduledDeparture: z.string().min(1),
  scheduledArrival: z.string().min(1),
  distanceKm: z.number().min(0.1, "Distance must be positive"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const completeTripSchema = z.object({
  revenue: z.number().min(0, "Revenue cannot be negative"),
  fuelUsedLiters: z.number().min(0),
});

export type CompleteTripInput = z.infer<typeof completeTripSchema>;
