"use server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import * as maintenanceService from "@/lib/services/maintenance-service";
import { createMaintenanceSchema, updateMaintenanceSchema } from "@/lib/validation";
import type { ServiceResult } from "@/lib/types";
import type { MaintenanceLog } from "@/types";

export async function getMaintenanceLogs(vehicleId?: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return maintenanceService.getMaintenanceLogs(vehicleId);
}

export async function getMaintenanceLogById(id: string) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return maintenanceService.getMaintenanceLogById(id);
}

export async function createMaintenanceLog(input: Omit<MaintenanceLog, "id">): Promise<ServiceResult<MaintenanceLog>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "maintenance", "create");
  if (!roleCheck.success) return roleCheck;

  const parsed = createMaintenanceSchema.safeParse({
    vehicleId: input.vehicleId,
    description: input.description,
    date: input.date,
    cost: input.cost,
    state: input.status === "completed" ? "closed" : "open",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return maintenanceService.createMaintenanceLog(input);
}

export async function updateMaintenanceLog(id: string, updates: Partial<MaintenanceLog>): Promise<ServiceResult<MaintenanceLog>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "maintenance", "update");
  if (!roleCheck.success) return roleCheck;

  const parsed = updateMaintenanceSchema.safeParse({
    ...updates,
    state: updates.status === "completed" ? "closed" : updates.status === "scheduled" || updates.status === "in_progress" ? "open" : undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, field: parsed.error.issues[0].path.join(".") };
  }

  return maintenanceService.updateMaintenanceLog(id, updates);
}

export async function closeMaintenanceLog(id: string): Promise<ServiceResult<MaintenanceLog>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "maintenance", "update");
  if (!roleCheck.success) return roleCheck;

  return maintenanceService.closeMaintenanceLog(id);
}

export async function deleteMaintenanceLog(id: string): Promise<ServiceResult<void>> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const roleCheck = requireRole(auth.data.role, "maintenance", "delete");
  if (!roleCheck.success) return roleCheck;

  return maintenanceService.deleteMaintenanceLog(id);
}

export async function getMaintenanceStats() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return maintenanceService.getMaintenanceStats();
}
