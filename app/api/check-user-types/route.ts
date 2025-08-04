import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Check if user_types table exists and has data
    const { data: userTypes, error: typesError } = await supabaseAdmin
      .from('user_types')
      .select('*')
      .order('user_type_id')

    if (typesError) {
      console.error('User types error:', typesError)
      return NextResponse.json({
        success: false,
        error: typesError.message,
        details: typesError
      })
    }

    // Check a specific user's type
    const { data: { session } } = await supabaseAdmin.auth.getSession()
    
    let employeeData = null
    if (session?.user) {
      const { data: emp } = await supabaseAdmin
        .from('employees')
        .select('*, user_types(*)')
        .eq('auth_user_id', session.user.id)
        .single()
      
      employeeData = emp
    }

    return NextResponse.json({
      success: true,
      userTypes: userTypes || [],
      userTypesCount: userTypes?.length || 0,
      currentEmployee: employeeData,
      message: `Found ${userTypes?.length || 0} user types`
    })

  } catch (error: any) {
    console.error('Error checking user types:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check user types' 
      },
      { status: 500 }
    )
  }
}