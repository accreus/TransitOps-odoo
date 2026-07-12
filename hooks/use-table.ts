"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export function useTableSort<T>(data: T[], defaultKey?: keyof T, defaultDir: SortDirection = "asc") {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey || null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir);

  const sorted = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === "desc" ? -comparison : comparison;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => {
          if (prevDir === "asc") return "desc";
          if (prevDir === "desc") return null;
          return "asc";
        });
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  return { sorted, sortKey, sortDir, toggleSort };
}

export function useTableFilter<T>(data: T[], filters: Record<string, (item: T, value: string) => boolean>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const setFilter = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value || value === "all" || value.startsWith("All")) return true;
        return filters[key]?.(item, value) ?? true;
      });
    });
  }, [data, filterValues, filters]);

  const activeFilterCount = Object.values(filterValues).filter(
    (v) => v && v !== "all" && !v.startsWith("All")
  ).length;

  return { filtered, filterValues, setFilter, clearFilters, activeFilterCount };
}
