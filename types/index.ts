export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";

export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type VehicleType = "truck" | "van" | "trailer" | "tanker";

export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";

export type TripStatus = "draft" | "dispatched" | "in_transit" | "completed" | "cancelled";

export type MaintenanceType = "preventive" | "corrective" | "emergency" | "inspection";

export interface Vehicle {
  id: string;
  regNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  region: string;
  maxLoadKg: number;
  acquisitionCost: number;
  currentOdometer: number;
  lastServiceDate: string;
  fuelType: "diesel" | "petrol" | "electric" | "cng";
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  email: string;
  status: DriverStatus;
  region: string;
  safetyScore: number;
  assignedVehicleId: string | null;
  joinDate: string;
  totalTrips: number;
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  status: TripStatus;
  cargoDescription: string;
  cargoWeightKg: number;
  scheduledDeparture: string;
  actualDeparture: string | null;
  scheduledArrival: string;
  actualArrival: string | null;
  distanceKm: number;
  fuelUsedLiters: number;
  revenue: number;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  date: string;
  completedDate: string | null;
  mechanic: string;
  partsReplaced: string[];
  status: "scheduled" | "in_progress" | "completed";
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  tripId: string | null;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerReading: number;
  station: string;
}

export interface ExpenseEntry {
  id: string;
  vehicleId: string;
  tripId: string | null;
  date: string;
  category: "toll" | "insurance" | "repair" | "fine" | "parking" | "other";
  description: string;
  amount: number;
  receiptUrl: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface KpiData {
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  icon: string;
  color: "amber" | "red" | "green" | "blue" | "slate";
}
