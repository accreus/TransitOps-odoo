"use server";

import { createClient } from "@/lib/supabase/server";
import * as tripService from "@/lib/services/trip-service";
import { createTripSchema, completeTripSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { Trip, TripStatus } from "@/types";

async function requireAuth(): Promise<ServiceResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };
  return { success: true, data: user.id };
}

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
    return { success: false, error: parsed.error.issues[0].message };
  }

  return tripService.createTrip(parsed.data as Omit<Trip, "id" | "tripNumber" | "createdAt" | "status">);
}

export async function dispatchTrip(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
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
    return { success: false, error: parsed.error.issues[0].message };
  }

  return tripService.completeTrip(id, parsed.data.revenue, parsed.data.fuelUsedLiters);
}

export async function cancelTrip(id: string): Promise<ServiceResult<Trip>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return tripService.cancelTrip(id);
}

export async function deleteTrip(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return tripService.deleteTrip(id);
}
