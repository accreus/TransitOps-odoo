/**
 * Debug TransitOps Setup - Check what's actually in the database
 */

import { supabase } from '../lib/supabase'

async function debugSetup() {
  console.log('🔍 Debugging TransitOps setup...')

  try {
    // Check 1: Can we connect to database?
    console.log('1. Testing database connection...')
    const { data: connectionTest, error: connError } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1)

    if (connError) {
      console.log('❌ Database connection failed:', connError.message)
      console.log('   Schema probably not applied yet')
      return
    }
    console.log('✅ Database connection working')

    // Check 2: What's in the auth.users table?
    console.log('\n2. Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log('❌ Cannot access auth users (need service role key)')
    } else {
      console.log(`✅ Found ${authUsers.users?.length || 0} auth users:`)
      authUsers.users?.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`)
      })
    }

    // Check 3: What's in the users table?
    console.log('\n3. Checking users table...')
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')

    if (dbError) {
      console.log('❌ Users table error:', dbError.message)
      if (dbError.code === '42501') {
        console.log('   RLS policy blocking access - this is the issue!')
      }
    } else {
      console.log(`✅ Found ${dbUsers?.length || 0} users in database:`)
      dbUsers?.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} - Role: ${user.role}`)
      })
    }

    // Check 4: Try to create a user directly
    console.log('\n4. Attempting direct user creation...')

    // Get the first auth user
    const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers()
    const firstAuthUser = allAuthUsers?.[0]

    if (firstAuthUser) {
      console.log(`   Trying to create user profile for: ${firstAuthUser.email}`)

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: firstAuthUser.id,
          email: firstAuthUser.email,
          name: 'Fleet Manager',
          role: 'Fleet Manager'
        })
        .select()

      if (createError) {
        console.log('❌ Direct user creation failed:', createError.message)
        if (createError.code === '23505') {
          console.log('   User already exists - good!')
        }
      } else {
        console.log('✅ User created successfully!')
      }
    }

    // Check 5: Final verification
    console.log('\n5. Final check for Fleet Manager users...')
    const { data: finalCheck, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Fleet Manager')

    if (finalError) {
      console.log('❌ Final check failed:', finalError.message)
    } else {
      console.log(`✅ Found ${finalCheck?.length || 0} Fleet Manager users:`)
      finalCheck?.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email}`)
      })
    }

    console.log('\n🔧 SOLUTION:')
    if (!finalCheck || finalCheck.length === 0) {
      console.log('Manual fix needed - run this SQL in Supabase Dashboard:')
      console.log('')
      console.log('-- Get auth user ID first:')
      console.log('SELECT id, email FROM auth.users;')
      console.log('')
      console.log('-- Then insert user profile (replace UUID and email):')
      console.log(`INSERT INTO users (id, email, name, role) VALUES (`)
      console.log(`  'COPY-UUID-FROM-ABOVE', 'your.real.email@gmail.com', 'Fleet Manager', 'Fleet Manager'`)
      console.log(`);`)
    } else {
      console.log('✅ Setup looks good! Try running setup-complete again.')
    }

  } catch (error) {
    console.error('Debug failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  debugSetup().catch(console.error)
}

export { debugSetup }