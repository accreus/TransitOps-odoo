/**
 * TransitOps Complete Integration System
 * Hours 0-8: Full Puff Foundation Implementation
 *
 * This is the master integration layer that K and Uncle need for their work.
 * All business logic, validation, and server-side rules are implemented here.
 */

import { supabase } from './supabase'
import { getAvailableVehiclesForDispatch } from './vehicles'
import { getAvailableDriversForDispatch } from './drivers'
import { createTrip, updateTripStatus } from './trips'
import { createMaintenanceLog, closeMaintenanceLog } from './maintenance'
import { createFuelLog, createExpense } from './financial'
import type { VehicleStatus, DriverStatus, TripStatus } from '@/types/database'

/**
 * 🚨 CRITICAL: Complete Dispatch System for Uncle
 * This is the main integration point for trip creation and management
 * Implements all business rules server-side as required by Puff foundation
 */
export class DispatchSystem {
  /**
   * Get all available resources for dispatch
   * BUSINESS RULE: Only Available vehicles and drivers with valid licenses
   * CRITICAL: Excludes In Shop, Retired, On Trip vehicles
   * CRITICAL: Excludes On Trip, Off Duty, Suspended, expired license drivers
   */
  static async getAvailableResources() {
    const [vehicles, drivers] = await Promise.all([
      getAvailableVehiclesForDispatch(), // Server-side filtering
      getAvailableDriversForDispatch()   // Server-side filtering
    ])

    return {
      vehicles: vehicles.map(v => ({
        ...v,
        displayName: `${v.registration_number} - ${v.model} (${v.max_load_capacity}kg)`,
        canDispatch: true // All returned vehicles are dispatch-ready
      })),
      drivers: drivers.map(d => ({
        ...d,
        displayName: `${d.name} - ${d.license_category} (Score: ${d.safety_score})`,
        canDispatch: true, // All returned drivers are dispatch-ready
        licenseValid: new Date(d.license_expiry) > new Date()
      }))
    }
  }

