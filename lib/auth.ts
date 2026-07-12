import { createClient } from './supabase/server'
import { toFrontendRole, toDbRole, type FrontendRole } from './constants'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: FrontendRole
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  name: string
  role: FrontendRole
}

/**
 * Sign up a new user with role-based access
 */
export async function signUp({ email, password, name, role }: SignupCredentials) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('User creation failed')

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name,
      role: toDbRole(role),
    })
    .select()
    .single()

  if (userError) throw userError

  return { user: userData, session: authData.session }
}

/**
 * Sign in user
 */
export async function signIn({ email, password }: LoginCredentials) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (userError) throw userError

  return { user: userData, session: data.session }
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current user profile with normalized role
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error || !userData) return null

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: toFrontendRole(userData.role),
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
