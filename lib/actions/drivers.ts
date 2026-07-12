"use server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as driverService from "@/lib/services/driver-service";
import { createDriverSchema, updateDriverSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { Driver, DriverStatus } from "@/types";

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

  const roleCheck = requireRole(auth.data.role, "drivers", "create");
  if (!roleCheck.success) return roleCheck;

  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return driverService.createDriver(parsed.data as Omit<Driver, "id">);
}

export async function updateDriver(
  id: string,
  updates: Partial<Driver>,
): Promise<ServiceResult<Driver>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  // Safety score updates are restricted to fleet_manager and safety_officer
  if (updates.safetyScore !== undefined) {
    const scoreCheck = requireRole(auth.data.role, "safety_score", "update");
    if (!scoreCheck.success) return scoreCheck;
  } else {
    const roleCheck = requireRole(auth.data.role, "drivers", "update");
    if (!roleCheck.success) return roleCheck;
  }

  const parsed = updateDriverSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return driverService.updateDriver(id, parsed.data);
}

export async function deleteDriver(
  id: string,
): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "drivers", "delete");
  if (!roleCheck.success) return roleCheck;

  return driverService.deleteDriver(id);
}
