import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, canUserViewEmployee } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import EmployeeDetailClient from '@/components/EmployeeDetailClient'

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employeeId = parseInt(id)

  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const [currentEmployee, canEdit] = await Promise.all([
    getCurrentEmployee(),
    canUserEdit()
  ])

  if (!currentEmployee) {
    redirect('/login')
  }

  // Check if user can view this employee
  const canView = await canUserViewEmployee(employeeId)
  if (!canView) {
    redirect('/employees')
  }

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

  // Fetch related data in parallel
  const [userTypeData, address, assignments] = await Promise.all([
    // User type
    employee.user_type_id ? supabase
      .from('user_types')
      .select('*')
      .eq('user_type_id', employee.user_type_id)
      .single()
      .then(res => res.data) : null,
    
    // Address
    employee.address_id ? supabase
      .from('addresses')
      .select('*')
      .eq('id', employee.address_id)
      .single()
      .then(res => res.data) : null,
    
    // Assignments with related data
    supabase
      .from('employee_assignments')
      .select(`
        *,
        locations (name, store_number),
        job_titles (name),
        supervisor:employees!supervisor_employee_id (first_name, last_name)
      `)
      .eq('employee_id', employeeId)
      .order('is_current', { ascending: false })
      .order('is_primary', { ascending: false })
      .order('start_date', { ascending: false })
      .then(res => res.data || [])
  ])

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {employee.first_name} {employee.last_name}
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="font-medium">ID:</span>&nbsp;{employee.employee_id}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    employee.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex lg:mt-0 lg:ml-4">
              <Link
                href="/employees"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
              >
                Back to list
              </Link>
              <EmployeeDetailClient 
                employee={employee}
                address={address}
                canEdit={canEdit}
                employeeId={employeeId}
              />
            </div>
          </div>

          {/* Employee Info - Multi-column layout */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            
            {/* Basic Information */}
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-200">
              <div className="px-6 py-5 bg-[#1B4278]">
                <h3 className="text-lg leading-6 font-semibold text-white">
                  Basic Information
                </h3>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.employee_id}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.employee_number || 'N/A'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">File Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.file_number || 'N/A'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Employment Details */}
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-200">
              <div className="px-6 py-5 bg-[#1B4278]">
                <h3 className="text-lg leading-6 font-semibold text-white">
                  Employment Details
                </h3>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        employee.is_full_time 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.is_full_time ? 'Full Time' : 'Part Time'}
                      </span>
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Leave Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        employee.is_on_leave 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.is_on_leave ? 'On Leave' : 'Working'}
                      </span>
                    </dd>
                  </div>
                  {/* Termination Information (if inactive) */}
                  {!employee.is_active && (
                    <>
                      <div className="px-4 py-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Termination Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {employee.termination_date ? new Date(employee.termination_date).toLocaleDateString() : 'N/A'}
                        </dd>
                      </div>
                      {employee.termination_notes && (
                        <div className="px-4 py-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Termination Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {employee.termination_notes}
                          </dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>
            </div>
            
            {/* System Access & Codes */}
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-200">
              <div className="px-6 py-5 bg-[#1B4278]">
                <h3 className="text-lg leading-6 font-semibold text-white">
                  System Access
                </h3>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.username || 'N/A'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${employee.email}`} className="text-alliance-blue hover:underline">
                        {employee.email}
                      </a>
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">User Type</dt>
                    <dd className="mt-1">
                      <div>
                        <p className="font-medium text-gray-900">{userTypeData?.description || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{userTypeData?.name}</p>
                      </div>
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(employee.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {employee.updated_at && (
                    <div className="px-4 py-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(employee.updated_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {/* Future: Employee Codes Section */}
            {/* This section is reserved for future employee codes functionality */}
            
          </div>

          {/* Current Assignment Highlight */}
          {assignments.filter(a => a.is_current).length > 0 && (
            <div className="mt-8 bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-200">
              <div className="px-6 py-5 bg-[#1B4278]">
                <h3 className="text-lg leading-6 font-semibold text-white">
                  Current Assignment{assignments.filter(a => a.is_current).length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="border-t border-gray-100 px-6 py-6">
                {assignments.filter(a => a.is_current).map((assignment, index) => (
                  <div key={assignment.id} className={index > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.job_titles.name} at {assignment.locations.name}
                          {assignment.locations.store_number && ` (${assignment.locations.store_number})`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Reports to: {assignment.supervisor ? 
                            `${assignment.supervisor.first_name} ${assignment.supervisor.last_name}` : 
                            'N/A'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          Current Position Start Date: {new Date(assignment.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        assignment.assignment_type === 'PRIMARY' || assignment.is_primary
                          ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.assignment_type || (assignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Assignment History */}
          <div className="mt-8 bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-200">
            <div className="px-6 py-5 bg-[#1B4278]">
              <h3 className="text-lg leading-6 font-semibold text-white">
                Assignment History
              </h3>
            </div>
            <div className="border-t border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Supervisor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Assignment Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="group hover:bg-alliance-navy transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900 group-hover:text-white">
                          {assignment.locations.name}
                        </div>
                        {assignment.locations.store_number && (
                          <div className="text-xs text-gray-500 group-hover:text-gray-200">
                            Store #{assignment.locations.store_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-white">
                        {assignment.job_titles.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-white">
                        {assignment.supervisor ? 
                          `${assignment.supervisor.first_name} ${assignment.supervisor.last_name}` : 
                          <span className="text-gray-500 italic group-hover:text-gray-200">N/A</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          assignment.assignment_type === 'PRIMARY' || assignment.is_primary
                            ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {assignment.assignment_type || (assignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-white">
                        {new Date(assignment.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          assignment.is_current 
                            ? 'bg-green-100 text-green-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {assignment.is_current ? 'Current' : 'Past'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No assignments found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}