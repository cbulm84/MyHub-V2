'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import ModernPagination from './ModernPagination'

type Assignment = Database['public']['Tables']['employee_assignments']['Row'] & {
  employees: {
    employee_id: number
    first_name: string
    last_name: string
    email: string
    employee_number: string | null
  }
  locations: {
    location_id: number
    name: string
    store_number: string | null
  }
  job_titles: {
    job_title_id: number
    name: string
  }
  supervisor: {
    employee_id: number
    first_name: string
    last_name: string
  } | null
}

interface AssignmentSearchFilterProps {
  assignments: Assignment[]
  canEdit: boolean
  currentUserRole: string | null
}

type SortField = 'employee' | 'location' | 'position' | 'type' | 'start_date' | 'status'
type SortDirection = 'asc' | 'desc'

export default function AssignmentSearchFilter({ assignments, canEdit, currentUserRole }: AssignmentSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'past'>('current')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<SortField>('start_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments.filter(assignment => {
      const search = searchTerm.toLowerCase()
      
      const matchesSearch = (
        // Employee information
        assignment.employees.first_name.toLowerCase().includes(search) ||
        assignment.employees.last_name.toLowerCase().includes(search) ||
        assignment.employees.email.toLowerCase().includes(search) ||
        assignment.employees.employee_number?.toLowerCase().includes(search) ||
        assignment.employee_id.toString().includes(searchTerm) ||
        
        // Location information
        assignment.locations.name.toLowerCase().includes(search) ||
        assignment.locations.store_number?.toLowerCase().includes(search) ||
        (assignment.locations.store_number && `store ${assignment.locations.store_number}`.includes(search)) ||
        (assignment.locations.store_number && `#${assignment.locations.store_number}`.includes(search)) ||
        
        // Position information
        assignment.job_titles.name.toLowerCase().includes(search) ||
        
        // Supervisor information
        (assignment.supervisor?.first_name && assignment.supervisor.first_name.toLowerCase().includes(search)) ||
        (assignment.supervisor?.last_name && assignment.supervisor.last_name.toLowerCase().includes(search)) ||
        
        // Assignment type
        assignment.assignment_type?.toLowerCase().includes(search) ||
        (assignment.is_primary && 'primary'.includes(search)) ||
        (!assignment.is_primary && 'secondary'.includes(search)) ||
        ('temporary'.includes(search) && assignment.assignment_type === 'TEMPORARY') ||
        ('training'.includes(search) && assignment.assignment_type === 'TRAINING') ||
        
        // Dates
        new Date(assignment.start_date).toLocaleDateString().includes(search) ||
        new Date(assignment.start_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }).toLowerCase().includes(search) ||
        (assignment.end_date && new Date(assignment.end_date).toLocaleDateString().includes(search)) ||
        
        // Status
        (assignment.is_current && 'current'.includes(search)) ||
        (!assignment.is_current && 'past'.includes(search)) ||
        (!assignment.is_current && 'ended'.includes(search))
      )

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'current' && assignment.is_current) ||
        (statusFilter === 'past' && !assignment.is_current)

      return matchesSearch && matchesStatus
    })

    // Sort based on selected field
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'employee':
          aValue = `${a.employees.last_name} ${a.employees.first_name}`.toLowerCase()
          bValue = `${b.employees.last_name} ${b.employees.first_name}`.toLowerCase()
          break
        case 'location':
          aValue = a.locations.name.toLowerCase()
          bValue = b.locations.name.toLowerCase()
          break
        case 'position':
          aValue = a.job_titles.name.toLowerCase()
          bValue = b.job_titles.name.toLowerCase()
          break
        case 'type':
          aValue = a.assignment_type || (a.is_primary ? 'PRIMARY' : 'SECONDARY')
          bValue = b.assignment_type || (b.is_primary ? 'PRIMARY' : 'SECONDARY')
          break
        case 'start_date':
          aValue = new Date(a.start_date).getTime()
          bValue = new Date(b.start_date).getTime()
          break
        case 'status':
          aValue = a.is_current ? 'current' : 'past'
          bValue = b.is_current ? 'current' : 'past'
          break
        default:
          aValue = new Date(a.start_date).getTime()
          bValue = new Date(b.start_date).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [assignments, searchTerm, statusFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage)
  const paginatedAssignments = filteredAndSortedAssignments.slice(
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

  const handleStatusFilterChange = (newStatus: 'all' | 'current' | 'past') => {
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
            placeholder="Search assignments by employee, location, position, supervisor, dates, type, or any visible information..."
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
                onClick={() => handleStatusFilterChange('current')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'current'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => handleStatusFilterChange('past')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  statusFilter === 'past'
                    ? 'bg-white text-alliance-blue shadow-sm border border-alliance-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Past
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
            {filteredAndSortedAssignments.length} assignment{filteredAndSortedAssignments.length !== 1 ? 's' : ''} found
            {statusFilter !== 'all' && (
              <span className="ml-1">
                ({statusFilter === 'current' ? 'current' : 'past'} only)
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
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('employee')}
                    >
                      Employee {getSortIcon('employee')}
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('location')}
                    >
                      Location {getSortIcon('location')}
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('position')}
                    >
                      Position {getSortIcon('position')}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider">
                      Supervisor
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      Type {getSortIcon('type')}
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('start_date')}
                    >
                      Start Date {getSortIcon('start_date')}
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-alliance-navy transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th className="relative py-4 pl-3 pr-6">
                      <span className="sr-only text-white">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedAssignments.map((assignment) => (
                    <tr key={assignment.id} className="group hover:bg-alliance-navy transition-all duration-200">
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 group-hover:text-white">
                            {assignment.employees.first_name} {assignment.employees.last_name}
                          </span>
                          <span className="text-xs text-gray-500 group-hover:text-gray-200">
                            {assignment.employees.employee_number || `ID: ${assignment.employee_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 group-hover:text-white">
                            {assignment.locations.name}
                          </span>
                          {assignment.locations.store_number && (
                            <span className="text-xs text-gray-500 group-hover:text-gray-200">
                              Store #{assignment.locations.store_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="font-medium text-gray-900 group-hover:text-white">
                          {assignment.job_titles.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 group-hover:text-white">
                        {assignment.supervisor ? 
                          `${assignment.supervisor.first_name} ${assignment.supervisor.last_name}` : 
                          <span className="text-gray-500 group-hover:text-gray-200 italic">None</span>
                        }
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          assignment.assignment_type === 'PRIMARY' || assignment.is_primary
                            ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : assignment.assignment_type === 'TEMPORARY'
                            ? 'bg-yellow-100 text-yellow-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                            : assignment.assignment_type === 'TRAINING'
                            ? 'bg-purple-100 text-purple-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                            : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {assignment.assignment_type || (assignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 group-hover:text-white">
                            {new Date(assignment.start_date).toLocaleDateString()}
                          </span>
                          {assignment.end_date && (
                            <span className="text-xs text-gray-500 group-hover:text-gray-200">
                              Ended: {new Date(assignment.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          assignment.is_current 
                            ? 'bg-green-100 text-green-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white' 
                            : 'bg-gray-100 text-gray-800 group-hover:bg-white group-hover:bg-opacity-20 group-hover:text-white'
                        }`}>
                          {assignment.is_current ? 'Current' : 'Past'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-4 pr-6 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/employees/${assignment.employee_id}/assignments`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                          >
                            View
                          </Link>
                          {canEdit && assignment.is_current && (
                            <Link
                              href={`/assignments/${assignment.id}/edit`}
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
              {paginatedAssignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filteredAndSortedAssignments.length === 0 ? 'No assignments found' : 'No assignments on this page'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Pagination for Desktop */}
        {filteredAndSortedAssignments.length > 0 && (
          <ModernPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedAssignments.length}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Mobile Card Layout - Visible on mobile only */}
      <div className="mt-8 lg:hidden space-y-4">
        {paginatedAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            {filteredAndSortedAssignments.length === 0 ? 'No assignments found' : 'No assignments on this page'}
          </div>
        ) : (
          paginatedAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assignment.employees.first_name} {assignment.employees.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {assignment.employees.employee_number || `ID: ${assignment.employee_id}`}
                  </p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    assignment.is_current 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.is_current ? 'Current' : 'Past'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Location</p>
                  <p className="text-gray-900">{assignment.locations.name}</p>
                  {assignment.locations.store_number && (
                    <p className="text-xs text-gray-500">Store #{assignment.locations.store_number}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Position</p>
                  <p className="text-gray-900">{assignment.job_titles.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Type</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    assignment.assignment_type === 'PRIMARY' || assignment.is_primary
                      ? 'bg-alliance-blue bg-opacity-10 text-alliance-blue' 
                      : assignment.assignment_type === 'TEMPORARY'
                      ? 'bg-yellow-100 text-yellow-800'
                      : assignment.assignment_type === 'TRAINING'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.assignment_type || (assignment.is_primary ? 'PRIMARY' : 'SECONDARY')}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Start Date</p>
                  <p className="text-gray-900">{new Date(assignment.start_date).toLocaleDateString()}</p>
                  {assignment.end_date && (
                    <p className="text-xs text-gray-500">Ended: {new Date(assignment.end_date).toLocaleDateString()}</p>
                  )}
                </div>
                {assignment.supervisor && (
                  <div className="col-span-2">
                    <p className="text-gray-500 font-medium">Supervisor</p>
                    <p className="text-gray-900">{assignment.supervisor.first_name} {assignment.supervisor.last_name}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/employees/${assignment.employee_id}/assignments`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#1B4278] hover:bg-[#94C83D] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4278]"
                >
                  View
                </Link>
                {canEdit && assignment.is_current && (
                  <Link
                    href={`/assignments/${assignment.id}/edit`}
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
        {filteredAndSortedAssignments.length > 0 && (
          <div className="mt-6">
            <ModernPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedAssignments.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>
    </>
  )
}