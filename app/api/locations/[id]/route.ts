import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUser, getCurrentEmployee, canUserEdit, canUserManageLocation } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const locationId = parseInt(id)
    
    if (!locationId || isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const [canEdit, canManage] = await Promise.all([
      canUserEdit(),
      canUserManageLocation(locationId)
    ])

    if (!canEdit && !canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, store_number, district_id, phone, is_active } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    // Create supabase client
    const supabase = await createServerClient()

    // Update location
    const { data, error } = await supabase
      .from('locations')
      .update({
        name,
        store_number: store_number || null,
        district_id: district_id || null,
        phone: phone || null,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('location_id', locationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating location:', error)
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/locations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}