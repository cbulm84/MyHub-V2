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
    markets?: { 
      name: string 
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

type SortField = 'store_number' | 'name' | 'manager' | 'district' | 'employees' | 'status'
type SortDirection = 'asc' | 'desc'

export default function LocationSearchFilterEnhanced({ locations, canEdit }: LocationSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedLocation, setSelectedLocation] = useState<LocationWithDetails | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="fas fa-sort text-gray-400 ml-2"></i>
    }
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up text-white ml-2"></i>
      : <i className="fas fa-sort-down text-white ml-2"></i>
  }

  const filteredAndSortedLocations = useMemo(() => {
    let filtered = locations.filter(loc => {
      const search = searchTerm.toLowerCase()
      
      const matchesSearch = (
        // Basic location info
        loc.name.toLowerCase().includes(search) ||
        (loc.store_number && loc.store_number.toLowerCase().includes(search)) ||
        loc.location_id.toString().includes(searchTerm) ||
        
        // Hierarchy information - District/Market only
        (loc.districts?.name && loc.districts.name.toLowerCase().includes(search)) ||
        (loc.districts?.markets?.name && loc.districts.markets.name.toLowerCase().includes(search)) ||
        
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

    // Sort based on selected field
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'store_number':
          aValue = a.store_number || ''
          bValue = b.store_number || ''
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'manager':
          aValue = a.manager ? `${a.manager.last_name} ${a.manager.first_name}`.toLowerCase() : 'zzz'
          bValue = b.manager ? `${b.manager.last_name} ${b.manager.first_name}`.toLowerCase() : 'zzz'
          break
        case 'district':
          aValue = a.districts?.name?.toLowerCase() || 'zzz'
          bValue = b.districts?.name?.toLowerCase() || 'zzz'
          break
        case 'employees':
          aValue = a.employee_count || 0
          bValue = b.employee_count || 0
          break
        case 'status':
          aValue = a.is_active ? 'active' : 'inactive'
          bValue = b.is_active ? 'active' : 'inactive'
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [locations, searchTerm, statusFilter, sortField, sortDirection])

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
            placeholder="Search locations by name, store number, district, market, manager, or any visible information..."
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
      <div className="mt-8 flex-col hidden md:flex">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-lg ring-1 ring-alliance-blue ring-opacity-20 md:rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1B4278]">
                  <tr>
                    <th 
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors whitespace-normal md:whitespace-nowrap"
                      onClick={() => handleSort('store_number')}
                    >
                      <div className="flex items-center">
                        <span className="hidden xl:inline">Store #</span>
                        <span className="xl:hidden">#</span>
                        {getSortIcon('store_number')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors whitespace-normal md:whitespace-nowrap"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="hidden lg:table-cell px-3 py-3 lg:px-6 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('manager')}
                    >
                      <div className="flex items-center">
                        Manager
                        {getSortIcon('manager')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors whitespace-normal md:whitespace-nowrap"
                      onClick={() => handleSort('district')}
                    >
                      <div className="flex items-center">
                        <span className="hidden xl:inline">District/Market</span>
                        <span className="xl:hidden">District</span>
                        {getSortIcon('district')}
                      </div>
                    </th>
                    <th 
                      className="hidden xl:table-cell px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('employees')}
                    >
                      <div className="flex items-center">
                        Employees
                        {getSortIcon('employees')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only text-white">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedLocations.map((location) => (
                    <tr key={location.id} className="group hover:bg-alliance-navy transition-all duration-200">
                      <td className="px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm text-gray-900 group-hover:text-white">
                        {location.store_number || 'N/A'}
                      </td>
                      <td className="px-3 py-3 lg:px-6 lg:py-4 text-xs lg:text-sm font-medium text-gray-900 group-hover:text-white">
                        <span className="block break-words">{location.name}</span>
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3 lg:px-6 lg:py-4 text-xs lg:text-sm">
                        {location.manager ? (
                          <div className="text-gray-900 group-hover:text-white break-words">
                            {location.manager.first_name} {location.manager.last_name}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic group-hover:text-gray-200">No Manager</span>
                        )}
                      </td>
                      <td className="px-3 py-3 lg:px-6 lg:py-4 text-xs lg:text-sm">
                        {location.districts ? (
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-white break-words">{location.districts.name}</div>
                            {location.districts.markets && (
                              <div className="text-xs text-gray-500 group-hover:text-gray-200 break-words">
                                {location.districts.markets.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic group-hover:text-gray-200">No District</span>
                        )}
                      </td>
                      <td className="hidden xl:table-cell px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm text-center">
                        <span className="font-medium text-gray-900 group-hover:text-white">{location.employee_count || 0}</span>
                      </td>
                      <td className="px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                        <span className={`inline-flex rounded-full px-2 lg:px-3 py-1 text-xs font-semibold ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : 'bg-red-100 text-red-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-3 pl-3 pr-4 sm:pr-6 text-right text-xs lg:text-sm font-medium">
                        <div className="flex justify-end space-x-1 lg:space-x-2">
                          <button
                            onClick={() => setSelectedLocation(location)}
                            className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                          >
                            View
                          </button>
                          {canEdit && (
                            <Link
                              href={`/locations/${location.location_id}`}
                              className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 border border-transparent text-xs lg:text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
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
              
              {/* Integrated Pagination */}
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
          </div>
        </div>
      </div>

      {/* Mobile Card Layout - Visible on mobile only */}
      <div className="mt-8 md:hidden space-y-4">
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
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium">District/Market</p>
                  <p className="text-gray-900">{location.districts?.name || 'No District'}</p>
                  {location.districts?.markets && (
                    <p className="text-xs text-gray-500">{location.districts.markets.name}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedLocation(location)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                >
                  View
                </button>
                {canEdit && (
                  <Link
                    href={`/locations/${location.location_id}`}
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

      {/* Location View Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedLocation(null)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedLocation.name}
                  </h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Store #</span>
                      <span className="text-sm text-gray-900">{selectedLocation.store_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        selectedLocation.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedLocation.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Manager</span>
                      <span className="text-sm text-gray-900">
                        {selectedLocation.manager 
                          ? `${selectedLocation.manager.first_name} ${selectedLocation.manager.last_name}`
                          : 'No Manager'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">District</span>
                      <span className="text-sm text-gray-900">{selectedLocation.districts?.name || 'No District'}</span>
                    </div>
                    {selectedLocation.districts?.markets && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Market</span>
                        <span className="text-sm text-gray-900">{selectedLocation.districts.markets.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Employees</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedLocation.employee_count || 0}</span>
                    </div>
                    {selectedLocation.phone && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Phone</span>
                        <span className="text-sm text-gray-900">{selectedLocation.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                {canEdit && (
                  <Link
                    href={`/locations/${selectedLocation.location_id}`}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-alliance-blue text-base font-medium text-white hover:bg-alliance-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Edit Location
                  </Link>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedLocation(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}