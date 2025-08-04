import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)
    const body = await request.json()
    const { 
      first_name, 
      last_name, 
      email, 
      mobile_phone,
      is_active,
      reset_password
    } = body

    // Get the employee to find their auth_user_id
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id, email')
      .eq('employee_id', employeeId)
      .single()

    if (fetchError || !employee) {
      throw new Error('Employee not found')
    }

    // Update employee record
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({
        first_name,
        last_name,
        email,
        mobile_phone,
        is_active,
      })
      .eq('employee_id', employeeId)

    if (updateError) {
      throw new Error(`Failed to update employee: ${updateError.message}`)
    }

    // If email changed and user has auth account, update auth email
    if (employee.auth_user_id && email !== employee.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        employee.auth_user_id,
        { email }
      )

      if (authError) {
        console.error('Failed to update auth email:', authError)
        // Don't throw here, just log - employee record is already updated
      }
    }

    // If reset password requested
    if (reset_password && employee.auth_user_id) {
      const tempPassword = `TempPass${employeeId}!`
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        employee.auth_user_id,
        { password: tempPassword }
      )

      if (passwordError) {
        throw new Error(`Failed to reset password: ${passwordError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Employee updated and password reset',
        temporaryPassword: tempPassword
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update employee' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)

    // Get the employee to find their auth_user_id
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id')
      .eq('employee_id', employeeId)
      .single()

    if (fetchError || !employee) {
      throw new Error('Employee not found')
    }

    // Soft delete - just mark as inactive
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ is_active: false })
      .eq('employee_id', employeeId)

    if (updateError) {
      throw new Error(`Failed to deactivate employee: ${updateError.message}`)
    }

    // Also disable auth account if exists
    if (employee.auth_user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        employee.auth_user_id,
        { ban_duration: 'none' }
      )

      if (authError) {
        console.error('Failed to disable auth account:', authError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully'
    })

  } catch (error: any) {
    console.error('Error deactivating employee:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to deactivate employee' 
      },
      { status: 500 }
    )
  }
}