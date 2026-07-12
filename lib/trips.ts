import { supabase } from './supabase'
import type { Trip, TripStatus, TripWithRelations } from '../types/database'
import { getAvailableVehiclesForDispatch } from './vehicles'
import { getAvailableDriversForDispatch } from './drivers'

export interface CreateTripData {
  source: string
  destination: string
  vehicle_id: string
  driver_id: string
  cargo_weight: number
  planned_distance: number
  status?: TripStatus
  revenue?: number
}

export interface UpdateTripData extends Partial<CreateTripData> {
  id: string
}

/**
 * Get all trips with vehicle and driver information
 */
export async function getTrips(): Promise<TripWithRelations[]> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      vehicle:vehicles(*),
      driver:drivers(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get trip by ID with relations
 */
export async function getTripById(id: string): Promise<TripWithRelations | null> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      vehicle:vehicles(*),
      driver:drivers(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Create new trip with validation
 * CRITICAL: Only uses vehicles/drivers from available pools
 */
export async function createTrip(tripData: CreateTripData): Promise<Trip> {
  // Validate vehicle is available for dispatch
  const availableVehicles = await getAvailableVehiclesForDispatch()
  const isVehicleAvailable = availableVehicles.some(v => v.id === tripData.vehicle_id)

  if (!isVehicleAvailable) {
    throw new Error('Selected vehicle is not available for dispatch (may be In Shop, Retired, or On Trip)')
  }

  // Validate driver is available for dispatch
  const availableDrivers = await getAvailableDriversForDispatch()
  const isDriverAvailable = availableDrivers.some(d => d.id === tripData.driver_id)

  if (!isDriverAvailable) {
    throw new Error('Selected driver is not available for dispatch (may be On Trip, Off Duty, Suspended, or have expired license)')
  }

  // Create trip
  const { data, error } = await supabase
    .from('trips')
    .insert({
      ...tripData,
      status: tripData.status || 'Draft',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update trip status and related resources
 */
export async function updateTripStatus(id: string, status: TripStatus): Promise<Trip> {
  const trip = await getTripById(id)
  if (!trip) {
    throw new Error('Trip not found')
  }

  // Update vehicle and driver status based on trip status
  if (status === 'Dispatched') {
    // Set vehicle and driver to "On Trip"
    await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', trip.vehicle_id)
    await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', trip.driver_id)
  } else if (status === 'Completed' || status === 'Cancelled') {
    // Return vehicle and driver to "Available"
    await supabase.from('vehicles').update({ status: 'Available' }).eq('id', trip.vehicle_id)
    await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id)
  }

  // Update trip
  const { data, error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get available resources for dispatch
 */
export async function getDispatchResources() {
  const [vehicles, drivers] = await Promise.all([
    getAvailableVehiclesForDispatch(), // Excludes In Shop, Retired, On Trip
    getAvailableDriversForDispatch()   // Excludes On Trip, Off Duty, Suspended, expired licenses
  ])

  return { vehicles, drivers }
}

/**
 * Get trip statistics
 */
export async function getTripStats() {
  const { data, error } = await supabase
    .from('trips')
    .select('status, revenue, planned_distance')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    draft: 0,
    dispatched: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalDistance: 0,
  }

  data?.forEach(trip => {
    switch (trip.status) {
      case 'Draft':
        stats.draft++
        break
      case 'Dispatched':
        stats.dispatched++
        break
      case 'Completed':
        stats.completed++
        break
      case 'Cancelled':
        stats.cancelled++
        break
    }

    if (trip.revenue) {
      stats.totalRevenue += trip.revenue
    }

    stats.totalDistance += trip.planned_distance || 0
  })

  return stats
}