'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import ModernPagination from './ModernPagination'

type Location = Database['public']['Tables']['locations']['Row']
type LocationWithDetails = Location & {
  districts?: { 
    name: string
    manager?: {
      employee_id: number
      first_name: string
      last_name: string
    } | null
    regions?: { 
      name: string
      markets?: { 
        name: string 
      }
    }
  }
  manager?: {
    employee_id: number
    first_name: string
    last_name: string
  } | null
  employee_count?: number
}

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
        
        // Address and contact info
        (loc.address_line_1 && loc.address_line_1.toLowerCase().includes(search)) ||
        (loc.address_line_2 && loc.address_line_2.toLowerCase().includes(search)) ||
        (loc.city && loc.city.toLowerCase().includes(search)) ||
        (loc.state && loc.state.toLowerCase().includes(search)) ||
        (loc.zip_code && loc.zip_code.includes(searchTerm)) ||
        (loc.phone && loc.phone.includes(searchTerm)) ||
        
        // Hierarchy information
        (loc.districts?.name && loc.districts.name.toLowerCase().includes(search)) ||
        (loc.districts?.regions?.name && loc.districts.regions.name.toLowerCase().includes(search)) ||
        (loc.districts?.regions?.markets?.name && loc.districts.regions.markets.name.toLowerCase().includes(search)) ||
        
        // Manager information
        (loc.manager?.first_name && loc.manager.first_name.toLowerCase().includes(search)) ||
        (loc.manager?.last_name && loc.manager.last_name.toLowerCase().includes(search)) ||
        (loc.districts?.manager?.first_name && loc.districts.manager.first_name.toLowerCase().includes(search)) ||
        (loc.districts?.manager?.last_name && loc.districts.manager.last_name.toLowerCase().includes(search)) ||
        
        // Employee count
        (loc.employee_count && loc.employee_count.toString().includes(searchTerm)) ||
        
        // Status
        (loc.is_active && 'active'.includes(search)) ||
        (!loc.is_active && 'inactive'.includes(search)) ||
        
        // Store number variations
        (loc.store_number && `store ${loc.store_number}`.includes(search)) ||
        (loc.store_number && `#${loc.store_number}`.includes(search))
      )

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && loc.is_active) ||
        (statusFilter === 'inactive' && !loc.is_active)

      return matchesSearch && matchesStatus
    })

    // Sort by store number, then by name
    filtered.sort((a, b) => {
      if (a.store_number && b.store_number) {
        return a.store_number.localeCompare(b.store_number)
      }
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [locations, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredAndSortedLocations.length / itemsPerPage)
  const paginatedLocations = filteredAndSortedLocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newStatus)
    setCurrentPage(1) // Reset to first page
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mt-6 space-y-4">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search locations by name, store number, district, hierarchy, address, phone, or any visible information..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
              <button
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'active'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => handleStatusFilterChange('all')}
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

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            {filteredAndSortedLocations.length} location{filteredAndSortedLocations.length !== 1 ? 's' : ''} found
            {statusFilter !== 'all' && (
              <span className="ml-1">
                ({statusFilter === 'active' ? 'active' : 'inactive'} only)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="mt-8 flex-col hidden lg:flex">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow-lg ring-1 ring-alliance-blue ring-opacity-20 md:rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1B4278]">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Store #
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Manager
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      District/Region
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Employees
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Status
                    </th>
                    <th className="relative py-4 pl-3 pr-6">
                      <span className="sr-only text-white">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedLocations.map((location) => (
                    <tr key={location.id} className="group hover:bg-alliance-navy transition-all duration-200">
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 group-hover:text-white">
                        {location.store_number || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 group-hover:text-white">
                        {location.name}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {location.manager ? (
                          <div className="text-gray-900 group-hover:text-white">
                            {location.manager.first_name} {location.manager.last_name}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic group-hover:text-gray-200">No Manager</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {location.districts ? (
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-white">{location.districts.name}</div>
                            {location.districts.regions && (
                              <div className="text-xs text-gray-500 group-hover:text-gray-200">
                                {location.districts.regions.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic group-hover:text-gray-200">No District</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-900 group-hover:text-white">
                          {location.address_line_1 && (
                            <div className="text-sm">{location.address_line_1}</div>
                          )}
                          {location.city && location.state && (
                            <div className="text-xs text-gray-500 group-hover:text-gray-200">
                              {location.city}, {location.state} {location.zip_code}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className="font-medium text-gray-900 group-hover:text-white">{location.employee_count || 0}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : 'bg-red-100 text-red-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-4 pr-6 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/locations/${location.location_id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                          >
                            View
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/locations/${location.location_id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedLocations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filteredAndSortedLocations.length === 0 ? 'No locations found' : 'No locations on this page'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Pagination for Desktop */}
        {filteredAndSortedLocations.length > 0 && (
          <ModernPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedLocations.length}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Mobile Card Layout - Visible on mobile only */}
      <div className="mt-8 lg:hidden space-y-4">
        {paginatedLocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            {filteredAndSortedLocations.length === 0 ? 'No locations found' : 'No locations on this page'}
          </div>
        ) : (
          paginatedLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Store #{location.store_number || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    location.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Manager</p>
                  {location.manager ? (
                    <p className="text-gray-900">{location.manager.first_name} {location.manager.last_name}</p>
                  ) : (
                    <p className="text-gray-500 italic">No Manager</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Employees</p>
                  <p className="text-gray-900 font-medium">{location.employee_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">District</p>
                  <p className="text-gray-900">{location.districts?.name || 'No District'}</p>
                  {location.districts?.regions && (
                    <p className="text-xs text-gray-500">{location.districts.regions.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Address</p>
                  {location.address_line_1 ? (
                    <div>
                      <p className="text-gray-900 text-xs">{location.address_line_1}</p>
                      {location.city && location.state && (
                        <p className="text-xs text-gray-500">{location.city}, {location.state} {location.zip_code}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No Address</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/locations/${location.location_id}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                >
                  View
                </Link>
                {canEdit && (
                  <Link
                    href={`/locations/${location.location_id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))
        )}

        {/* Modern Pagination for Mobile */}
        {filteredAndSortedLocations.length > 0 && (
          <div className="mt-6">
            <ModernPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedLocations.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>
    </>
  )
}