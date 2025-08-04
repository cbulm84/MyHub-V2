'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import ModernPagination from './ModernPagination'

type Employee = Database['public']['Tables']['employees']['Row']
type EmployeeWithDetails = Employee & {
  user_types: { name: string; description: string } | null
  current_assignments: Array<{
    employee_id?: number
    location_id: number
    is_current?: boolean
    is_primary?: boolean
    assignment_type?: string
    start_date?: string
    locations: { name: string; store_number?: string } | null
    job_titles: { name: string } | null
  }> | null
}

interface EmployeeSearchFilterProps {
  employees: EmployeeWithDetails[]
  canEdit: boolean
  currentUserRole: string | null
}

type SortField = 'name' | 'employee_id' | 'role' | 'location' | 'hire_date' | 'status'
type SortDirection = 'asc' | 'desc'

export default function EmployeeSearchFilter({ employees, canEdit, currentUserRole }: EmployeeSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(emp => {
      const search = searchTerm.toLowerCase()
      const primaryAssignment = emp.current_assignments?.find(a => a.is_primary) || emp.current_assignments?.[0]
      
      const matchesSearch = (
        // Basic employee info
        emp.first_name.toLowerCase().includes(search) ||
        emp.last_name.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.username?.toLowerCase().includes(search) ||
        emp.employee_number?.toLowerCase().includes(search) ||
        emp.mobile_phone?.includes(searchTerm) ||
        emp.employee_id.toString().includes(searchTerm) ||
        
        // Dates (formatted as they appear in UI)
        new Date(emp.hire_date).toLocaleDateString().includes(search) ||
        new Date(emp.hire_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }).toLowerCase().includes(search) ||
        new Date(emp.hire_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }).toLowerCase().includes(search) ||
        
        // User types/roles
        emp.user_types?.name?.toLowerCase().includes(search) ||
        emp.user_types?.description?.toLowerCase().includes(search) ||
        
        // Location information
        primaryAssignment?.locations?.name?.toLowerCase().includes(search) ||
        primaryAssignment?.locations?.store_number?.toString().includes(search) ||
        (primaryAssignment?.locations?.store_number && `store ${primaryAssignment.locations.store_number}`.includes(search)) ||
        (primaryAssignment?.locations?.store_number && `#${primaryAssignment.locations.store_number}`.includes(search)) ||
        
        // Job title/position
        primaryAssignment?.job_titles?.name?.toLowerCase().includes(search) ||
        
        // Assignment type
        primaryAssignment?.assignment_type?.toLowerCase().includes(search) ||
        (primaryAssignment?.is_primary && 'primary'.includes(search)) ||
        (!primaryAssignment?.is_primary && 'secondary'.includes(search)) ||
        
        // Assignment start date
        (primaryAssignment?.start_date && new Date(primaryAssignment.start_date).toLocaleDateString().includes(search)) ||
        (primaryAssignment?.start_date && new Date(primaryAssignment.start_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }).toLowerCase().includes(search)) ||
        (primaryAssignment?.start_date && new Date(primaryAssignment.start_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }).toLowerCase().includes(search)) ||
        (primaryAssignment?.start_date && `since ${new Date(primaryAssignment.start_date).toLocaleDateString()}`.includes(search)) ||
        
        // Employment type
        (emp.is_full_time && ('full time'.includes(search) || 'fulltime'.includes(search))) ||
        (!emp.is_full_time && ('part time'.includes(search) || 'parttime'.includes(search))) ||
        
        // Leave status
        (emp.is_on_leave && ('on leave'.includes(search) || 'leave'.includes(search))) ||
        
        // Status
        (emp.is_active && 'active'.includes(search)) ||
        (!emp.is_active && 'inactive'.includes(search)) ||
        
        // Additional searchable fields
        'unassigned'.includes(search) && !primaryAssignment?.locations?.name ||
        'no position'.includes(search) && !primaryAssignment?.job_titles?.name ||
        'no username'.includes(search) && !emp.username
      )

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && emp.is_active) ||
        (statusFilter === 'inactive' && !emp.is_active)

      return matchesSearch && matchesStatus
    })

    // Sort based on selected field
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      const aPrimaryAssignment = a.current_assignments?.find(x => x.is_primary) || a.current_assignments?.[0]
      const bPrimaryAssignment = b.current_assignments?.find(x => x.is_primary) || b.current_assignments?.[0]

      switch (sortField) {
        case 'name':
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase()
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase()
          break
        case 'employee_id':
          aValue = a.employee_id
          bValue = b.employee_id
          break
        case 'role':
          aValue = a.user_types?.name?.toLowerCase() || 'zzz'
          bValue = b.user_types?.name?.toLowerCase() || 'zzz'
          break
        case 'location':
          aValue = aPrimaryAssignment?.locations?.name?.toLowerCase() || 'zzz'
          bValue = bPrimaryAssignment?.locations?.name?.toLowerCase() || 'zzz'
          break
        case 'hire_date':
          aValue = new Date(a.hire_date).getTime()
          bValue = new Date(b.hire_date).getTime()
          break
        case 'status':
          aValue = a.is_active ? 'active' : 'inactive'
          bValue = b.is_active ? 'active' : 'inactive'
          break
        default:
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase()
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [employees, searchTerm, statusFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredAndSortedEmployees.slice(
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

  return (
    <>
      {/* Search and Filters */}
      <div className="mt-6 space-y-4">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search employees by name, role, location, position, dates, status, or any visible information..."
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
            {filteredAndSortedEmployees.length} employee{filteredAndSortedEmployees.length !== 1 ? 's' : ''} found
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
        <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="shadow-lg ring-1 ring-alliance-blue ring-opacity-20 md:rounded-xl border border-gray-200">
              <div className="overflow-x-auto md:rounded-t-xl">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1B4278]">
                  <tr>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors whitespace-normal md:whitespace-nowrap"
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('employee_id')}
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors whitespace-normal md:whitespace-nowrap"
                    >
                      <div className="flex items-center">
                        <span className="hidden xl:inline">Employee #</span>
                        <span className="xl:hidden">Emp #</span>
                        {getSortIcon('employee_id')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      className="hidden lg:table-cell px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors"
                    >
                      <div className="flex items-center">
                        Role
                        {getSortIcon('role')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('location')}
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors whitespace-normal md:whitespace-nowrap"
                    >
                      <div className="flex items-center">
                        Location
                        {getSortIcon('location')}
                      </div>
                    </th>
                    <th className="hidden xl:table-cell px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider">
                      Position
                    </th>
                    <th 
                      onClick={() => handleSort('hire_date')}
                      className="hidden lg:table-cell px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors"
                    >
                      <div className="flex items-center">
                        Employment
                        {getSortIcon('hire_date')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-3 py-3 lg:px-4 lg:py-4 text-left text-xs lg:text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-blue transition-colors"
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
                  {paginatedEmployees.map((employee) => {
                    const primaryAssignment = employee.current_assignments?.find(a => a.is_primary) || employee.current_assignments?.[0]
                    return (
                      <tr key={employee.id} className="group hover:bg-alliance-navy transition-all duration-200">
                        <td className="px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-white break-words">
                              {employee.first_name} {employee.last_name}
                            </span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-200">
                              Hired: {new Date(employee.hire_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-white break-words">{employee.employee_number || `ID: ${employee.employee_id}`}</span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-200 break-words">{employee.username || 'No username'}</span>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-white break-words">
                              {employee.user_types?.description || 'N/A'}
                            </span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-200">
                              {employee.user_types?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-white break-words">
                              {primaryAssignment?.locations?.name || 'Unassigned'}
                            </span>
                            {primaryAssignment?.locations?.store_number && (
                              <span className="text-xs text-gray-500 group-hover:text-gray-200">
                                Store #{primaryAssignment.locations.store_number}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col">
                            {primaryAssignment?.job_titles?.name ? (
                              <>
                                <span className="font-medium text-gray-900 group-hover:text-white break-words">
                                  {primaryAssignment.job_titles.name}
                                </span>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    primaryAssignment.assignment_type === 'PRIMARY' || primaryAssignment.is_primary
                                      ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                                      : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                                  }`}>
                                    {primaryAssignment.assignment_type || (primaryAssignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                                  </span>
                                  {primaryAssignment.start_date && (
                                    <span className="text-xs text-gray-500 group-hover:text-gray-200 break-words">
                                      Since {new Date(primaryAssignment.start_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500 group-hover:text-gray-200">No position</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              employee.is_full_time 
                                ? 'bg-blue-100 text-blue-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                                : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                            }`}>
                              {employee.is_full_time ? 'Full Time' : 'Part Time'}
                            </span>
                            {employee.is_on_leave && (
                              <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-yellow-100 text-yellow-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white">
                                On Leave
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 lg:px-4 lg:py-4 text-xs lg:text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            employee.is_active 
                              ? 'bg-green-100 text-green-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                              : 'bg-red-100 text-red-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                          }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-3 pl-3 pr-4 sm:pr-6 text-right text-xs lg:text-sm font-medium">
                          <div className="flex justify-end space-x-1 lg:space-x-2">
                            <Link
                              href={`/employees/${employee.employee_id}`}
                              className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                            >
                              View
                            </Link>
                            {canEdit && (
                              <Link
                                href={`/employees/${employee.employee_id}/edit`}
                                className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-1.5 border border-transparent text-xs lg:text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                </table>
              </div>
              {paginatedEmployees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filteredAndSortedEmployees.length === 0 ? 'No employees found' : 'No employees on this page'}
                </div>
              )}
              
              {/* Integrated Pagination */}
              {filteredAndSortedEmployees.length > 0 && (
                <ModernPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAndSortedEmployees.length}
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
        {paginatedEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            {filteredAndSortedEmployees.length === 0 ? 'No employees found' : 'No employees on this page'}
          </div>
        ) : (
          paginatedEmployees.map((employee) => {
            const primaryAssignment = employee.current_assignments?.find(a => a.is_primary) || employee.current_assignments?.[0]
            return (
              <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {employee.employee_number || `ID: ${employee.employee_id}`}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Role</p>
                    <p className="text-gray-900">{employee.user_types?.description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Employment</p>
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold w-fit ${
                        employee.is_full_time 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.is_full_time ? 'Full Time' : 'Part Time'}
                      </span>
                      {employee.is_on_leave && (
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 w-fit">
                          On Leave
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Location</p>
                    <p className="text-gray-900">{primaryAssignment?.locations?.name || 'Unassigned'}</p>
                    {primaryAssignment?.locations?.store_number && (
                      <p className="text-xs text-gray-500">Store #{primaryAssignment.locations.store_number}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Position</p>
                    {primaryAssignment?.job_titles?.name ? (
                      <div>
                        <p className="text-gray-900">{primaryAssignment.job_titles.name}</p>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold mt-1 ${
                          primaryAssignment.assignment_type === 'PRIMARY' || primaryAssignment.is_primary
                            ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {primaryAssignment.assignment_type || (primaryAssignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-500">No position</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/employees/${employee.employee_id}`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                  >
                    View
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/employees/${employee.employee_id}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Modern Pagination for Mobile */}
        {filteredAndSortedEmployees.length > 0 && (
          <div className="mt-6">
            <ModernPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedEmployees.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>
    </>
  )
}