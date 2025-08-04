import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass any RLS issues
    const { data, error, count } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact' })
      .limit(10)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({
      success: true,
      count: count,
      employees: data,
      message: `Found ${count || 0} employees in the database`
    })

  } catch (error: any) {
    console.error('Error checking employees:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check employees' 
      },
      { status: 500 }
    )
  }
}