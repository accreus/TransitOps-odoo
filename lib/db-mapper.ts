type CamelCase = string;
type SnakeCase = string;

export function camelToSnake(str: CamelCase): SnakeCase {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(str: SnakeCase): CamelCase {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ─── Value mappings: frontend lowercase ↔ DB Title Case ─────────────────────

const STATUS_MAP: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
  off_duty: "Off Duty",
  suspended: "Suspended",
  draft: "Draft",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ROLE_MAP: Record<string, string> = {
  fleet_manager: "Fleet Manager",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

const TYPE_MAP: Record<string, string> = {
  truck: "Truck",
  van: "Van",
  trailer: "Trailer",
  tanker: "Tanker",
  preventive: "Preventive",
  corrective: "Corrective",
  emergency: "Emergency",
  inspection: "Inspection",
};

const MAINTENANCE_STATE_MAP: Record<string, string> = {
  open: "open",
  closed: "closed",
};

const VALUE_MAPS: Record<string, Record<string, string>> = {
  status: STATUS_MAP,
  role: ROLE_MAP,
  type: TYPE_MAP,
  maintenance_state: MAINTENANCE_STATE_MAP,
};

// Reverse maps: DB Title Case → frontend lowercase
const REVERSE_STATUS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k])
);
const REVERSE_ROLE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([k, v]) => [v, k])
);
const REVERSE_TYPE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_MAP).map(([k, v]) => [v, k])
);

const REVERSE_VALUE_MAPS: Record<string, Record<string, string>> = {
  status: REVERSE_STATUS_MAP,
  role: REVERSE_ROLE_MAP,
  type: REVERSE_TYPE_MAP,
};

// Fields that need value mapping
const MAPPED_FIELDS = new Set(["status", "role", "type"]);

function mapValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  const map = VALUE_MAPS[key];
  if (!map) return value;
  return map[value] ?? value;
}

function reverseMapValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  const map = REVERSE_VALUE_MAPS[key];
  if (!map) return value;
  return map[value] ?? value;
}

// ─── Public helpers ──────────────────────────────────────────────────────────

export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = MAPPED_FIELDS.has(snakeKey) ? mapValue(snakeKey, value) : value;
  }
  return result;
}

export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    const val = MAPPED_FIELDS.has(key) ? reverseMapValue(key, value) : value;
    result[camelKey] = val;
  }
  return result;
}

export function mapRowsToCamelCase<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => toCamelCase(row) as T);
}

export function mapToSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return toSnakeCase(obj);
}
