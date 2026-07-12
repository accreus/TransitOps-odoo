// Database types for TransitOps
// Generated from schema.sql

export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst'

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired'

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'

export type MaintenanceState = 'open' | 'closed'

export type DocumentReferenceType = 'vehicle' | 'driver'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  registration_number: string
  model: string
  type: string
  max_load_capacity: number
  odometer: number
  acquisition_cost: number
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  name: string
  license_number: string
  license_category: string
  license_expiry: string
  contact: string
  safety_score: number
  status: DriverStatus
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  source: string
  destination: string
  vehicle_id: string
  driver_id: string
  cargo_weight: number
  planned_distance: number
  status: TripStatus
  revenue?: number
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  vehicle_id: string
  description: string
  date: string
  cost: number
  state: MaintenanceState
  created_at: string
  updated_at: string
}

export interface FuelLog {
  id: string
  vehicle_id: string
  liters: number
  cost: number
  date: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  vehicle_id: string
  type: string
  cost: number
  date: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  reference_type: DocumentReferenceType
  reference_id: string
  file_path: string
  document_type: string
  created_at: string
  updated_at: string
}

// Expanded types with relationships
export interface TripWithRelations extends Trip {
  vehicle?: Vehicle
  driver?: Driver
}

export interface MaintenanceLogWithVehicle extends MaintenanceLog {
  vehicle?: Vehicle
}

export interface FuelLogWithVehicle extends FuelLog {
  vehicle?: Vehicle
}

export interface ExpenseWithVehicle extends Expense {
  vehicle?: Vehicle
}