import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentEmployee() {
  const user = await getUser()
  if (!user) return null
  
  const supabase = await createServerClient()
  
  // First get the employee
  const { data: employee } = await supabase
    .from('employees')
    .select('*, user_types(*)')
    .eq('auth_user_id', user.id)
    .single()
    
  if (!employee) return null
  
  // Then get their current assignments
  const { data: assignments } = await supabase
    .from('employee_assignments')
    .select(`
      *,
      job_titles(*),
      locations(*)
    `)
    .eq('employee_id', employee.employee_id)
    .eq('is_current', true)
    
  // Add current assignments to employee object
  employee.current_assignments = assignments || []
    
  return employee
}

// Permission helper functions
export async function canUserEdit() {
  const employee = await getCurrentEmployee()
  if (!employee) return false
  
  const allowedRoles = ['ADMIN', 'HR']
  return allowedRoles.includes(employee.user_types?.name || '')
}

export async function canUserManageEmployees() {
  const employee = await getCurrentEmployee()
  if (!employee) return false
  
  const allowedRoles = ['ADMIN', 'HR', 'MANAGER']
  return allowedRoles.includes(employee.user_types?.name || '')
}

export async function canUserManageLocation(locationId: number) {
  const employee = await getCurrentEmployee()
  if (!employee) return false
  
  // ADMIN and HR can manage any location
  if (['ADMIN', 'HR'].includes(employee.user_types?.name || '')) {
    return true
  }
  
  // Check if user is the manager of this specific location
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('locations')
    .select('manager_employee_id')
    .eq('location_id', locationId)
    .single()
  
  return data?.manager_employee_id === employee.employee_id
}

export async function canUserViewEmployee(targetEmployeeId: number) {
  const currentEmployee = await getCurrentEmployee()
  if (!currentEmployee) return false
  
  // ADMIN and HR can view anyone
  if (['ADMIN', 'HR'].includes(currentEmployee.user_types?.name || '')) {
    return true
  }
  
  // Users can view themselves
  if (currentEmployee.employee_id === targetEmployeeId) {
    return true
  }
  
  // Managers can view their direct reports
  if (currentEmployee.user_types?.name === 'MANAGER') {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from('employee_assignments')
      .select('employee_id')
      .eq('supervisor_employee_id', currentEmployee.employee_id)
      .eq('is_current', true)
      .eq('employee_id', targetEmployeeId)
      .single()
    
    return !!data
  }
  
  return false
}

export async function getUserRole() {
  const employee = await getCurrentEmployee()
  return employee?.user_types?.name || null
}