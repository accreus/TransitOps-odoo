import { supabase } from './supabase'
import type { Vehicle, VehicleStatus } from '../types/database'

export interface CreateVehicleData {
  registration_number: string
  model: string
  type: string
  max_load_capacity: number
  odometer: number
  acquisition_cost: number
  status?: VehicleStatus
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  id: string
}

/**
 * Get all vehicles
 */
export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get vehicle by ID
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Get vehicle by registration number
 */
export async function getVehicleByRegistration(registrationNumber: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('registration_number', registrationNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Get vehicles available for dispatch
 * CRITICAL: Excludes 'Retired' and 'In Shop' vehicles as per business rules
 * This function is depended upon by Uncle's Trip logic
 */
export async function getAvailableVehiclesForDispatch(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'Available')
    .order('registration_number')

  if (error) throw error
  return data || []
}

/**
 * Create new vehicle with registration number uniqueness check
 */
export async function createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
  // Check for existing registration number
  const existing = await getVehicleByRegistration(vehicleData.registration_number)
  if (existing) {
    throw new Error(`Vehicle with registration number "${vehicleData.registration_number}" already exists`)
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error(`Vehicle with registration number "${vehicleData.registration_number}" already exists`)
    }
    throw error
  }

  return data
}

/**
 * Update vehicle
 */
export async function updateVehicle({ id, ...updates }: UpdateVehicleData): Promise<Vehicle> {
  // If updating registration number, check uniqueness
  if (updates.registration_number) {
    const existing = await getVehicleByRegistration(updates.registration_number)
    if (existing && existing.id !== id) {
      throw new Error(`Vehicle with registration number "${updates.registration_number}" already exists`)
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete vehicle (soft delete by setting status to Retired)
 */
export async function deleteVehicle(id: string): Promise<void> {
  // Check if vehicle is currently on a trip
  const { data: activeTrips } = await supabase
    .from('trips')
    .select('id')
    .eq('vehicle_id', id)
    .in('status', ['Draft', 'Dispatched'])
    .limit(1)

  if (activeTrips && activeTrips.length > 0) {
    throw new Error('Cannot retire vehicle that has active trips')
  }

  // Soft delete by setting status to Retired
  await updateVehicle({ id, status: 'Retired' })
}

/**
 * Set vehicle status (used by maintenance and trip systems)
 */
export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
  return updateVehicle({ id, status })
}

/**
 * Get vehicle statistics
 */
export async function getVehicleStats() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('status')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    available: 0,
    onTrip: 0,
    inShop: 0,
    retired: 0,
  }

  data?.forEach(vehicle => {
    switch (vehicle.status) {
      case 'Available':
        stats.available++
        break
      case 'On Trip':
        stats.onTrip++
        break
      case 'In Shop':
        stats.inShop++
        break
      case 'Retired':
        stats.retired++
        break
    }
  })

  return stats
}