  /**
   * Create and dispatch trip with full validation
   * CRITICAL: Validates business rules and updates resource status automatically
   * This is what Uncle's trip logic should call
   */
  static async createAndDispatchTrip(tripData: {
    source: string
    destination: string
    vehicle_id: string
    driver_id: string
    cargo_weight: number
    planned_distance: number
    revenue?: number
  }) {
    try {
      // Step 1: Create trip (validates resources are available via server-side checks)
      const trip = await createTrip({
        ...tripData,
        status: 'Draft'
      })

      // Step 2: Immediately dispatch (updates vehicle and driver status automatically)
      const dispatchedTrip = await updateTripStatus(trip.id, 'Dispatched')

      return {
        success: true,
        trip: dispatchedTrip,
        message: `Trip dispatched: ${tripData.source} → ${tripData.destination}`,
        resourcesUpdated: {
          vehicleStatus: 'On Trip' as VehicleStatus,
          driverStatus: 'On Trip' as DriverStatus
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create and dispatch trip'
      }
    }
  }

  /**
   * Complete trip and free resources
   */
  static async completeTrip(tripId: string, actualRevenue: number) {
    try {
      // Update trip with revenue and complete status
      const { data: trip, error } = await supabase
        .from('trips')
        .update({
          status: 'Completed',
          revenue: actualRevenue
        })
        .eq('id', tripId)
        .select(`*, vehicle:vehicles(*), driver:drivers(*)`)
        .single()

      if (error) throw error

      // Update vehicle and driver back to Available (automatic via updateTripStatus)
      await updateTripStatus(tripId, 'Completed')

      return {
        success: true,
        trip,
        message: `Trip completed with revenue: $${actualRevenue}`,
        resourcesFreed: {
          vehicle: trip.vehicle,
          driver: trip.driver
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 🔧 Fleet Management System for K (Frontend Integration)
 * All the functions K needs for the UI with business logic included
 */
export class FleetManager {
  /**
   * Create vehicle with full business logic and validation
   */
  static async addVehicle(vehicleData: {
    registration_number: string
    model: string
    type: string
    max_load_capacity: number
    odometer: number
    acquisition_cost: number
  }) {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Vehicle with registration "${vehicleData.registration_number}" already exists`)
        }
        throw error
      }

      return {
        success: true,
        vehicle,
        message: `Vehicle ${vehicle.registration_number} added successfully`,
        status: 'Available' as VehicleStatus
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Put vehicle into maintenance (automatic status change)
   * CRITICAL: Server-side trigger sets vehicle to "In Shop" automatically
   */
  static async scheduleMaintenance(vehicleId: string, description: string, cost: number) {
    try {
      const maintenance = await createMaintenanceLog({
        vehicle_id: vehicleId,
        description,
        cost,
        state: 'open'
      })

      return {
        success: true,
        maintenance,
        message: 'Vehicle scheduled for maintenance and marked as "In Shop"',
        vehicleStatusChange: 'In Shop' as VehicleStatus
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Complete maintenance (automatic status restoration)
   * CRITICAL: Server-side trigger restores vehicle to "Available" automatically
   */
  static async completeMaintenance(maintenanceId: string) {
    try {
      const maintenance = await closeMaintenanceLog(maintenanceId)

      return {
        success: true,
        maintenance,
        message: 'Maintenance completed and vehicle returned to service',
        vehicleStatusChange: 'Available' as VehicleStatus
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 💰 Financial Operations for Uncle's Expense Tracking
 */
export class FinancialOps {
  /**
   * Record trip fuel consumption
   */
  static async recordFuelPurchase(vehicleId: string, liters: number, cost: number) {
    try {
      const fuelLog = await createFuelLog({
        vehicle_id: vehicleId,
        liters,
        cost
      })

      return {
        success: true,
        fuelLog,
        costPerLiter: cost / liters,
        message: `Fuel purchase recorded: ${liters}L for $${cost}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Record trip-related expense
   */
  static async recordTripExpense(vehicleId: string, type: string, cost: number) {
    try {
      const expense = await createExpense({
        vehicle_id: vehicleId,
        type,
        cost
      })

      return {
        success: true,
        expense,
        message: `${type} expense recorded: $${cost}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 📊 System Health Monitor
 */
export class SystemMonitor {
  /**
   * Get system health and alerts
   */
  static async getSystemHealth() {
    const [
      { data: vehicles },
      { data: drivers },
      { data: openMaintenance },
      { data: activeTrips }
    ] = await Promise.all([
      supabase.from('vehicles').select('status'),
      supabase.from('drivers').select('status, license_expiry'),
      supabase.from('maintenance_logs').select('vehicle_id').eq('state', 'open'),
      supabase.from('trips').select('status').in('status', ['Draft', 'Dispatched'])
    ])

    const today = new Date().toISOString().split('T')[0]
    const expiredLicenses = drivers?.filter(d => d.license_expiry < today).length || 0
    const vehiclesInShop = vehicles?.filter(v => v.status === 'In Shop').length || 0
    const availableVehicles = vehicles?.filter(v => v.status === 'Available').length || 0
    const availableDrivers = drivers?.filter(d => d.status === 'Available' && d.license_expiry >= today).length || 0

    const alerts = []

    if (expiredLicenses > 0) {
      alerts.push({
        level: 'critical',
        message: `${expiredLicenses} drivers have expired licenses`,
        action: 'Update driver licenses immediately'
      })
    }

    if (availableVehicles === 0) {
      alerts.push({
        level: 'critical',
        message: 'No vehicles available for dispatch',
        action: 'Complete maintenance or acquire vehicles'
      })
    }

    if (availableDrivers === 0) {
      alerts.push({
        level: 'critical',
        message: 'No drivers available for dispatch',
        action: 'Check driver schedules and licenses'
      })
    }

    return {
      status: alerts.some(a => a.level === 'critical') ? 'critical' : 'healthy',
      metrics: {
        totalVehicles: vehicles?.length || 0,
        availableVehicles,
        vehiclesInShop,
        totalDrivers: drivers?.length || 0,
        availableDrivers,
        expiredLicenses,
        activeTrips: activeTrips?.length || 0,
        openMaintenance: openMaintenance?.length || 0
      },
      alerts,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 🚀 Complete TransitOps API for K and Uncle
 * This is the single integration point they both need
 */
export const TransitOpsAPI = {
  // For Uncle (Trip Management)
  dispatch: DispatchSystem,
  financial: FinancialOps,

  // For K (Fleet Management UI)
  fleet: FleetManager,
  monitor: SystemMonitor,

  // Shared utilities
  utils: {
    formatCurrency: (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    formatDistance: (km: number) => `${km.toLocaleString()} km`,
    formatWeight: (kg: number) => `${kg.toLocaleString()} kg`,
    getStatusColor: (status: string) => {
      const colors: Record<string, string> = {
        'Available': 'green',
        'On Trip': 'blue',
        'In Shop': 'yellow',
        'Retired': 'gray',
        'Completed': 'green',
        'Dispatched': 'blue',
        'Draft': 'gray',
        'Cancelled': 'red'
      }
      return colors[status] || 'gray'
    }
  }
}

// Export individual systems for direct access
export { DispatchSystem, FleetManager, FinancialOps, SystemMonitor }