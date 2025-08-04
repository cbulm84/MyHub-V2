import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, getUserRole } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import OrganizationHierarchyEnhanced from '@/components/OrganizationHierarchyEnhanced'

export default async function OrganizationPage() {
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

  // Fetch all organizational data with manager information
  // Including new hierarchy levels: companies and divisions
  const [companiesResult, divisionsResult, marketsResult, regionsResult, districtsResult, locationsResult] = await Promise.all([
    supabase
      .from('companies')
      .select('*')
      .order('name'),
    
    supabase
      .from('divisions')
      .select(`
        *,
        director:employees!division_director_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name'),
    supabase
      .from('markets')
      .select(`
        *,
        manager:employees!market_manager_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name'),
    
    supabase
      .from('regions')
      .select(`
        *,
        manager:employees!region_manager_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name'),
    
    supabase
      .from('districts')
      .select(`
        *,
        manager:employees!district_manager_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name'),
    
    supabase
      .from('locations')
      .select(`
        location_id,
        name,
        store_number,
        district_id,
        is_active,
        manager:employees!location_manager_employee_id (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name')
  ])

  if (companiesResult.error) throw new Error(`Failed to load companies: ${companiesResult.error.message}`)
  if (divisionsResult.error) throw new Error(`Failed to load divisions: ${divisionsResult.error.message}`)
  if (marketsResult.error) throw new Error(`Failed to load markets: ${marketsResult.error.message}`)
  if (regionsResult.error) throw new Error(`Failed to load regions: ${regionsResult.error.message}`)
  if (districtsResult.error) throw new Error(`Failed to load districts: ${districtsResult.error.message}`)
  if (locationsResult.error) throw new Error(`Failed to load locations: ${locationsResult.error.message}`)

  // Manually build relationships for full hierarchy
  const companies = companiesResult.data || []
  const divisions = divisionsResult.data || []
  const markets = marketsResult.data || []
  const regions = regionsResult.data || []
  const districts = districtsResult.data || []
  
  // Create lookup maps
  const companyMap = new Map(companies.map(c => [c.company_id, c]))
  const divisionMap = new Map(divisions.map(d => [d.division_id, d]))
  const marketMap = new Map(markets.map(m => [m.market_id, m]))
  const regionMap = new Map(regions.map(r => [r.region_id, r]))
  
  // Build hierarchy relationships (NEW: Districts → Markets → Regions)
  // No need to add market names to regions - markets have regions
  
  // Add market and region info to districts
  districts.forEach(district => {
    if (district.market_id) {
      const market = marketMap.get(district.market_id)
      if (market) {
        district.markets = { 
          name: market.name
        }
        if (market.region_id) {
          const region = regionMap.get(market.region_id)
          if (region) {
            district.markets.regions = { name: region.name }
          }
        }
      }
    }
  })

  // Get location counts per district
  const locationCounts = (locationsResult.data || []).reduce((acc, loc) => {
    if (loc.district_id) {
      acc[loc.district_id] = (acc[loc.district_id] || 0) + 1
    }
    return acc
  }, {} as Record<number, number>)

  // Get district counts per market (NEW hierarchy)
  const districtCounts = (districtsResult.data || []).reduce((acc, district) => {
    if (district.market_id) {
      acc[district.market_id] = (acc[district.market_id] || 0) + 1
    }
    return acc
  }, {} as Record<number, number>)

  // Get market counts per region (NEW hierarchy)
  const marketCounts = (marketsResult.data || []).reduce((acc, market) => {
    if (market.region_id) {
      acc[market.region_id] = (acc[market.region_id] || 0) + 1
    }
    return acc
  }, {} as Record<number, number>)

  // Organize data for hierarchy view
  const organizationData = {
    companies: companies,
    divisions: divisions,
    markets: markets.map(market => ({
      ...market,
      district_count: districtCounts[market.market_id] || 0
    })),
    regions: regions.map(region => ({
      ...region,
      market_count: marketCounts[region.region_id] || 0
    })),
    districts: districts.map(district => ({
      ...district,
      location_count: locationCounts[district.district_id] || 0
    })),
    locations: locationsResult.data || [],
    districtCounts,
    marketCounts,
    locationCounts
  }

  return (      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Organization Structure</h1>
              <p className="mt-2 text-sm text-gray-700">
                Complete organizational hierarchy: Companies → Divisions → Regions → Markets → Districts → Locations
              </p>
            </div>
          </div>

          {/* Client Component for Interactive Hierarchy */}
          <OrganizationHierarchyEnhanced 
            data={organizationData}
            canEdit={canEdit}
          />
        </div>
      </div>  )
}