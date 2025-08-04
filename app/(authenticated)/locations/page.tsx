import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, getUserRole } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import LocationSearchFilterEnhanced from '@/components/LocationSearchFilterEnhanced'

export default async function LocationsPage() {
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

  // Fetch locations with their managers
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select(`
      *,
      manager:employees!location_manager_employee_id (
        employee_id,
        first_name,
        last_name
      )
    `)
    .order('name')

  if (!locError && locations) {
    // Fetch district info separately
    const districtIds = [...new Set(locations.map(l => l.district_id).filter(Boolean))]
    
    const { data: districts } = await supabase
      .from('districts')
      .select(`
        district_id,
        name,
        market_id,
        manager:employees!district_manager_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .in('district_id', districtIds)

    const { data: regions } = await supabase
      .from('regions')
      .select(`
        region_id,
        name
      `)

    const { data: markets } = await supabase
      .from('markets')
      .select(`
        market_id,
        name,
        region_id
      `)

    // Build lookup maps
    const districtMap = new Map(districts?.map(d => [d.district_id, d]) || [])
    const regionMap = new Map(regions?.map(r => [r.region_id, r]) || [])
    const marketMap = new Map(markets?.map(m => [m.market_id, m]) || [])

    // Attach hierarchy to locations (Districts → Markets → Regions - new hierarchy)
    locations.forEach(loc => {
      const district = districtMap.get(loc.district_id)
      if (district) {
        loc.districts = { 
          name: district.name,
          manager: district.manager
        }
        const market = marketMap.get(district.market_id)
        if (market) {
          loc.districts.markets = { name: market.name }
          // Markets have regions
          const region = regionMap.get(market.region_id)
          if (region) {
            loc.districts.markets.regions = { name: region.name }
          }
        }
      }
    })
  }

  if (locError) {
    throw new Error(`Failed to load locations: ${locError.message}`)
  }

  // Fetch employee counts
  const { data: assignments } = await supabase
    .from('employee_assignments')
    .select('location_id')
    .eq('is_current', true)

  // Calculate employee counts per location
  const employeeCounts = assignments?.reduce((acc, assignment) => {
    acc[assignment.location_id] = (acc[assignment.location_id] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  // Add employee counts to locations
  const locationsWithCounts = (locations || []).map(loc => ({
    ...loc,
    employee_count: employeeCounts[loc.location_id] || 0
  }))

  return (      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Locations</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all locations including their hierarchy and employee counts.
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/locations/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2 sm:w-auto"
                >
                  Add location
                </Link>
              </div>
            )}
          </div>

          {/* Client Component for Search/Filter */}
          <LocationSearchFilterEnhanced 
            locations={locationsWithCounts}
            canEdit={canEdit}
          />
        </div>
      </div>  )
}