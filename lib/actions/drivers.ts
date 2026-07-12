"use server";

import { createClient } from "@/lib/supabase/server";
import * as driverService from "@/lib/services/driver-service";
import { createDriverSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { Driver, DriverStatus } from "@/types";

async function requireAuth(): Promise<ServiceResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };
  return { success: true, data: user.id };
}

export async function getDrivers(filters?: {
  status?: DriverStatus;
  region?: string;
}): Promise<ServiceResult<Driver[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return driverService.getDrivers(filters);
}

export async function getDriverById(
  id: string,
): Promise<ServiceResult<Driver>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return driverService.getDriverById(id);
}

export async function getAvailableDrivers(): Promise<ServiceResult<Driver[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return driverService.getAvailableDrivers();
}

export async function createDriver(
  input: Omit<Driver, "id">,
): Promise<ServiceResult<Driver>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  return driverService.createDriver(parsed.data as Omit<Driver, "id">);
}

export async function updateDriver(
  id: string,
  updates: Partial<Driver>,
): Promise<ServiceResult<Driver>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return driverService.updateDriver(id, updates);
}

export async function deleteDriver(
  id: string,
): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return driverService.deleteDriver(id);
}
