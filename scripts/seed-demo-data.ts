import { supabase } from '../lib/supabase'
import { createVehicle } from '../lib/vehicles'
import { createDriver } from '../lib/drivers'
import { createTrip } from '../lib/trips'
import { createMaintenanceLog } from '../lib/maintenance'
import { createFuelLog, createExpense } from '../lib/financial'

/**
 * Seed demo data for TransitOps
 * Creates realistic test data for K and Uncle to work with
 */
export async function seedDemoData() {
  console.log('🌱 Starting TransitOps demo data seeding...')

  try {
    // 1. Create demo vehicles
    console.log('Creating vehicles...')
    const vehicles = []

    const vehicleData = [
      {
        registration_number: 'TRK-001',
        model: 'Volvo FH16',
        type: 'Heavy Truck',
        max_load_capacity: 25000,
        odometer: 125000,
        acquisition_cost: 85000,
        status: 'Available' as const
      },
      {
        registration_number: 'TRK-002',
        model: 'Mercedes Actros',
        type: 'Heavy Truck',
        max_load_capacity: 22000,
        odometer: 89000,
        acquisition_cost: 92000,
        status: 'Available' as const
      },
      {
        registration_number: 'VAN-001',
        model: 'Ford Transit',
        type: 'Light Van',
        max_load_capacity: 2000,
        odometer: 45000,
        acquisition_cost: 35000,
        status: 'Available' as const
      },
      {
        registration_number: 'TRK-003',
        model: 'Scania R500',
        type: 'Heavy Truck',
        max_load_capacity: 28000,
        odometer: 156000,
        acquisition_cost: 78000,
        status: 'In Shop' as const
      },
      {
        registration_number: 'VAN-002',
        model: 'Iveco Daily',
        type: 'Medium Van',
        max_load_capacity: 3500,
        odometer: 72000,
        acquisition_cost: 42000,
        status: 'Available' as const
      }
    ]

    for (const vData of vehicleData) {
      try {
        const vehicle = await createVehicle(vData)
        vehicles.push(vehicle)
        console.log(`✅ Created vehicle: ${vehicle.registration_number}`)
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Vehicle ${vData.registration_number} already exists, skipping`)
          // Get existing vehicle
          const { data: existingVehicle } = await supabase
            .from('vehicles')
            .select('*')
            .eq('registration_number', vData.registration_number)
            .single()
          if (existingVehicle) vehicles.push(existingVehicle)
        } else {
          throw error
        }
      }
    }

    // 2. Create demo drivers
    console.log('Creating drivers...')
    const drivers = []

    const driverData = [
      {
        name: 'John Martinez',
        license_number: 'CDL-001-2024',
        license_category: 'Class A CDL',
        license_expiry: '2027-03-15',
        contact: '+1-555-0101',
        safety_score: 95,
        status: 'Available' as const
      },
      {
        name: 'Sarah Johnson',
        license_number: 'CDL-002-2024',
        license_category: 'Class A CDL',
        license_expiry: '2027-06-20',
        contact: '+1-555-0102',
        safety_score: 88,
        status: 'Available' as const
      },
      {
        name: 'Mike Thompson',
        license_number: 'DL-003-2024',
        license_category: 'Class C',
        license_expiry: '2026-12-10',
        contact: '+1-555-0103',
        safety_score: 92,
        status: 'Available' as const
      },
      {
        name: 'Lisa Chen',
        license_number: 'CDL-004-2024',
        license_category: 'Class A CDL',
        license_expiry: '2027-01-30',
        contact: '+1-555-0104',
        safety_score: 96,
        status: 'Available' as const
      },
      {
        name: 'David Wilson',
        license_number: 'CDL-005-2024',
        license_category: 'Class B CDL',
        license_expiry: '2026-08-15',
        contact: '+1-555-0105',
        safety_score: 85,
        status: 'Off Duty' as const
      }
    ]

    for (const dData of driverData) {
      try {
        const driver = await createDriver(dData)
        drivers.push(driver)
        console.log(`✅ Created driver: ${driver.name}`)
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Driver ${dData.name} already exists, skipping`)
          // Get existing driver
          const { data: existingDriver } = await supabase
            .from('drivers')
            .select('*')
            .eq('license_number', dData.license_number)
            .single()
          if (existingDriver) drivers.push(existingDriver)
        } else {
          throw error
        }
      }
    }

    // 3. Create demo trips (only with available vehicles and drivers)
    console.log('Creating trips...')
    const availableVehicles = vehicles.filter(v => v.status === 'Available')
    const availableDrivers = drivers.filter(d => d.status === 'Available')

    if (availableVehicles.length > 0 && availableDrivers.length > 0) {
      const tripData = [
        {
          source: 'Los Angeles, CA',
          destination: 'Phoenix, AZ',
          vehicle_id: availableVehicles[0].id,
          driver_id: availableDrivers[0].id,
          cargo_weight: 18500,
          planned_distance: 357,
          status: 'Completed' as const,
          revenue: 2400
        },
        {
          source: 'Seattle, WA',
          destination: 'Portland, OR',
          vehicle_id: availableVehicles[1]?.id || availableVehicles[0].id,
          driver_id: availableDrivers[1]?.id || availableDrivers[0].id,
          cargo_weight: 1800,
          planned_distance: 173,
          status: 'Completed' as const,
          revenue: 850
        },
        {
          source: 'Phoenix, AZ',
          destination: 'Denver, CO',
          vehicle_id: availableVehicles[2]?.id || availableVehicles[0].id,
          driver_id: availableDrivers[2]?.id || availableDrivers[0].id,
          cargo_weight: 21000,
          planned_distance: 602,
          status: 'Draft' as const
        }
      ]

      for (const tData of tripData) {
        try {
          const trip = await createTrip(tData)
          console.log(`✅ Created trip: ${trip.source} → ${trip.destination}`)
        } catch (error) {
          console.log(`⚠️  Could not create trip ${tData.source} → ${tData.destination}:`, error.message)
        }
      }
    }

    // 4. Create maintenance records (for the "In Shop" vehicle)
    console.log('Creating maintenance records...')
    if (vehicles.length > 0) {
      const maintenanceData = [
        {
          vehicle_id: vehicles.find(v => v.status === 'In Shop')?.id || vehicles[0].id,
          description: 'Engine oil change and filter replacement',
          date: '2026-07-10',
          cost: 450,
          state: 'open' as const
        },
        {
          vehicle_id: vehicles[1]?.id || vehicles[0].id,
          description: 'Brake pad replacement - front axle',
          date: '2026-07-05',
          cost: 850,
          state: 'closed' as const
        }
      ]

      for (const mData of maintenanceData) {
        try {
          await createMaintenanceLog(mData)
          console.log(`✅ Created maintenance record`)
        } catch (error) {
          console.log(`⚠️  Could not create maintenance record:`, error.message)
        }
      }
    }

    // 5. Create fuel logs
    console.log('Creating fuel logs...')
    if (vehicles.length > 0) {
      const fuelData = [
        { vehicle_id: vehicles[0].id, liters: 180, cost: 234, date: '2026-07-11' },
        { vehicle_id: vehicles[1]?.id || vehicles[0].id, liters: 165, cost: 215, date: '2026-07-10' },
        { vehicle_id: vehicles[2]?.id || vehicles[0].id, liters: 85, cost: 110, date: '2026-07-09' },
      ]

      for (const fData of fuelData) {
        try {
          await createFuelLog(fData)
          console.log(`✅ Created fuel log`)
        } catch (error) {
          console.log(`⚠️  Could not create fuel log:`, error.message)
        }
      }
    }

    // 6. Create expense records
    console.log('Creating expenses...')
    if (vehicles.length > 0) {
      const expenseData = [
        { vehicle_id: vehicles[0].id, type: 'Tolls', cost: 45, date: '2026-07-11' },
        { vehicle_id: vehicles[1]?.id || vehicles[0].id, type: 'Parking', cost: 25, date: '2026-07-10' },
        { vehicle_id: vehicles[0].id, type: 'Insurance', cost: 850, date: '2026-07-01' },
      ]

      for (const eData of expenseData) {
        try {
          await createExpense(eData)
          console.log(`✅ Created expense record`)
        } catch (error) {
          console.log(`⚠️  Could not create expense:`, error.message)
        }
      }
    }

    console.log('🎉 TransitOps demo data seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   • ${vehicles.length} vehicles created`)
    console.log(`   • ${drivers.length} drivers created`)
    console.log('   • Sample trips, maintenance, fuel logs, and expenses added')
    console.log('🚨 READY: K and Uncle can now build against real data!')

    return {
      success: true,
      summary: {
        vehicles: vehicles.length,
        drivers: drivers.length,
        message: 'Demo data created successfully - ready for K and Uncle!'
      }
    }

  } catch (error) {
    console.error('❌ Demo data seeding failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData().catch(console.error)
}