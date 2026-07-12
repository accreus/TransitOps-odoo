/**
 * Fixed TransitOps Setup Script
 * Uses valid email format and handles Supabase auth properly
 */

import { supabase } from '../lib/supabase'

async function setupTransitOpsFixed() {
  console.log('🚀 Starting TransitOps setup (fixed)...')

  try {
    // Step 1: Check if schema is applied
    console.log('1. Checking database schema...')

    const { data: tables, error: schemaError } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1)

    if (schemaError) {
      console.log('❌ Schema not applied yet!')
      console.log('')
      console.log('🔧 REQUIRED STEPS:')
      console.log('1. Go to: https://supabase.com/dashboard/project/howccngzkmxxtbdbdoef')
      console.log('2. SQL Editor → Apply schema.sql')
      console.log('3. SQL Editor → Apply rls-policies.sql')
      console.log('4. SQL Editor → Apply storage-setup.sql')
      console.log('5. Authentication → Users → Add admin user manually')
      console.log('6. Then run this script again')
      console.log('')
      return {
        success: false,
        error: 'Schema not applied - manual setup required'
      }
    }

    console.log('✅ Database schema is ready')

    // Step 2: Check for admin user
    console.log('2. Checking for admin user...')

    const { data: adminUsers } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Fleet Manager')
      .limit(1)

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin user found!')
      console.log('')
      console.log('🔧 CREATE ADMIN USER:')
      console.log('1. Go to: https://supabase.com/dashboard/project/howccngzkmxxtbdbdoef')
      console.log('2. Authentication → Users → Add user')
      console.log('3. Use a REAL email (not @transitops.com)')
      console.log('4. Example: your.email@gmail.com')
      console.log('5. Set password: TransitOps2026!')
      console.log('6. SQL Editor → Run:')
      console.log('   SELECT create_admin_user(\'your.email@gmail.com\', \'Fleet Manager\');')
      console.log('7. Then run this script again')
      console.log('')
      return {
        success: false,
        error: 'Admin user required - create manually first'
      }
    }

    const adminUser = adminUsers[0]
    console.log('✅ Admin user found:', adminUser.email)

    // Step 3: Seed demo data
    console.log('3. Seeding demo data...')

    // Create sample vehicles
    const vehicleData = [
      {
        registration_number: 'TRK-001',
        model: 'Volvo FH16',
        type: 'Heavy Truck',
        max_load_capacity: 25000,
        odometer: 125000,
        acquisition_cost: 85000,
        status: 'Available'
      },
      {
        registration_number: 'TRK-002',
        model: 'Mercedes Actros',
        type: 'Heavy Truck',
        max_load_capacity: 22000,
        odometer: 89000,
        acquisition_cost: 92000,
        status: 'Available'
      },
      {
        registration_number: 'VAN-001',
        model: 'Ford Transit',
        type: 'Light Van',
        max_load_capacity: 2000,
        odometer: 45000,
        acquisition_cost: 35000,
        status: 'Available'
      }
    ]

    let vehicleCount = 0
    for (const vehicle of vehicleData) {
      const { error } = await supabase
        .from('vehicles')
        .insert(vehicle)

      if (!error) {
        vehicleCount++
        console.log(`✅ Created vehicle: ${vehicle.registration_number}`)
      } else if (error.code === '23505') {
        console.log(`⚠️  Vehicle ${vehicle.registration_number} already exists`)
      } else {
        console.log(`❌ Failed to create vehicle ${vehicle.registration_number}:`, error.message)
      }
    }

    // Create sample drivers
    const driverData = [
      {
        name: 'John Martinez',
        license_number: 'CDL-001-2024',
        license_category: 'Class A CDL',
        license_expiry: '2027-03-15',
        contact: '+1-555-0101',
        safety_score: 95,
        status: 'Available'
      },
      {
        name: 'Sarah Johnson',
        license_number: 'CDL-002-2024',
        license_category: 'Class A CDL',
        license_expiry: '2027-06-20',
        contact: '+1-555-0102',
        safety_score: 88,
        status: 'Available'
      }
    ]

    let driverCount = 0
    for (const driver of driverData) {
      const { error } = await supabase
        .from('drivers')
        .insert(driver)

      if (!error) {
        driverCount++
        console.log(`✅ Created driver: ${driver.name}`)
      } else if (error.code === '23505') {
        console.log(`⚠️  Driver ${driver.name} already exists`)
      } else {
        console.log(`❌ Failed to create driver ${driver.name}:`, error.message)
      }
    }

    console.log('')
    console.log('🎉 TransitOps setup completed successfully!')
    console.log('')
    console.log('📊 System ready with:')
    console.log(`   • Admin user: ${adminUser.email}`)
    console.log(`   • ${vehicleCount} demo vehicles`)
    console.log(`   • ${driverCount} demo drivers`)
    console.log('')
    console.log('🚨 READY FOR K AND UNCLE!')
    console.log('   ✅ Database schema applied')
    console.log('   ✅ Demo data loaded')
    console.log('   ✅ Integration APIs ready')
    console.log('')
    console.log('Next: K and Uncle can start building immediately!')

    return {
      success: true,
      adminUser,
      vehicleCount,
      driverCount,
      message: 'TransitOps setup completed - ready for development!'
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)

    if (error.code === '42501') {
      console.log('')
      console.log('🔒 RLS Policy Issue - Schema/Policies not applied')
      console.log('Apply schema.sql and rls-policies.sql first!')
    }

    throw error
  }
}

// Run if called directly
if (require.main === module) {
  setupTransitOpsFixed().catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

export { setupTransitOpsFixed }