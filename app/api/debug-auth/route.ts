import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ 
      error: 'No authenticated user',
      details: userError 
    }, { status: 401 })
  }
  
  // Try to fetch employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()
  
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    employee: employee,
    error: empError ? {
      message: empError.message,
      code: empError.code,
      details: empError.details,
      hint: empError.hint
    } : null
  })
}