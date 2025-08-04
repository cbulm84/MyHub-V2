import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

function generateSecurePassword(): string {
  const length = parseInt(process.env.DEFAULT_PASSWORD_LENGTH || '16')
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      first_name, 
      last_name, 
      email, 
      username, 
      user_type_id,
      hire_date,
      mobile_phone,
      employee_number,
      is_full_time,
      is_active,
      temporary_password
    } = body

    // Step 1: Create auth user with temporary password
    const generatedPassword = temporary_password || generateSecurePassword()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    // Step 2: Get the next employee ID
    const { data: maxId } = await supabaseAdmin
      .from('employees')
      .select('employee_id')
      .order('employee_id', { ascending: false })
      .limit(1)
      .single()

    const nextId = maxId ? maxId.employee_id + 1 : 2000

    // Step 3: Create employee record linked to auth user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        employee_id: nextId,
        auth_user_id: authData.user.id,
        first_name,
        last_name,
        email,
        username: username || email.split('@')[0],
        user_type_id: user_type_id || 3, // Default to EMPLOYEE
        hire_date,
        mobile_phone: mobile_phone || null,
        employee_number: employee_number || `EMP${nextId}`,
        is_full_time: is_full_time !== undefined ? is_full_time : true,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single()

    if (employeeError) {
      // If employee creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Employee creation error:', employeeError)
      throw new Error(`Failed to create employee record: ${employeeError.message}`)
    }

    return NextResponse.json({
      success: true,
      employee,
      message: 'Employee created successfully. A secure password has been generated and they should receive a password reset email.'
    })

  } catch (error: any) {
    console.error('Error in employee creation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create employee' 
      },
      { status: 500 }
    )
  }
}