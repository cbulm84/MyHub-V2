import { redirect } from 'next/navigation'
import { getCurrentEmployee, getUser } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const employee = await getCurrentEmployee()
  
  if (!employee) {
    redirect('/login')
  }

  // Get actual counts from database
  const supabase = await createServerClient()
  
  const [employeeCount, locationCount] = await Promise.all([
    supabase.from('employees').select('employee_id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('locations').select('location_id', { count: 'exact', head: true }).eq('is_active', true)
  ])

  // Get current assignments for this employee
  const { data: assignments } = await supabase
    .from('employee_assignments')
    .select('*')
    .eq('employee_id', employee.employee_id)
    .eq('is_current', true)

  return (
    <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Welcome Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Welcome, {employee.first_name} {employee.last_name}!
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Employee ID</p>
                    <p className="font-medium">{employee.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="font-medium">{employee.user_types?.description || employee.user_types?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Active Employees Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Employees</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{employeeCount.count || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Locations</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{locationCount.count || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Assignments Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Your Assignments</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{assignments?.length || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a href="/employees/new" className="relative group bg-white p-6 focus:ring-2 focus:ring-inset focus:ring-alliance-blue rounded-lg shadow hover:shadow-md transition-shadow block">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-alliance-blue bg-opacity-10 text-alliance-blue">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Add Employee</h3>
                    <p className="mt-2 text-sm text-gray-500">Create a new employee record</p>
                  </div>
                </a>

                <a href="/assignments" className="relative group bg-white p-6 focus:ring-2 focus:ring-inset focus:ring-alliance-blue rounded-lg shadow hover:shadow-md transition-shadow block">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-alliance-green bg-opacity-10 text-alliance-green">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Manage Assignments</h3>
                    <p className="mt-2 text-sm text-gray-500">Update employee locations</p>
                  </div>
                </a>

                <a href="/reports" className="relative group bg-white p-6 focus:ring-2 focus:ring-inset focus:ring-alliance-blue rounded-lg shadow hover:shadow-md transition-shadow block">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-alliance-sky bg-opacity-10 text-alliance-sky">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">View Reports</h3>
                    <p className="mt-2 text-sm text-gray-500">Analytics and insights</p>
                  </div>
                </a>

                <a href="/settings" className="relative group bg-white p-6 focus:ring-2 focus:ring-inset focus:ring-alliance-blue rounded-lg shadow hover:shadow-md transition-shadow block">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-alliance-navy bg-opacity-10 text-alliance-navy">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage system settings</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}