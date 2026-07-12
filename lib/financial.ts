import { supabase } from './supabase'
import type { FuelLog, Expense } from '../types/database'

export interface CreateFuelLogData {
  vehicle_id: string
  liters: number
  cost: number
  date?: string
}

export interface CreateExpenseData {
  vehicle_id: string
  type: string
  cost: number
  date?: string
}

/**
 * Fuel Logs Management
 */
export async function getFuelLogs(vehicleId?: string) {
  let query = supabase
    .from('fuel_logs')
    .select(`
      *,
      vehicle:vehicles(registration_number, model)
    `)

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }

  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createFuelLog(logData: CreateFuelLogData): Promise<FuelLog> {
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert({
      ...logData,
      date: logData.date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Expense Management
 */
export async function getExpenses(vehicleId?: string) {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      vehicle:vehicles(registration_number, model)
    `)

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }

  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createExpense(expenseData: CreateExpenseData): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expenseData,
      date: expenseData.date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Financial Analytics
 */
export async function getFinancialSummary(vehicleId?: string, startDate?: string, endDate?: string) {
  // Get fuel costs
  let fuelQuery = supabase.from('fuel_logs').select('cost, date')
  if (vehicleId) fuelQuery = fuelQuery.eq('vehicle_id', vehicleId)
  if (startDate) fuelQuery = fuelQuery.gte('date', startDate)
  if (endDate) fuelQuery = fuelQuery.lte('date', endDate)

  // Get maintenance costs
  let maintenanceQuery = supabase.from('maintenance_logs').select('cost, date')
  if (vehicleId) maintenanceQuery = maintenanceQuery.eq('vehicle_id', vehicleId)
  if (startDate) maintenanceQuery = maintenanceQuery.gte('date', startDate)
  if (endDate) maintenanceQuery = maintenanceQuery.lte('date', endDate)

  // Get other expenses
  let expenseQuery = supabase.from('expenses').select('cost, date, type')
  if (vehicleId) expenseQuery = expenseQuery.eq('vehicle_id', vehicleId)
  if (startDate) expenseQuery = expenseQuery.gte('date', startDate)
  if (endDate) expenseQuery = expenseQuery.lte('date', endDate)

  // Get trip revenue
  let revenueQuery = supabase.from('trips').select('revenue, created_at')
    .eq('status', 'Completed').not('revenue', 'is', null)
  if (vehicleId) revenueQuery = revenueQuery.eq('vehicle_id', vehicleId)
  if (startDate) revenueQuery = revenueQuery.gte('created_at', startDate)
  if (endDate) revenueQuery = revenueQuery.lte('created_at', endDate)

  const [
    { data: fuelLogs, error: fuelError },
    { data: maintenanceLogs, error: maintenanceError },
    { data: expenses, error: expenseError },
    { data: trips, error: revenueError },
  ] = await Promise.all([
    fuelQuery,
    maintenanceQuery,
    expenseQuery,
    revenueQuery,
  ])

  if (fuelError) throw fuelError
  if (maintenanceError) throw maintenanceError
  if (expenseError) throw expenseError
  if (revenueError) throw revenueError

  const summary = {
    totalRevenue: trips?.reduce((sum, trip) => sum + (trip.revenue || 0), 0) || 0,
    totalFuelCost: fuelLogs?.reduce((sum, log) => sum + log.cost, 0) || 0,
    totalMaintenanceCost: maintenanceLogs?.reduce((sum, log) => sum + log.cost, 0) || 0,
    totalOtherExpenses: expenses?.reduce((sum, exp) => sum + exp.cost, 0) || 0,
    tripCount: trips?.length || 0,
    fuelEntries: fuelLogs?.length || 0,
    maintenanceEntries: maintenanceLogs?.length || 0,
    otherExpenseEntries: expenses?.length || 0,
  }

  summary.totalExpenses = summary.totalFuelCost + summary.totalMaintenanceCost + summary.totalOtherExpenses
  summary.netProfit = summary.totalRevenue - summary.totalExpenses

  return summary
}