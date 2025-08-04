import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { getUser, getCurrentEmployee, canUserEdit } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export default async function MarketDetailPage({ params }: { params: { id: string } }) {
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

  const marketId = parseInt(params.id)
  const supabase = await createServerClient()

  // Fetch market details
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('*')
    .eq('market_id', marketId)
    .single()

  if (marketError || !market) {
    redirect('/organization')
  }

  // Fetch parent region of this market (NEW hierarchy: markets belong to regions)
  const { data: parentRegion } = await supabase
    .from('regions')
    .select('*')
    .eq('region_id', market.region_id)
    .single()

  // Fetch districts in this market (NEW hierarchy: districts belong to markets)
  const { data: districts } = await supabase
    .from('districts')
    .select(`
      *,
      manager:employees!district_manager_employee_id (
        employee_id,
        first_name,
        last_name
      )
    `)
    .eq('market_id', marketId)
    .eq('is_active', true)
    .order('name')

  // Get location counts per district
  const { data: locations } = await supabase
    .from('locations')
    .select('district_id')
    .eq('is_active', true)

  const locationCounts = (locations || []).reduce((acc, l) => {
    acc[l.district_id] = (acc[l.district_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const districtsWithCounts = (districts || []).map(district => ({
    ...district,
    location_count: locationCounts[district.district_id] || 0
  }))

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/organization" className="text-alliance-blue hover:text-alliance-navy">
                  Organization
                </Link>
              </li>
              <li className="text-gray-500">/</li>
              <li className="text-gray-900 font-medium">Market</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">{market.name}</h1>
              <p className="mt-2 text-sm text-gray-700">
                Market ID: {market.market_id}
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href={`/organization/market/${marketId}/edit`}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2"
                >
                  Edit Market
                </Link>
              </div>
            )}
          </div>

          {/* Market Details */}
          <div className="mt-6 bg-white shadow-alliance rounded-lg p-6">
            <h2 className="text-lg font-semibold text-alliance-navy mb-4">Market Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {market.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Parent Region</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {parentRegion ? (
                    <Link href={`/organization/region/${parentRegion.region_id}`} className="text-alliance-blue hover:text-alliance-navy">
                      {parentRegion.name}
                    </Link>
                  ) : (
                    'None'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Districts</dt>
                <dd className="mt-1 text-sm text-gray-900">{districtsWithCounts.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(market.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(market.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Districts List */}
          <div className="mt-6 bg-white shadow-alliance rounded-lg p-6">
            <h2 className="text-lg font-semibold text-alliance-navy mb-4">
              Districts in {market.name} ({districtsWithCounts.length})
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {districtsWithCounts.map((district) => (
                <Link
                  key={district.district_id}
                  href={`/organization/district/${district.district_id}`}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-alliance focus-within:ring-2 focus-within:ring-alliance-blue focus-within:ring-offset-2"
                >
                  <div>
                    <p className="text-lg font-medium text-gray-900">{district.name}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      ID: {district.district_id} • {district.location_count} locations
                    </p>
                    {district.manager && (
                      <p className="mt-1 text-xs text-gray-400">
                        Manager: {district.manager.first_name} {district.manager.last_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}