import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, getUserRole } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import AssignmentSearchFilter from '@/components/AssignmentSearchFilter'

export default async function AssignmentsPage() {
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

  // Get assignments with related data
  const { data: assignments, error } = await supabase
    .from('employee_assignments')
    .select(`
      *,
      employees!employee_assignments_employee_id_fkey (
        employee_id,
        first_name,
        last_name,
        email,
        employee_number
      ),
      locations (
        location_id,
        name,
        store_number
      ),
      job_titles (
        job_title_id,
        name
      ),
      supervisor:employees!employee_assignments_supervisor_employee_id_fkey (
        employee_id,
        first_name,
        last_name
      )
    `)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching assignments:', error)
    throw new Error(`Failed to load assignments: ${error.message}`)
  }

  return (      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Employee Assignments</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage employee location and position assignments.
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/assignments/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2 sm:w-auto"
                >
                  New Assignment
                </Link>
              </div>
            )}
          </div>

          {/* Client Component for Search/Filter */}
          <AssignmentSearchFilter 
            assignments={assignments || []}
            canEdit={canEdit}
            currentUserRole={userRole}
          />
        </div>
      </div>  )
}