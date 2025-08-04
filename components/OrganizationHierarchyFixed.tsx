'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'

type Employee = {
  employee_id: number
  first_name: string
  last_name: string
}

type Company = {
  company_id: number
  name: string
  email?: string | null
  is_active: boolean
}

type Division = {
  division_id: number
  company_id: number
  name: string
  code?: string | null
  director?: Employee | null
  is_active: boolean
}

type Market = Database['public']['Tables']['markets']['Row'] & { 
  region_count: number
  manager?: Employee | null
}

type Region = Database['public']['Tables']['regions']['Row'] & { 
  division_id?: number | null
  markets?: { name: string } | null
  director?: Employee | null
  manager?: Employee | null
}

type District = Database['public']['Tables']['districts']['Row'] & { 
  market_id?: number | null
  regions?: { name: string; markets?: { name: string } | null } | null
  location_count: number
  manager?: Employee | null
}

type Location = Pick<Database['public']['Tables']['locations']['Row'], 'location_id' | 'name' | 'store_number' | 'district_id' | 'is_active'> & {
  manager?: Employee | null
}

interface OrganizationHierarchyProps {
  data: {
    companies: Company[]
    divisions: Division[]
    markets: Market[]
    regions: Region[]
    districts: District[]
    locations: Location[]
    districtCounts: Record<number, number>
    locationCounts: Record<number, number>
  }
  canEdit: boolean
}

