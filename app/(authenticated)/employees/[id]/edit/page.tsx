import { redirect } from 'next/navigation'
import { getUser, getUserRole, createServerClient } from '@/lib/supabase/server'
import EmployeeEditForm from '@/components/EmployeeEditForm'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type UserType = Database['public']['Tables']['user_types']['Row']

export default async function EmployeeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const userRole = await getUserRole()
  const canEdit = userRole === 'ADMIN' || userRole === 'HR'
  
  if (!canEdit) {
    const { id } = await params
    redirect(`/employees/${id}`)
  }
  
  const { id } = await params
  const employeeId = parseInt(id)
  const supabase = await createServerClient()
  
  // Fetch employee data
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', employeeId)
    .single()
  
  if (empError || !employee) {
    redirect('/employees')
  }
  
  // Fetch user types
  const { data: userTypes, error: typesError } = await supabase
    .from('user_types')
    .select('*')
    .order('name')
  
  if (typesError || !userTypes) {
    throw new Error('Failed to load user types')
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Employee: {employee.first_name} {employee.last_name}
            </h2>
          </div>
        </div>
        
        <EmployeeEditForm 
          employee={employee} 
          userTypes={userTypes} 
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}