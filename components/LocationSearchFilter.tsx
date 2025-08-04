'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { LocationWithDetails } from '@/types/extended'
import ModernPaginationSimple from './ModernPaginationSimple'

interface LocationSearchFilterProps {
  locations: LocationWithDetails[]
  canEdit: boolean
}

export default function LocationSearchFilter({ locations, canEdit }: LocationSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const filteredAndSortedLocations = useMemo(() => {
    let filtered = locations.filter(loc => {
      const search = searchTerm.toLowerCase()
      
      const matchesSearch = (
        // Basic location info
        loc.name.toLowerCase().includes(search) ||
        (loc.store_number && loc.store_number.toLowerCase().includes(search)) ||
        loc.location_id.toString().includes(searchTerm) ||
        
        // Address and contact info from joined addresses table
        (loc.addresses?.street_line1 && loc.addresses.street_line1.toLowerCase().includes(search)) ||
        (loc.addresses?.street_line2 && loc.addresses.street_line2.toLowerCase().includes(search)) ||
        (loc.addresses?.city && loc.addresses.city.toLowerCase().includes(search)) ||
        (loc.addresses?.state_province && loc.addresses.state_province.toLowerCase().includes(search)) ||
        (loc.addresses?.postal_code && loc.addresses.postal_code.includes(searchTerm)) ||
        (loc.addresses?.phone && loc.addresses.phone.includes(searchTerm)) ||
        
        // Hierarchy information
        (loc.districts?.name && loc.districts.name.toLowerCase().includes(search)) ||
        (loc.districts?.regions?.name && loc.districts.regions.name.toLowerCase().includes(search)) ||
        (loc.districts?.regions?.markets?.name && loc.districts.regions.markets.name.toLowerCase().includes(search)) ||
        
        // Manager information
        (loc.manager?.first_name && loc.manager.first_name.toLowerCase().includes(search)) ||
        (loc.manager?.last_name && loc.manager.last_name.toLowerCase().includes(search)) ||
        (loc.districts?.manager?.first_name && loc.districts.manager.first_name.toLowerCase().includes(search)) ||
        (loc.districts?.manager?.last_name && loc.districts.manager.last_name.toLowerCase().includes(search))
      )
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && loc.is_active) ||
        (statusFilter === 'inactive' && !loc.is_active)
      
      return matchesSearch && matchesStatus
    })
    
    return filtered.sort((a, b) => {
      // Sort by district, then location name
      if (a.districts?.name && b.districts?.name) {
        const districtCompare = a.districts.name.localeCompare(b.districts.name)
        if (districtCompare !== 0) return districtCompare
      }
      return a.name.localeCompare(b.name)
    })
  }, [locations, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredAndSortedLocations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLocations = filteredAndSortedLocations.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search locations
            </label>
            <input
              type="text"
              id="search"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name, store #, address, manager..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
            >
              <option value="all">All Locations</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">
              Per Page
            </label>
            <select
              id="perPage"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedLocations.length)} of{' '}
            {filteredAndSortedLocations.length} locations
          </p>
          {canEdit && (
            <Link
              href="/locations/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Location
            </Link>
          )}
        </div>
      </div>

      {/* Results */}
      {paginatedLocations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No locations found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {location.store_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-500">ID: {location.location_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {location.addresses ? (
                          <>
                            <p>{location.addresses.street_line1}</p>
                            {location.addresses.street_line2 && <p>{location.addresses.street_line2}</p>}
                            <p>
                              {location.addresses.city}, {location.addresses.state_province} {location.addresses.postal_code}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.manager ? (
                        <div className="text-sm text-gray-900">
                          {location.manager.first_name} {location.manager.last_name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No manager</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {location.districts?.name || '-'}
                        {location.districts?.regions?.name && (
                          <div className="text-xs text-gray-500">{location.districts.regions.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          location.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {location.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/locations/${location.location_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {canEdit && (
                        <>
                          <span className="mx-2 text-gray-300">|</span>
                          <Link
                            href={`/locations/${location.location_id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {paginatedLocations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">Store #{location.store_number || 'N/A'}</p>
                    </div>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        location.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {location.addresses && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{location.addresses.street_line1}</p>
                      {location.addresses.street_line2 && <p>{location.addresses.street_line2}</p>}
                      <p>
                        {location.addresses.city}, {location.addresses.state_province} {location.addresses.postal_code}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {location.manager && (
                      <div>
                        <span className="font-medium text-gray-700">Manager:</span>
                        <p className="text-gray-900">
                          {location.manager.first_name} {location.manager.last_name}
                        </p>
                      </div>
                    )}
                    {location.districts && (
                      <div>
                        <span className="font-medium text-gray-700">District:</span>
                        <p className="text-gray-900">{location.districts.name}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <Link
                      href={`/locations/${location.location_id}`}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/locations/${location.location_id}/edit`}
                        className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <ModernPaginationSimple
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}