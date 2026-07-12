"use server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as vehicleService from "@/lib/services/vehicle-service";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { Vehicle, VehicleStatus } from "@/types";

export async function getVehicles(filters?: {
  status?: VehicleStatus;
  region?: string;
  available?: boolean;
}): Promise<ServiceResult<Vehicle[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return vehicleService.getVehicles(filters);
}

export async function getVehicleById(id: string): Promise<ServiceResult<Vehicle>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return vehicleService.getVehicleById(id);
}

export async function getAvailableVehicles(): Promise<ServiceResult<Vehicle[]>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return vehicleService.getAvailableVehicles();
}

export async function createVehicle(input: Omit<Vehicle, "id">): Promise<ServiceResult<Vehicle>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "vehicles", "create");
  if (!roleCheck.success) return roleCheck;

  const parsed = createVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return vehicleService.createVehicle(parsed.data as Omit<Vehicle, "id">);
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<ServiceResult<Vehicle>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "vehicles", "update");
  if (!roleCheck.success) return roleCheck;

  const parsed = updateVehicleSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return vehicleService.updateVehicle(id, parsed.data);
}

export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<ServiceResult<Vehicle>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "vehicles", "update");
  if (!roleCheck.success) return roleCheck;

  return vehicleService.setVehicleStatus(id, status);
}

export async function deleteVehicle(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "vehicles", "delete");
  if (!roleCheck.success) return roleCheck;

  return vehicleService.deleteVehicle(id);
}
