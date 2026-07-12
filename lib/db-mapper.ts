type CamelCase = string;
type SnakeCase = string;

export function camelToSnake(str: CamelCase): SnakeCase {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(str: SnakeCase): CamelCase {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result;
}

export function mapRowsToCamelCase<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => toCamelCase(row) as T);
}

export function mapToSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return toSnakeCase(obj);
}
