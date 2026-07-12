"use server";

import { requireAuth } from "@/lib/auth-helpers";
import * as reportService from "@/lib/services/report-service";

export async function getFleetUtilization() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getFleetUtilization();
}

export async function getFuelEfficiency() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getFuelEfficiency();
}

export async function getOperationalCostPerVehicle() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getOperationalCostPerVehicle();
}

export async function getVehicleROI() {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  return reportService.getVehicleROI();
}
