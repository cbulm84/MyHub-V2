'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import dynamic from 'next/dynamic'

// Dynamically import the org chart to avoid SSR issues with react-flow
const OrganizationChart = dynamic(() => import('./OrganizationChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">
        <i className="fas fa-spinner fa-spin text-4xl mb-3"></i>
        <p className="text-sm">Loading organization chart...</p>
      </div>
    </div>
  )
})

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

type ViewLevel = 'markets' | 'regions' | 'districts' | 'locations'
type ViewMode = 'drill-down' | 'reverse-path'

export default function OrganizationHierarchyV2({ data, canEdit }: OrganizationHierarchyProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('drill-down')
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('markets')
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = []
    
    if (selectedMarket) {
      const market = data.markets.find(m => m.market_id === selectedMarket)
      if (market) path.push({ type: 'market', name: market.name, id: selectedMarket })
    }
    
    if (selectedRegion) {
      const region = data.regions.find(r => r.region_id === selectedRegion)
      if (region) path.push({ type: 'region', name: region.name, id: selectedRegion })
    }
    
    if (selectedDistrict) {
      const district = data.districts.find(d => d.district_id === selectedDistrict)
      if (district) path.push({ type: 'district', name: district.name, id: selectedDistrict })
    }
    
    return path
  }, [selectedMarket, selectedRegion, selectedDistrict, data])

  // Filter data based on selection
  const filteredData = useMemo(() => {
    let items: any[] = []
    
    switch (currentLevel) {
      case 'markets':
        items = data.markets
        break
      case 'regions':
        items = selectedMarket 
          ? data.regions.filter(r => r.market_id === selectedMarket)
          : data.regions
        break
      case 'districts':
        items = selectedRegion
          ? data.districts.filter(d => d.region_id === selectedRegion)
          : selectedMarket
          ? data.districts.filter(d => {
              const region = data.regions.find(r => r.region_id === d.region_id)
              return region?.market_id === selectedMarket
            })
          : data.districts
        break
      case 'locations':
        items = selectedDistrict
          ? data.locations.filter(l => l.district_id === selectedDistrict)
          : []
        break
    }

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.store_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return items
  }, [currentLevel, selectedMarket, selectedRegion, selectedDistrict, searchTerm, data])

  // Handle card selection with animation
  const handleCardSelect = (level: ViewLevel, id: number) => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    switch (level) {
      case 'markets':
        setSelectedMarket(id)
        setSelectedRegion(null)
        setSelectedDistrict(null)
        setSelectedLocation(null)
        setCurrentLevel('regions')
        break
      case 'regions':
        setSelectedRegion(id)
        setSelectedDistrict(null)
        setSelectedLocation(null)
        setCurrentLevel('districts')
        break
      case 'districts':
        setSelectedDistrict(id)
        setSelectedLocation(null)
        setCurrentLevel('locations')
        break
      case 'locations':
        setSelectedLocation(id)
        break
    }
  }

  // Navigate back via breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    if (index === -1) {
      // Go to root
      setSelectedMarket(null)
      setSelectedRegion(null)
      setSelectedDistrict(null)
      setSelectedLocation(null)
      setCurrentLevel('markets')
    } else {
      const item = breadcrumbPath[index]
      switch (item.type) {
        case 'market':
          setSelectedRegion(null)
          setSelectedDistrict(null)
          setSelectedLocation(null)
          setCurrentLevel('regions')
          break
        case 'region':
          setSelectedDistrict(null)
          setSelectedLocation(null)
          setCurrentLevel('districts')
          break
        case 'district':
          setSelectedLocation(null)
          setCurrentLevel('locations')
          break
      }
    }
  }

  // Get stats for cards
  const getCardStats = (level: ViewLevel, item: any) => {
    switch (level) {
      case 'markets':
        const regionCount = data.regions.filter(r => r.market_id === item.market_id).length
        const totalLocations = data.districts
          .filter(d => {
            const region = data.regions.find(r => r.region_id === d.region_id)
            return region?.market_id === item.market_id
          })
          .reduce((sum, d) => sum + (data.locationCounts[d.district_id] || 0), 0)
        return { primary: `${regionCount} regions`, secondary: `${totalLocations} locations` }
      
      case 'regions':
        const districtCount = data.districtCounts[item.region_id] || 0
        const regionLocations = data.districts
          .filter(d => d.region_id === item.region_id)
          .reduce((sum, d) => sum + (data.locationCounts[d.district_id] || 0), 0)
        return { primary: `${districtCount} districts`, secondary: `${regionLocations} locations` }
      
      case 'districts':
        return { primary: `${item.location_count} locations`, secondary: item.manager ? `${item.manager.first_name} ${item.manager.last_name}` : 'No manager' }
      
      case 'locations':
        return { primary: `Store #${item.store_number}`, secondary: item.manager ? `${item.manager.first_name} ${item.manager.last_name}` : 'No manager' }
    }
  }

  // Render card with enhanced content
  const renderCard = (level: ViewLevel, item: any) => {
    const isSelected = 
      (level === 'markets' && item.market_id === selectedMarket) ||
      (level === 'regions' && item.region_id === selectedRegion) ||
      (level === 'districts' && item.district_id === selectedDistrict) ||
      (level === 'locations' && item.location_id === selectedLocation)
    
    const stats = getCardStats(level, item)
    const id = item.market_id || item.region_id || item.district_id || item.location_id

    return (
      <div
        key={id}
        onClick={() => handleCardSelect(level, id)}
        className={`
          relative p-4 rounded-lg cursor-pointer transition-all duration-300 transform
          ${isSelected 
            ? 'bg-alliance-blue text-white shadow-lg scale-105' 
            : 'bg-white border border-gray-200 hover:border-alliance-blue hover:shadow-md hover:scale-102'
          }
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>

        {/* Icon based on level */}
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-alliance-blue'}`}>
            {level === 'markets' && <i className="fas fa-globe text-2xl" />}
            {level === 'regions' && <i className="fas fa-map text-2xl" />}
            {level === 'districts' && <i className="fas fa-city text-2xl" />}
            {level === 'locations' && <i className="fas fa-store text-2xl" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
            
            {/* Manager/Director info */}
            {(item.manager || item.director) && (
              <p className={`text-sm mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                <i className="fas fa-user-tie mr-1" />
                {(item.manager || item.director).first_name} {(item.manager || item.director).last_name}
              </p>
            )}

            {/* Stats */}
            <div className={`mt-2 space-y-1 text-sm ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
              <p><i className="fas fa-chart-bar mr-1" /> {stats.primary}</p>
              {stats.secondary && <p><i className="fas fa-info-circle mr-1" /> {stats.secondary}</p>}
            </div>

            {/* Actions */}
            <div className="mt-3 flex space-x-2">
              <Link
                href={`/organization/${level.slice(0, -1)}/${id}`}
                onClick={(e) => e.stopPropagation()}
                className={`text-xs px-2 py-1 rounded ${
                  isSelected 
                    ? 'bg-white/20 text-white hover:bg-white/30' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-eye mr-1" />View
              </Link>
              {canEdit && (
                <Link
                  href={`/organization/${level.slice(0, -1)}/${id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-2 py-1 rounded ${
                    isSelected 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-edit mr-1" />Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {/* Header with view mode toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className="text-gray-600 hover:text-alliance-blue transition-colors"
            >
              <i className="fas fa-home" />
            </button>
            {breadcrumbPath.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <i className="fas fa-chevron-right text-gray-400 text-xs" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className="text-gray-600 hover:text-alliance-blue transition-colors font-medium"
                >
                  {item.name}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('drill-down')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'drill-down' 
                ? 'bg-white text-alliance-blue shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className="fas fa-sitemap mr-1" />
            Drill Down
          </button>
          <button
            onClick={() => setViewMode('reverse-path')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'reverse-path' 
                ? 'bg-white text-alliance-blue shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className="fas fa-route mr-1" />
            Reverse Path
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${currentLevel}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alliance-blue focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Main content area - Stacked layout */}
      <div className="space-y-6">
        {/* Progressive drill-down cards OR Reverse path view */}
        <div>
          {viewMode === 'drill-down' ? (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                {currentLevel}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredData.length} items)
                </span>
              </h2>

              <div className={`
                grid gap-4
                ${currentLevel === 'locations' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
                transition-all duration-300
              `}>
                {filteredData.map(item => renderCard(currentLevel, item))}
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-3" />
                  <p>No {currentLevel} found</p>
                </div>
              )}
            </div>
          ) : (
            <ReversePathView 
              data={data}
              onSelectPath={(market, region, district, location) => {
                setSelectedMarket(market)
                setSelectedRegion(region)
                setSelectedDistrict(district)
                setSelectedLocation(location)
                setViewMode('drill-down')
                setCurrentLevel(location ? 'locations' : district ? 'districts' : region ? 'regions' : 'markets')
              }}
            />
          )}
        </div>

        {/* Full Organization Chart */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Organization Chart
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Interactive view • Scroll to zoom • Drag to pan
              </p>
            </div>
            
            <div style={{ height: '700px' }}>
              <OrganizationChart
                data={{
                  markets: data.markets,
                  regions: data.regions,
                  districts: data.districts,
                  districtCounts: data.districtCounts
                }}
                selectedMarket={selectedMarket}
                selectedRegion={selectedRegion}
                selectedDistrict={selectedDistrict}
                onNodeClick={(type, id) => {
                  switch (type) {
                    case 'market':
                      handleCardSelect('markets', id)
                      break
                    case 'region':
                      handleCardSelect('regions', id)
                      break
                    case 'district':
                      handleCardSelect('districts', id)
                      break
                  }
                }}
              />
            </div>

            {/* Chart Legend */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-alliance-blue rounded mr-1"></div>
                    <span>Markets</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-alliance-navy rounded mr-1"></div>
                    <span>Regions</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-alliance-green rounded mr-1"></div>
                    <span>Districts</span>
                  </div>
                </div>
                <div className="text-gray-500">
                  {data.locations.length} total locations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reverse Path View Component
function ReversePathView({ 
  data, 
  onSelectPath 
}: { 
  data: OrganizationHierarchyProps['data']
  onSelectPath: (market: number | null, region: number | null, district: number | null, location: number | null) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'locations' | 'employees'>('all')

  // Search across all entities
  const searchResults = useMemo(() => {
    if (!searchTerm) return []

    const results: any[] = []
    const term = searchTerm.toLowerCase()

    // Search locations
    if (selectedType === 'all' || selectedType === 'locations') {
      data.locations.forEach(location => {
        if (
          location.name.toLowerCase().includes(term) ||
          location.store_number?.toLowerCase().includes(term)
        ) {
          const district = data.districts.find(d => d.district_id === location.district_id)
          const region = district ? data.regions.find(r => r.region_id === district.region_id) : null
          const market = region ? data.markets.find(m => m.market_id === region.market_id) : null

          results.push({
            type: 'location',
            item: location,
            path: {
              market,
              region,
              district,
              location
            }
          })
        }
      })
    }

    // Search districts
    data.districts.forEach(district => {
      if (district.name.toLowerCase().includes(term)) {
        const region = data.regions.find(r => r.region_id === district.region_id)
        const market = region ? data.markets.find(m => m.market_id === region.market_id) : null

        results.push({
          type: 'district',
          item: district,
          path: {
            market,
            region,
            district,
            location: null
          }
        })
      }
    })

    return results.slice(0, 20) // Limit results
  }, [searchTerm, selectedType, data])

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Reverse Path Search
        <span className="text-sm font-normal text-gray-500 ml-2">
          Find entities and see their reporting structure
        </span>
      </h2>

      {/* Search controls */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for locations, districts, or employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alliance-blue focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-3.5 text-gray-400" />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-alliance-blue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('locations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'locations'
                ? 'bg-alliance-blue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-store mr-1" />
            Locations Only
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchTerm && (
        <div className="space-y-4">
          {searchResults.length > 0 ? (
            searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => onSelectPath(
                  result.path.market?.market_id || null,
                  result.path.region?.region_id || null,
                  result.path.district?.district_id || null,
                  result.path.location?.location_id || null
                )}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {result.type === 'location' && <i className="fas fa-store text-alliance-blue text-xl" />}
                    {result.type === 'district' && <i className="fas fa-city text-alliance-blue text-xl" />}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {result.item.name}
                      {result.item.store_number && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          Store #{result.item.store_number}
                        </span>
                      )}
                    </h4>

                    {/* Path visualization */}
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      {result.path.market && (
                        <>
                          <span className="font-medium">{result.path.market.name}</span>
                          <i className="fas fa-chevron-right mx-2 text-gray-400 text-xs" />
                        </>
                      )}
                      {result.path.region && (
                        <>
                          <span className="font-medium">{result.path.region.name}</span>
                          <i className="fas fa-chevron-right mx-2 text-gray-400 text-xs" />
                        </>
                      )}
                      {result.path.district && (
                        <>
                          <span className="font-medium">{result.path.district.name}</span>
                          {result.path.location && (
                            <i className="fas fa-chevron-right mx-2 text-gray-400 text-xs" />
                          )}
                        </>
                      )}
                      {result.path.location && (
                        <span className="font-medium">{result.path.location.name}</span>
                      )}
                    </div>

                    {/* Manager info */}
                    {result.item.manager && (
                      <div className="mt-1 text-sm text-gray-500">
                        <i className="fas fa-user-tie mr-1" />
                        {result.item.manager.first_name} {result.item.manager.last_name}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <i className="fas fa-arrow-right text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-search text-3xl mb-3" />
              <p>No results found for &ldquo;{searchTerm}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {!searchTerm && (
        <div className="text-center py-12 text-gray-500">
          <i className="fas fa-route text-4xl mb-3" />
          <p>Start typing to search the organization</p>
          <p className="text-sm mt-2">Find any location or district and see its complete reporting path</p>
        </div>
      )}
    </div>
  )
}