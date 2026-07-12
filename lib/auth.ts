import { supabase } from './supabase'
import type { User, UserRole } from '../types/database'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  name: string
  role: UserRole
}

/**
 * Sign up a new user with role-based access
 */
export async function signUp({ email, password, name, role }: SignupCredentials) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // 2. Create user profile with role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
      })
      .select()
      .single()

    if (userError) throw userError

    return { user: userData, session: authData.session }
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

/**
 * Sign in user
 */
export async function signIn({ email, password }: LoginCredentials) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Get user profile with role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) throw userError

    return { user: userData, session: data.session }
  } catch (error) {
    console.error('Signin error:', error)
    throw error
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current user profile with role
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) throw error

    return userData
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
  return user?.role === requiredRole
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  return user ? requiredRoles.includes(user.role) : false
}

/**
 * Role-based permissions
 */
export const ROLE_PERMISSIONS = {
  'Fleet Manager': {
    vehicles: { create: true, read: true, update: true, delete: true },
    drivers: { create: true, read: true, update: true, delete: true },
    trips: { create: true, read: true, update: true, delete: true },
    maintenance: { create: true, read: true, update: true, delete: true },
    fuel: { create: true, read: true, update: true, delete: true },
    expenses: { create: true, read: true, update: true, delete: true },
    documents: { create: true, read: true, update: true, delete: true },
  },
  'Driver': {
    vehicles: { create: false, read: true, update: false, delete: false },
    drivers: { create: false, read: true, update: false, delete: false },
    trips: { create: false, read: true, update: true, delete: false }, // Can update trip status
    maintenance: { create: true, read: true, update: false, delete: false }, // Can report issues
    fuel: { create: true, read: true, update: false, delete: false },
    expenses: { create: true, read: true, update: false, delete: false },
    documents: { create: true, read: true, update: false, delete: false },
  },
  'Safety Officer': {
    vehicles: { create: false, read: true, update: true, delete: false },
    drivers: { create: false, read: true, update: true, delete: false }, // Can update safety scores
    trips: { create: false, read: true, update: false, delete: false },
    maintenance: { create: false, read: true, update: false, delete: false },
    fuel: { create: false, read: true, update: false, delete: false },
    expenses: { create: false, read: true, update: false, delete: false },
    documents: { create: true, read: true, update: false, delete: false },
  },
  'Financial Analyst': {
    vehicles: { create: false, read: true, update: false, delete: false },
    drivers: { create: false, read: true, update: false, delete: false },
    trips: { create: false, read: true, update: true, delete: false }, // Can update revenue
    maintenance: { create: false, read: true, update: false, delete: false },
    fuel: { create: false, read: true, update: false, delete: false },
    expenses: { create: false, read: true, update: true, delete: false },
    documents: { create: false, read: true, update: false, delete: false },
  },
} as const

/**
 * Check if user can perform action on resource
 */
export function canPerform(
  user: AuthUser | null,
  resource: keyof typeof ROLE_PERMISSIONS['Fleet Manager'],
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role][resource][action]
}