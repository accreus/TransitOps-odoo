import { supabase } from './supabase'
import type { MaintenanceLog, MaintenanceState, Vehicle } from '../types/database'
import { getVehicleById, setVehicleStatus } from './vehicles'

export interface CreateMaintenanceLogData {
  vehicle_id: string
  description: string
  date?: string // defaults to today
  cost: number
  state?: MaintenanceState // defaults to 'open'
}

export interface UpdateMaintenanceLogData extends Partial<CreateMaintenanceLogData> {
  id: string
}

export interface MaintenanceLogWithVehicle extends MaintenanceLog {
  vehicle?: Vehicle
}

/**
 * Get all maintenance logs
 */
export async function getMaintenanceLogs(): Promise<MaintenanceLogWithVehicle[]> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      vehicle:vehicles(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get maintenance logs for a specific vehicle
 */
export async function getVehicleMaintenanceLogs(vehicleId: string): Promise<MaintenanceLogWithVehicle[]> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      vehicle:vehicles(*)
    `)
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get maintenance log by ID
 */
export async function getMaintenanceLogById(id: string): Promise<MaintenanceLogWithVehicle | null> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      vehicle:vehicles(*)
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
 * Create maintenance log
 * CRITICAL: Automatically sets vehicle status to "In Shop" via database trigger
 */
export async function createMaintenanceLog(logData: CreateMaintenanceLogData): Promise<MaintenanceLog> {
  // Validate vehicle exists and is not retired
  const vehicle = await getVehicleById(logData.vehicle_id)
  if (!vehicle) {
    throw new Error('Vehicle not found')
  }

  if (vehicle.status === 'Retired') {
    throw new Error('Cannot create maintenance log for retired vehicle')
  }

  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({
      ...logData,
      date: logData.date || new Date().toISOString().split('T')[0], // Default to today
      state: logData.state || 'open', // Default to open
    })
    .select()
    .single()

  if (error) throw error

  // Database trigger automatically sets vehicle status to "In Shop"
  return data
}

/**
 * Update maintenance log
 */
export async function updateMaintenanceLog({ id, ...updates }: UpdateMaintenanceLogData): Promise<MaintenanceLog> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Close maintenance log
 * CRITICAL: Automatically restores vehicle status to "Available" via database trigger
 */
export async function closeMaintenanceLog(id: string): Promise<MaintenanceLog> {
  return updateMaintenanceLog({ id, state: 'closed' })
}

/**
 * Delete maintenance log
 */
export async function deleteMaintenanceLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_logs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get maintenance statistics
 */
export async function getMaintenanceStats() {
  const { data: allLogs, error: allError } = await supabase
    .from('maintenance_logs')
    .select('state, cost')

  if (allError) throw allError

  const { data: openLogs, error: openError } = await supabase
    .from('maintenance_logs')
    .select('vehicle_id')
    .eq('state', 'open')

  if (openError) throw openError

  const stats = {
    totalLogs: allLogs?.length || 0,
    openLogs: openLogs?.length || 0,
    closedLogs: (allLogs?.length || 0) - (openLogs?.length || 0),
    totalCost: allLogs?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0,
    vehiclesInShop: new Set(openLogs?.map(log => log.vehicle_id) || []).size,
  }

  return stats
}