-- Migration: Add missing indexes and fix query patterns
-- Run this AFTER the initial schema.sql + rls-policies.sql

-- Additional indexes for dashboard filter patterns
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_drivers_region ON drivers(region);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON maintenance_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_reference_type ON documents(reference_type);

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON trips(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_date ON expenses(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_state ON maintenance_logs(vehicle_id, state);

-- Trip code unique index (for trip_number / trip_code lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number) WHERE trip_number IS NOT NULL;
