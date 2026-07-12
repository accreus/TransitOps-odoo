/**
 * Canonical role constants and mappings.
 * DB stores title-case ("Fleet Manager"), frontend uses snake_case ("fleet_manager").
 * This module centralizes the mapping so every layer stays consistent.
 */

export const DB_ROLES = {
  fleet_manager: "Fleet Manager",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
} as const;

export type FrontendRole = keyof typeof DB_ROLES;
export type DbRole = (typeof DB_ROLES)[FrontendRole];

/** Map a DB title-case role to frontend snake_case role. */
export function toFrontendRole(dbRole: string): FrontendRole {
  const entry = (Object.entries(DB_ROLES) as [FrontendRole, DbRole][]).find(
    ([, v]) => v === dbRole,
  );
  if (!entry) throw new Error(`Unknown DB role: ${dbRole}`);
  return entry[0];
}

/** Map a frontend snake_case role to DB title-case role. */
export function toDbRole(frontendRole: FrontendRole): DbRole {
  return DB_ROLES[frontendRole];
}

/** Allowed roles for a given resource action. */
export const RESOURCE_ROLES = {
  vehicles: {
    create: ["fleet_manager" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const, "safety_officer" as const],
    delete: ["fleet_manager" as const],
  },
  drivers: {
    create: ["fleet_manager" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const, "safety_officer" as const],
    delete: ["fleet_manager" as const],
  },
  trips: {
    create: ["fleet_manager" as const, "dispatcher" as unknown as FrontendRole],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const, "driver" as const, "financial_analyst" as const],
    delete: ["fleet_manager" as const],
  },
  maintenance: {
    create: ["fleet_manager" as const, "driver" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const],
    delete: ["fleet_manager" as const],
  },
  fuel: {
    create: ["fleet_manager" as const, "driver" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const],
    delete: ["fleet_manager" as const],
  },
  expenses: {
    create: ["fleet_manager" as const, "driver" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const, "financial_analyst" as const],
    delete: ["fleet_manager" as const],
  },
  documents: {
    create: ["fleet_manager" as const, "driver" as const, "safety_officer" as const],
    read: ["fleet_manager" as const, "driver" as const, "safety_officer" as const, "financial_analyst" as const],
    update: ["fleet_manager" as const],
    delete: ["fleet_manager" as const],
  },
  safety_score: {
    update: ["fleet_manager" as const, "safety_officer" as const],
  },
} as const;

export type Resource = keyof typeof RESOURCE_ROLES;
export type Action = "create" | "read" | "update" | "delete";
