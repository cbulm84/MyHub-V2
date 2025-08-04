import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, canUserManageLocation } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import LocationDetailClient from '@/components/LocationDetailClient'

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const locationId = parseInt(id)

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

  const supabase = await createServerClient()

  // Fetch location data
  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('location_id', locationId)
    .single()

  if (locError || !location) {
    redirect('/locations')
  }

  // Check if user can manage this specific location
  const canManage = await canUserManageLocation(locationId)

  // Fetch district info
  let district = null
  if (location.district_id) {
    const { data: distData } = await supabase
      .from('districts')
      .select(`
        *,
        regions (
          name,
          markets (
            name
          )
        )
      `)
      .eq('district_id', location.district_id)
      .single()
    
    district = distData
  }

  // Fetch all districts for edit dropdown
  const { data: districts } = await supabase
    .from('districts')
    .select('*')
    .order('name')

  // Fetch employees at this location
  const { data: assignments } = await supabase
    .from('employee_assignments')
    .select(`
      employee_id,
      employees (
        employee_id,
        first_name,
        last_name,
        email,
        is_active
      ),
      job_titles (
        job_title_id,
        name
      )
    `)
    .eq('location_id', locationId)
    .eq('is_current', true)

  // Get unique employees with their job titles
  const employeeMap = new Map()
  assignments?.forEach(assignment => {
    if (assignment.employees && !employeeMap.has(assignment.employee_id)) {
      const employee = assignment.employees as any
      employeeMap.set(assignment.employee_id, {
        ...employee,
        job_title: assignment.job_titles?.name || 'N/A'
      })
    }
  })
  const employees = Array.from(employeeMap.values())

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-alliance-blue rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-store text-white text-lg"></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      {location.name}
                    </h1>
                    <div className="mt-1 flex items-center space-x-4">
                      <span className="flex items-center text-sm text-gray-500">
                        <i className="fas fa-hashtag mr-1"></i>
                        Store {location.store_number || 'N/A'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        location.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <i className={`fas ${location.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex lg:mt-0 lg:ml-4">
                <Link
                  href="/locations"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue transition-colors duration-150"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Locations
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <LocationDetailClient 
            location={location}
            district={district}
            districts={districts || []}
            employees={employees}
            canEdit={canEdit || canManage}
            locationId={locationId}
          />
        </div>
      </div>
  )
}