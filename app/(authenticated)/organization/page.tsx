import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit, getUserRole } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

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

  // Fetch organizational data for the existing hierarchy: Markets → Regions → Districts → Locations
  const [marketsResult, regionsResult, districtsResult, locationsResult] = await Promise.all([
    supabase
      .from('markets')
      .select(`
        *,
        manager:employees!fk_markets_manager (
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
        director:employees!fk_regions_director (
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
        manager:employees!fk_districts_manager (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name'),
      
    supabase
      .from('locations')
      .select(`
        *,
        manager:employees!fk_locations_manager (
          employee_id,
          first_name,
          last_name
        )
      `)
      .order('name')
  ])

  // Extract data with error handling
  const markets = marketsResult.data || []
  const regions = regionsResult.data || []
  const districts = districtsResult.data || []
  const locations = locationsResult.data || []

  // Count totals
  const stats = {
    markets: markets.length,
    regions: regions.length,
    districts: districts.length,
    locations: locations.filter(l => l.is_active).length,
    total_locations: locations.length
  }

  return (
    <div className="py-6">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Organization Structure</h1>
            <p className="mt-2 text-sm text-gray-700">
              View and manage the organizational hierarchy
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-globe text-gray-400 text-2xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Markets</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.markets}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-map text-gray-400 text-2xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Regions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.regions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-sitemap text-gray-400 text-2xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Districts</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.districts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-store text-gray-400 text-2xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Locations</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.locations} <span className="text-sm text-gray-500">/ {stats.total_locations}</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Links</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/organization/markets"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-alliance-blue"
            >
              <div className="flex-shrink-0">
                <i className="fas fa-globe text-alliance-blue"></i>
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Markets</p>
                <p className="text-sm text-gray-500 truncate">View all markets</p>
              </div>
            </Link>

            <Link
              href="/organization/regions"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-alliance-blue"
            >
              <div className="flex-shrink-0">
                <i className="fas fa-map text-alliance-blue"></i>
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Regions</p>
                <p className="text-sm text-gray-500 truncate">View all regions</p>
              </div>
            </Link>

            <Link
              href="/organization/districts"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-alliance-blue"
            >
              <div className="flex-shrink-0">
                <i className="fas fa-sitemap text-alliance-blue"></i>
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Districts</p>
                <p className="text-sm text-gray-500 truncate">View all districts</p>
              </div>
            </Link>

            <Link
              href="/locations"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-alliance-blue"
            >
              <div className="flex-shrink-0">
                <i className="fas fa-store text-alliance-blue"></i>
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Locations</p>
                <p className="text-sm text-gray-500 truncate">View all locations</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}