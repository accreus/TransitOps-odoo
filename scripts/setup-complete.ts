/**
 * Complete TransitOps Setup Script
 * Handles admin user creation and demo data seeding in correct order
 */

import { supabase } from '../lib/supabase'
import { signUp } from '../lib/auth'
import { seedDemoData } from './seed-demo-data'

async function setupTransitOps() {
  console.log('🚀 Starting complete TransitOps setup...')

  try {
    // Step 1: Check if admin user already exists
    console.log('1. Checking for existing admin user...')

    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Fleet Manager')
      .limit(1)

    let adminUser = existingUsers?.[0]

    if (!adminUser) {
      console.log('2. Creating admin user...')

      // Create admin user via auth system
      const adminCredentials = {
        email: 'admin@transitops.com',
        password: 'TransitOps2026!',
        name: 'System Administrator',
        role: 'Fleet Manager' as const
      }

      try {
        const authResult = await signUp(adminCredentials)
        adminUser = authResult.user
        console.log('✅ Admin user created successfully')
      } catch (error) {
        if (error.message?.includes('already registered')) {
          console.log('⚠️  Admin user already exists in auth, checking database...')

          // Try to find existing user
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user) {
            // Create user profile if missing
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .insert({
                id: authUser.user.id,
                email: adminCredentials.email,
                name: adminCredentials.name,
                role: adminCredentials.role
              })
              .select()
              .single()

            if (!profileError) {
              adminUser = userProfile
              console.log('✅ Admin user profile created')
            }
          }
        } else {
          throw error
        }
      }
    } else {
      console.log('✅ Admin user already exists')
    }

    if (!adminUser) {
      throw new Error('Failed to create or find admin user')
    }

    // Step 2: Set up authentication context for demo data
    console.log('3. Setting up demo data with admin context...')

    // Temporarily bypass RLS for seeding by using service role if available
    // or ensure we're authenticated as admin

    // Step 3: Seed demo data
    console.log('4. Seeding demo data...')
    await seedDemoData()

    console.log('🎉 TransitOps setup completed successfully!')
    console.log('')
    console.log('📊 System ready with:')
    console.log(`   • Admin user: ${adminUser.email}`)
    console.log('   • Demo vehicles and drivers')
    console.log('   • Sample trips and financial data')
    console.log('')
    console.log('🚨 READY FOR K AND UNCLE!')
    console.log('   Database is live with real data')
    console.log('   Integration APIs ready to use')
    console.log('')
    console.log('Next steps:')
    console.log('1. Share admin credentials with team')
    console.log('2. K can start building UI components')
    console.log('3. Uncle can implement trip logic')

    return {
      success: true,
      adminUser,
      message: 'TransitOps setup completed - ready for development!'
    }

  } catch (error) {
    console.error('❌ TransitOps setup failed:', error)

    if (error.code === '42501') {
      console.log('')
      console.log('🔒 RLS Policy Issue Detected')
      console.log('Solution: Apply these SQL files in Supabase Dashboard first:')
      console.log('1. schema.sql')
      console.log('2. rls-policies.sql')
      console.log('3. storage-setup.sql')
      console.log('')
      console.log('Then create admin user manually:')
      console.log('1. Go to Supabase Auth > Users')
      console.log('2. Add user: admin@transitops.com')
      console.log('3. Run: SELECT create_admin_user(\'admin@transitops.com\', \'Admin\');')
      console.log('4. Then run this setup script again')
    }

    throw error
  }
}

// Run if called directly
if (require.main === module) {
  setupTransitOps().catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

export { setupTransitOps }