import { supabase } from './supabase'
import type { Driver, DriverStatus } from '../types/database'

export interface CreateDriverData {
  name: string
  license_number: string
  license_category: string
  license_expiry: string
  contact: string
  safety_score?: number
  status?: DriverStatus
}

export interface UpdateDriverData extends Partial<CreateDriverData> {
  id: string
}

/**
 * Get all drivers
 */
export async function getDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Get driver by ID
 */
export async function getDriverById(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from('drivers')
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
 * Get drivers available for dispatch
 * CRITICAL: Excludes 'On Trip', 'Off Duty', and 'Suspended' drivers
 * Also excludes drivers with expired licenses
 * This function is depended upon by Uncle's Trip logic
 */
export async function getAvailableDriversForDispatch(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'Available')
    .gte('license_expiry', new Date().toISOString().split('T')[0]) // License not expired
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Create new driver with license number uniqueness check
 */
export async function createDriver(driverData: CreateDriverData): Promise<Driver> {
  // Check for existing license number
  const { data: existing } = await supabase
    .from('drivers')
    .select('id')
    .eq('license_number', driverData.license_number)
    .single()

  if (existing) {
    throw new Error(`Driver with license number "${driverData.license_number}" already exists`)
  }

  const { data, error } = await supabase
    .from('drivers')
    .insert({
      ...driverData,
      safety_score: driverData.safety_score || 100, // Default to 100
      status: driverData.status || 'Available', // Default to Available
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error(`Driver with license number "${driverData.license_number}" already exists`)
    }
    throw error
  }

  return data
}

/**
 * Update driver
 */
export async function updateDriver({ id, ...updates }: UpdateDriverData): Promise<Driver> {
  // If updating license number, check uniqueness
  if (updates.license_number) {
    const { data: existing } = await supabase
      .from('drivers')
      .select('id')
      .eq('license_number', updates.license_number)
      .neq('id', id)
      .single()

    if (existing) {
      throw new Error(`Driver with license number "${updates.license_number}" already exists`)
    }
  }

  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Set driver status (used by trip systems)
 */
export async function setDriverStatus(id: string, status: DriverStatus): Promise<Driver> {
  return updateDriver({ id, status })
}

/**
 * Get driver statistics
 */
export async function getDriverStats() {
  const { data, error } = await supabase
    .from('drivers')
    .select('status, safety_score, license_expiry')

  if (error) throw error

  const today = new Date().toISOString().split('T')[0]

  const stats = {
    total: data?.length || 0,
    available: 0,
    onTrip: 0,
    offDuty: 0,
    suspended: 0,
    expiredLicenses: 0,
    averageSafetyScore: 0,
  }

  let totalSafetyScore = 0

  data?.forEach(driver => {
    switch (driver.status) {
      case 'Available':
        stats.available++
        break
      case 'On Trip':
        stats.onTrip++
        break
      case 'Off Duty':
        stats.offDuty++
        break
      case 'Suspended':
        stats.suspended++
        break
    }

    if (driver.license_expiry < today) {
      stats.expiredLicenses++
    }

    totalSafetyScore += driver.safety_score || 0
  })

  if (data && data.length > 0) {
    stats.averageSafetyScore = Math.round(totalSafetyScore / data.length)
  }

  return stats
}