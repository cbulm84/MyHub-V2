'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'

type Employee = {
  employee_id: number
  first_name: string
  last_name: string
}

type Market = Database['public']['Tables']['markets']['Row'] & { 
  region_count: number
  manager?: Employee | null
}
type Region = Database['public']['Tables']['regions']['Row'] & { 
  markets?: { name: string } | null
  director?: Employee | null
}
type District = Database['public']['Tables']['districts']['Row'] & { 
  regions?: { name: string; markets?: { name: string } | null } | null
  location_count: number
  manager?: Employee | null
}
type Location = Pick<Database['public']['Tables']['locations']['Row'], 'location_id' | 'name' | 'store_number' | 'district_id'> & {
  manager?: Employee | null
}

interface OrganizationHierarchyProps {
  data: {
    markets: Market[]
    regions: Region[]
    districts: District[]
    locations: Location[]
    districtCounts: Record<number, number>
    locationCounts: Record<number, number>
  }
  canEdit: boolean
}

export default function OrganizationHierarchy({ data, canEdit }: OrganizationHierarchyProps) {
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter regions based on selected market
  const filteredRegions = selectedMarket
    ? data.regions.filter(r => r.market_id === selectedMarket)
    : data.regions

  // Filter districts based on selected region
  const filteredDistricts = selectedRegion
    ? data.districts.filter(d => d.region_id === selectedRegion)
    : selectedMarket
    ? data.districts.filter(d => {
        const region = data.regions.find(r => r.region_id === d.region_id)
        return region?.market_id === selectedMarket
      })
    : data.districts

  // Filter locations based on selected district
  const filteredLocations = selectedDistrict
    ? data.locations.filter(l => l.district_id === selectedDistrict)
    : []

  // Apply search filter
  const searchFilter = (items: any[], fields: string[]) => {
    if (!searchTerm) return items
    return items.filter(item =>
      fields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  const displayedMarkets = searchFilter(data.markets, ['name', 'market_id'])
  const displayedRegions = searchFilter(filteredRegions, ['name', 'region_id'])
  const displayedDistricts = searchFilter(filteredDistricts, ['name', 'district_id'])
  const displayedLocations = searchFilter(filteredLocations, ['name', 'store_number', 'location_id'])

  // Build org chart data based on selection
  const orgChartData = {
    selectedMarket: selectedMarket ? data.markets.find(m => m.market_id === selectedMarket) : null,
    selectedRegion: selectedRegion ? data.regions.find(r => r.region_id === selectedRegion) : null,
    selectedDistrict: selectedDistrict ? data.districts.find(d => d.district_id === selectedDistrict) : null,
    filteredRegions,
    filteredDistricts,
    filteredLocations
  }

  return (
    <div className="mt-6">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search across all levels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
        />
      </div>

      {/* Side by Side Layout: Cards on Left, Org Chart on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Side - Three Column Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Markets Column */}
        <div className="bg-white shadow-alliance rounded-lg p-4">
          <h2 className="text-lg font-semibold text-alliance-navy mb-4">
            Markets ({displayedMarkets.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayedMarkets.map((market) => (
              <div
                key={market.market_id}
                onClick={() => {
                  setSelectedMarket(market.market_id)
                  setSelectedRegion(null)
                  setSelectedDistrict(null)
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedMarket === market.market_id
                    ? 'bg-alliance-blue text-white'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{market.name}</div>
                    {market.manager && (
                      <div className={`text-sm mt-1 ${
                        selectedMarket === market.market_id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {market.manager.first_name} {market.manager.last_name}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedMarket === market.market_id ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {market.region_count} regions
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <Link
                    href={`/organization/market/${market.market_id}`}
                    className={`text-sm ${
                      selectedMarket === market.market_id 
                        ? 'text-blue-100 hover:text-white' 
                        : 'text-alliance-blue hover:text-alliance-navy'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/organization/market/${market.market_id}/edit`}
                      className={`text-sm ${
                        selectedMarket === market.market_id 
                          ? 'text-blue-100 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regions Column */}
        <div className="bg-white shadow-alliance rounded-lg p-4">
          <h2 className="text-lg font-semibold text-alliance-navy mb-4">
            Regions {selectedMarket && `(${displayedRegions.length})`}
          </h2>
          {selectedMarket ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayedRegions.map((region) => (
                <div
                  key={region.region_id}
                  onClick={() => {
                    setSelectedRegion(region.region_id)
                    setSelectedDistrict(null)
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRegion === region.region_id
                      ? 'bg-alliance-blue text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{region.name}</div>
                      {region.director && (
                        <div className={`text-sm mt-1 ${
                          selectedRegion === region.region_id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {region.director.first_name} {region.director.last_name}
                        </div>
                      )}
                    </div>
                    <div className={`text-sm ${
                      selectedRegion === region.region_id ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {data.districtCounts[region.region_id] || 0} districts
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Link
                      href={`/organization/region/${region.region_id}`}
                      className={`text-sm ${
                        selectedRegion === region.region_id 
                          ? 'text-blue-100 hover:text-white' 
                          : 'text-alliance-blue hover:text-alliance-navy'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/organization/region/${region.region_id}/edit`}
                        className={`text-sm ${
                          selectedRegion === region.region_id 
                            ? 'text-blue-100 hover:text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a market to view regions
            </p>
          )}
        </div>

        {/* Districts Column */}
        <div className="bg-white shadow-alliance rounded-lg p-4">
          <h2 className="text-lg font-semibold text-alliance-navy mb-4">
            Districts {selectedRegion && `(${displayedDistricts.length})`}
          </h2>
          {selectedRegion ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayedDistricts.map((district) => (
                <div
                  key={district.district_id}
                  onClick={() => setSelectedDistrict(district.district_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDistrict === district.district_id
                      ? 'bg-alliance-blue text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{district.name}</div>
                      {district.manager && (
                        <div className={`text-sm mt-1 ${
                          selectedDistrict === district.district_id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {district.manager.first_name} {district.manager.last_name}
                        </div>
                      )}
                    </div>
                    <div className={`text-sm ${
                      selectedDistrict === district.district_id ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {district.location_count} locations
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Link
                      href={`/organization/district/${district.district_id}`}
                      className={`text-sm ${
                        selectedDistrict === district.district_id 
                          ? 'text-blue-100 hover:text-white' 
                          : 'text-alliance-blue hover:text-alliance-navy'
                        }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/organization/district/${district.district_id}/edit`}
                        className={`text-sm ${
                          selectedDistrict === district.district_id 
                            ? 'text-blue-100 hover:text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a region to view districts
            </p>
          )}
        </div>
      </div>

      {/* Right Side - Org Chart Visualization */}
      <div className="bg-white shadow-alliance rounded-lg p-6">
        <h2 className="text-lg font-semibold text-alliance-navy mb-4">Organization Chart</h2>
        <div className="min-h-[500px] flex items-center justify-center">
          {selectedMarket ? (
            <div className="w-full">
              {/* Org Chart Tree */}
              <div className="flex flex-col items-center space-y-8">
                {/* Market Level */}
                {orgChartData.selectedMarket && (
                  <div className="text-center">
                    <div className="bg-alliance-blue text-white px-6 py-4 rounded-lg shadow-lg">
                      <div className="font-semibold text-lg">{orgChartData.selectedMarket.name}</div>
                      {orgChartData.selectedMarket.manager && (
                        <div className="text-sm mt-1 text-blue-100">
                          {orgChartData.selectedMarket.manager.first_name} {orgChartData.selectedMarket.manager.last_name}
                        </div>
                      )}
                    </div>
                    
                    {/* Vertical Line */}
                    {orgChartData.filteredRegions.length > 0 && (
                      <div className="w-0.5 h-8 bg-gray-300 mx-auto"></div>
                    )}
                  </div>
                )}

                {/* Region Level */}
                {orgChartData.filteredRegions.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {orgChartData.filteredRegions.map(region => (
                      <div key={region.region_id} className="text-center">
                        <div 
                          className={`px-4 py-3 rounded-lg shadow cursor-pointer transition-colors ${
                            selectedRegion === region.region_id
                              ? 'bg-alliance-navy text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedRegion(region.region_id)}
                        >
                          <div className="font-medium">{region.name}</div>
                          {region.director && (
                            <div className="text-xs mt-1">
                              {region.director.first_name} {region.director.last_name}
                            </div>
                          )}
                        </div>
                        
                        {/* Line to districts */}
                        {selectedRegion === region.region_id && orgChartData.filteredDistricts.length > 0 && (
                          <div className="w-0.5 h-6 bg-gray-300 mx-auto"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* District Level */}
                {selectedRegion && orgChartData.filteredDistricts.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {orgChartData.filteredDistricts.map(district => (
                      <div 
                        key={district.district_id}
                        className={`px-3 py-2 rounded-lg shadow cursor-pointer transition-colors text-sm ${
                          selectedDistrict === district.district_id
                            ? 'bg-alliance-green text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedDistrict(district.district_id)}
                      >
                        <div className="font-medium">{district.name}</div>
                        {district.manager && (
                          <div className="text-xs mt-0.5">
                            {district.manager.first_name} {district.manager.last_name}
                          </div>
                        )}
                        <div className="text-xs mt-1">
                          {district.location_count} locations
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location Count Summary */}
                {selectedDistrict && orgChartData.filteredLocations.length > 0 && (
                  <div className="mt-4 text-center">
                    <div className="bg-gray-50 px-6 py-3 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {orgChartData.filteredLocations.length} locations in selected district
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <i className="fas fa-sitemap text-4xl mb-4 text-gray-300"></i>
              <p>Select a market to view organization chart</p>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Locations List - Show when district is selected */}
      {selectedDistrict && (
        <div className="mt-6 bg-white shadow-alliance rounded-lg p-4">
          <h3 className="text-lg font-semibold text-alliance-navy mb-4">
            Locations in District ({displayedLocations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedLocations.map((location) => (
              <Link
                key={location.location_id}
                href={`/locations/${location.location_id}`}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-gray-500">
                  Store #{location.store_number}
                  {location.manager && (
                    <span> • {location.manager.first_name} {location.manager.last_name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}