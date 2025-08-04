import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, getUserRole } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import EmployeeSearchFilter from '@/components/EmployeeSearchFilter'

export default async function EmployeesPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const [currentEmployee, userRole, canEdit] = await Promise.all([
    getCurrentEmployee(),
    getUserRole(),
    canUserEdit()
  ])

  if (!currentEmployee) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Get employees with user types - role-based filtering would go here
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select(`
      *,
      user_types (
        user_type_id,
        name,
        description
      )
    `)
    .order('employee_id')

  if (employeeError) {
    throw new Error(`Failed to load employees: ${employeeError.message}`)
  }

  // Get current assignments
  const { data: assignments } = await supabase
    .from('employee_assignments')
    .select(`
      employee_id,
      location_id,
      is_current,
      is_primary,
      assignment_type,
      start_date,
      locations (
        location_id,
        name,
        store_number
      ),
      job_titles (
        job_title_id,
        name
      )
    `)
    .eq('is_current', true)

  // Merge assignments with employees
  const employeesWithAssignments = (employees || []).map(emp => {
    const empAssignments = assignments?.filter(a => a.employee_id === emp.employee_id) || []
    return {
      ...emp,
      current_assignments: empAssignments
    }
  })

  return (
    <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Employees</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all employees including their role, status, and location.
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/employees/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2 sm:w-auto"
                >
                  Add employee
                </Link>
              </div>
            )}
          </div>

          {/* Client Component for Search/Filter */}
          <EmployeeSearchFilter 
            employees={employeesWithAssignments}
            canEdit={canEdit}
            currentUserRole={userRole}
          />
        </div>
      </div>
  )
}