export default function OrganizationHierarchyFixed({ data, canEdit }: OrganizationHierarchyProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set([1]))
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(new Set([1]))
  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set())
  const [expandedMarkets, setExpandedMarkets] = useState<Set<number>>(new Set())
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'tree' | 'cards'>('tree')

  // Filter data based on status and search
  const filteredData = useMemo(() => {
    let filtered = data
    
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = {
        ...filtered,
        companies: filtered.companies.filter(c => c.is_active === isActive),
        divisions: filtered.divisions.filter(d => d.is_active === isActive),
        markets: filtered.markets.filter(m => m.is_active === isActive),
        regions: filtered.regions.filter(r => r.is_active === isActive),
        districts: filtered.districts.filter(d => d.is_active === isActive),
        locations: filtered.locations.filter(l => l.is_active === isActive)
      }
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = {
        ...filtered,
        companies: filtered.companies.filter(c => 
          c.name.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search)
        ),
        divisions: filtered.divisions.filter(d => 
          d.name.toLowerCase().includes(search) ||
          d.code?.toLowerCase().includes(search) ||
          d.director?.first_name?.toLowerCase().includes(search) ||
          d.director?.last_name?.toLowerCase().includes(search)
        ),
        markets: filtered.markets.filter(m => 
          m.name.toLowerCase().includes(search) ||
          m.manager?.first_name?.toLowerCase().includes(search) ||
          m.manager?.last_name?.toLowerCase().includes(search)
        ),
        regions: filtered.regions.filter(r => 
          r.name.toLowerCase().includes(search) ||
          r.manager?.first_name?.toLowerCase().includes(search) ||
          r.manager?.last_name?.toLowerCase().includes(search)
        ),
        districts: filtered.districts.filter(d => 
          d.name.toLowerCase().includes(search) ||
          d.manager?.first_name?.toLowerCase().includes(search) ||
          d.manager?.last_name?.toLowerCase().includes(search)
        ),
        locations: filtered.locations.filter(l => 
          l.name.toLowerCase().includes(search) ||
          l.store_number?.toString().includes(search) ||
          l.manager?.first_name?.toLowerCase().includes(search) ||
          l.manager?.last_name?.toLowerCase().includes(search)
        )
      }
    }
    
    return filtered
  }, [data, statusFilter, searchTerm])

  // Group data by parent (using filtered data)
  const divisionsByCompany = useMemo(() => {
    return filteredData.divisions.reduce((acc, division) => {
      if (!acc[division.company_id]) acc[division.company_id] = []
      acc[division.company_id].push(division)
      return acc
    }, {} as Record<number, Division[]>)
  }, [filteredData.divisions])

  const regionsByDivision = useMemo(() => {
    return filteredData.regions.reduce((acc, region) => {
      if (region.division_id) {
        if (!acc[region.division_id]) acc[region.division_id] = []
        acc[region.division_id].push(region)
      }
      return acc
    }, {} as Record<number, Region[]>)
  }, [filteredData.regions])

  const marketsByRegion = useMemo(() => {
    return filteredData.markets.reduce((acc, market) => {
      if (market.region_id) {
        if (!acc[market.region_id]) acc[market.region_id] = []
        acc[market.region_id].push(market)
      }
      return acc
    }, {} as Record<number, Market[]>)
  }, [filteredData.markets])

  const districtsByMarket = useMemo(() => {
    return filteredData.districts.reduce((acc, district) => {
      if (district.market_id) {
        if (!acc[district.market_id]) acc[district.market_id] = []
        acc[district.market_id].push(district)
      }
      return acc
    }, {} as Record<number, District[]>)
  }, [filteredData.districts])

  const locationsByDistrict = useMemo(() => {
    return filteredData.locations.reduce((acc, location) => {
      if (!acc[location.district_id]) acc[location.district_id] = []
      acc[location.district_id].push(location)
      return acc
    }, {} as Record<number, Location[]>)
  }, [filteredData.locations])

  // Toggle functions
  const toggleCompany = (id: number) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedCompanies(newExpanded)
  }

  const toggleDivision = (id: number) => {
    const newExpanded = new Set(expandedDivisions)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedDivisions(newExpanded)
  }

  const toggleRegion = (id: number) => {
    const newExpanded = new Set(expandedRegions)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedRegions(newExpanded)
  }

  const toggleMarket = (id: number) => {
    const newExpanded = new Set(expandedMarkets)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedMarkets(newExpanded)
  }

  const toggleDistrict = (id: number) => {
    const newExpanded = new Set(expandedDistricts)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedDistricts(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Top Level Actions */}
      {canEdit && (
        <div className="bg-white shadow rounded-lg px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organization/companies/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add Company
            </Link>
            <Link
              href="/organization/divisions/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add Division
            </Link>
            <Link
              href="/organization/regions/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add Region
            </Link>
            <Link
              href="/organization/markets/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add Market
            </Link>
            <Link
              href="/organization/districts/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add District
            </Link>
            <Link
              href="/locations/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>Add Location
            </Link>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'active'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'all'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Organizational Hierarchy
          </h3>
          
          <div className="space-y-3">
            {filteredData.companies.map(company => {
              const divisions = divisionsByCompany[company.company_id] || []
              const divisionCount = divisions.length
              const isExpanded = expandedCompanies.has(company.company_id)

              return (
                <div key={company.company_id} className="border rounded-lg">
                  <div 
                    className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCompany(company.company_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-gray-400`}></i>
                        <i className="fas fa-building-flag text-purple-600"></i>
                        <span className="font-medium text-gray-900">{company.name}</span>
                        <span className="text-sm text-gray-500">({divisionCount} divisions)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/organization/companies/${company.company_id}`}
                          className="text-sm text-alliance-navy hover:text-alliance-navy-dark"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        {canEdit && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Link
                              href={`/organization/companies/${company.company_id}/edit`}
                              className="text-sm text-alliance-navy hover:text-alliance-navy-dark"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link
                              href={`/organization/divisions/new?company_id=${company.company_id}`}
                              className="text-sm text-alliance-blue hover:text-alliance-navy"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Add Division
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && divisions.length > 0 && (
                    <div className="px-4 py-2 space-y-2">
                      {divisions.map(division => {
                        const regions = regionsByDivision[division.division_id] || []
                        const regionCount = regions.length
                        const isDivExpanded = expandedDivisions.has(division.division_id)

                        return (
                          <div key={division.division_id} className="ml-6 border-l-2 border-gray-200 pl-4">
                            <div 
                              className="cursor-pointer hover:bg-gray-50 py-2"
                              onClick={() => toggleDivision(division.division_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <i className={`fas fa-chevron-${isDivExpanded ? 'down' : 'right'} text-gray-400`}></i>
                                  <i className="fas fa-building-user text-indigo-600"></i>
                                  <span className="font-medium">{division.name}</span>
                                  {division.code && <span className="text-xs text-gray-500">({division.code})</span>}
                                  <span className="text-sm text-gray-500">({regionCount} regions)</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                  {division.director && (
                                    <span className="text-gray-500">Dir: {division.director.first_name} {division.director.last_name}</span>
                                  )}
                                  <Link
                                    href={`/organization/divisions/${division.division_id}`}
                                    className="text-alliance-navy hover:text-alliance-navy-dark"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View
                                  </Link>
                                  {canEdit && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <Link
                                        href={`/organization/divisions/${division.division_id}/edit`}
                                        className="text-alliance-navy hover:text-alliance-navy-dark"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Edit
                                      </Link>
                                      <span className="text-gray-300">|</span>
                                      <Link
                                        href={`/organization/regions/new?division_id=${division.division_id}`}
                                        className="text-alliance-blue hover:text-alliance-navy"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Add Region
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isDivExpanded && regions.length > 0 && (
                              <div className="ml-6 space-y-2">
                                {regions.map(region => {
                                  const markets = marketsByRegion[region.region_id] || []
                                  const isRegExpanded = expandedRegions.has(region.region_id)

                                  return (
                                    <div key={region.region_id} className="border-l-2 border-gray-200 pl-4">
                                      <div 
                                        className="cursor-pointer hover:bg-gray-50 py-2"
                                        onClick={() => toggleRegion(region.region_id)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <i className={`fas fa-chevron-${isRegExpanded ? 'down' : 'right'} text-gray-400`}></i>
                                            <i className="fas fa-map text-blue-600"></i>
                                            <span className="font-medium">{region.name}</span>
                                            <span className="text-sm text-gray-500">({markets.length} markets)</span>
                                          </div>
                                          <div className="flex items-center space-x-3 text-sm">
                                            {(region.director || region.manager) && (
                                              <span className="text-gray-500">
                                                Mgr: {region.director?.first_name || region.manager?.first_name} {region.director?.last_name || region.manager?.last_name}
                                              </span>
                                            )}
                                            <Link
                                              href={`/organization/regions/${region.region_id}`}
                                              className="text-alliance-navy hover:text-alliance-navy-dark"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              View
                                            </Link>
                                            {canEdit && (
                                              <>
                                                <span className="text-gray-300">|</span>
                                                <Link
                                                  href={`/organization/regions/${region.region_id}/edit`}
                                                  className="text-alliance-navy hover:text-alliance-navy-dark"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Edit
                                                </Link>
                                                <span className="text-gray-300">|</span>
                                                <Link
                                                  href={`/organization/markets/new?region_id=${region.region_id}`}
                                                  className="text-alliance-blue hover:text-alliance-navy"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Add Market
                                                </Link>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {isRegExpanded && markets.length > 0 && (
                                        <div className="ml-6 space-y-2">
                                          {markets.map(market => {
                                            const districts = districtsByMarket[market.market_id] || []
                                            const isMarketExpanded = expandedMarkets.has(market.market_id)

                                            return (
                                              <div key={market.market_id} className="border-l-2 border-gray-200 pl-4">
                                                <div 
                                                  className="cursor-pointer hover:bg-gray-50 py-2"
                                                  onClick={() => toggleMarket(market.market_id)}
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                      <i className={`fas fa-chevron-${isMarketExpanded ? 'down' : 'right'} text-gray-400`}></i>
                                                      <i className="fas fa-store text-green-600"></i>
                                                      <span className="font-medium">{market.name}</span>
                                                      <span className="text-sm text-gray-500">({districts.length} districts)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-sm">
                                                      {market.manager && (
                                                        <span className="text-gray-500">
                                                          Mgr: {market.manager.first_name} {market.manager.last_name}
                                                        </span>
                                                      )}
                                                      <Link
                                                        href={`/organization/markets/${market.market_id}`}
                                                        className="text-alliance-navy hover:text-alliance-navy-dark"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        View
                                                      </Link>
                                                      {canEdit && (
                                                        <>
                                                          <span className="text-gray-300">|</span>
                                                          <Link
                                                            href={`/organization/markets/${market.market_id}/edit`}
                                                            className="text-alliance-navy hover:text-alliance-navy-dark"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            Edit
                                                          </Link>
                                                          <span className="text-gray-300">|</span>
                                                          <Link
                                                            href={`/organization/districts/new?market_id=${market.market_id}`}
                                                            className="text-alliance-blue hover:text-alliance-navy"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            Add District
                                                          </Link>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {isMarketExpanded && districts.length > 0 && (
                                                  <div className="ml-6 space-y-2">
                                                    {districts.map(renderDistrict)}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  function renderDistrict(district: District) {
    const locations = locationsByDistrict[district.district_id] || []
    const isExpanded = expandedDistricts.has(district.district_id)

    return (
      <div key={district.district_id} className="border-l-2 border-gray-200 pl-4">
        <div 
          className="cursor-pointer hover:bg-gray-50 py-2"
          onClick={() => toggleDistrict(district.district_id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-gray-400`}></i>
              <i className="fas fa-map-pin text-orange-600"></i>
              <span className="font-medium">{district.name}</span>
              <span className="text-sm text-gray-500">({locations.length} locations)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              {district.manager && (
                <span className="text-gray-500">Mgr: {district.manager.first_name} {district.manager.last_name}</span>
              )}
              <Link
                href={`/organization/districts/${district.district_id}`}
                className="text-alliance-navy hover:text-alliance-navy-dark"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </Link>
              {canEdit && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/organization/districts/${district.district_id}/edit`}
                    className="text-alliance-navy hover:text-alliance-navy-dark"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/locations/new?district_id=${district.district_id}`}
                    className="text-alliance-blue hover:text-alliance-navy"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Add Location
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {isExpanded && locations.length > 0 && (
          <div className="ml-6 space-y-1">
            {locations.map(location => (
              <div key={location.location_id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-building text-gray-600"></i>
                  <span className="text-sm">
                    {location.name} {location.store_number && `(#${location.store_number})`}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  {location.manager && (
                    <span className="text-gray-500">
                      Mgr: {location.manager.first_name} {location.manager.last_name}
                    </span>
                  )}
                  <Link
                    href={`/locations/${location.location_id}`}
                    className="text-alliance-navy hover:text-alliance-navy-dark"
                  >
                    View
                  </Link>
                  {canEdit && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/locations/${location.location_id}/edit`}
                        className="text-alliance-navy hover:text-alliance-navy-dark"
                      >
                        Edit
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}