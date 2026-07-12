"use server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as tripService from "@/lib/services/trip-service";
import { createTripSchema, updateTripSchema, completeTripSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { Trip, TripStatus } from "@/types";

export async function getTrips(filters?: {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
}): Promise<ServiceResult<Trip[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return tripService.getTrips(filters);
}

export async function getTripById(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return tripService.getTripById(id);
}

export async function createTrip(
  input: Omit<Trip, "id" | "tripNumber" | "createdAt" | "status">,
): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return tripService.createTrip(parsed.data as Omit<Trip, "id" | "tripNumber" | "createdAt" | "status">);
}

export async function dispatchTrip(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "trips", "update");
  if (!roleCheck.success) return roleCheck;

  return tripService.dispatchTrip(id);
}

export async function departTrip(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  return tripService.departTrip(id);
}

export async function completeTrip(
  id: string,
  revenue: number,
  fuelUsedLiters: number,
): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const parsed = completeTripSchema.safeParse({ revenue, fuelUsedLiters });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return tripService.completeTrip(id, parsed.data.revenue, parsed.data.fuelUsedLiters);
}

export async function cancelTrip(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "trips", "update");
  if (!roleCheck.success) return roleCheck;

  return tripService.cancelTrip(id);
}

export async function deleteTrip(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "trips", "delete");
  if (!roleCheck.success) return roleCheck;

  return tripService.deleteTrip(id);
}
