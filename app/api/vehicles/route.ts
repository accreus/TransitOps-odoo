import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVehicles, createVehicle, getAvailableVehiclesForDispatch } from '@/lib/vehicles'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const availableOnly = searchParams.get('available') === 'true'

    let vehicles
    if (availableOnly) {
      vehicles = await getAvailableVehiclesForDispatch()
    } else {
      vehicles = await getVehicles()
    }

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('GET /api/vehicles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'Fleet Manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()
    const vehicle = await createVehicle(data)
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('POST /api/vehicles error:', error)
    if (error.message?.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}