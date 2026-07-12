import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required'
      }, { status: 400 })
    }

    const result = await signIn({ email, password })

    return NextResponse.json({
      user: result.user,
      session: result.session
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Login error:', message)

    if (message.includes('Invalid login credentials')) {
      return NextResponse.json({
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    return NextResponse.json({
      error: 'Login failed'
    }, { status: 500 })
  }
}
