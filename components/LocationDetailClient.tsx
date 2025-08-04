'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type District = Database['public']['Tables']['districts']['Row'] & {
  regions?: {
    name: string
    markets?: {
      name: string
    }
  }
}
type Employee = {
  employee_id: number
  first_name: string
  last_name: string
  email: string | null
  is_active: boolean
  job_title: string
}

interface LocationDetailClientProps {
  location: Location
  district: District | null
  districts: District[]
  employees: Employee[]
  canEdit: boolean
  locationId: number
}

export default function LocationDetailClient({
  location,
  district,
  districts,
  employees,
  canEdit,
  locationId
}: LocationDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: location.name,
    store_number: location.store_number || '',
    district_id: location.district_id || '',
    // phone: location.phone || '', // Phone is in addresses table
    is_active: location.is_active
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'employees'>('details')

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: location.name,
      store_number: location.store_number || '',
      district_id: location.district_id || '',
      // phone: location.phone || '', // Phone is in addresses table
      is_active: location.is_active
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update location')
      }

      // Refresh the server component data
      router.refresh()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating location:', error)
      alert('Failed to update location. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const activeEmployees = employees.filter(emp => emp.is_active)
  const inactiveEmployees = employees.filter(emp => !emp.is_active)

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'details'
                ? 'border-alliance-blue text-alliance-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Location Details
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
              activeTab === 'employees'
                ? 'border-alliance-blue text-alliance-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employees
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'employees' ? 'bg-alliance-blue text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {employees.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' ? (
          /* Location Details Tab */
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-5">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg leading-6 font-semibold text-gray-900">
                  Location Information
                </h3>
                {canEdit && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-alliance-blue hover:bg-alliance-navy transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Details
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="store_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Store Number
                      </label>
                      <input
                        type="text"
                        id="store_number"
                        value={formData.store_number}
                        onChange={(e) => setFormData({ ...formData, store_number: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                        District
                      </label>
                      <select
                        id="district"
                        value={formData.district_id}
                        onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                      >
                        <option value="">No District</option>
                        {districts.map((d) => (
                          <option key={d.district_id} value={d.district_id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Phone field removed - should be managed through addresses */}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-alliance-blue focus:ring-alliance-blue border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active Location
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-alliance-blue hover:bg-alliance-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {isSaving ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Store Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{location.store_number || 'N/A'}</dd>
                  </div>
                  {/* Phone field removed - should be managed through addresses */}
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">District</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{district?.name || 'N/A'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Market</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{district?.regions?.markets?.name || 'N/A'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        location.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <i className={`fas ${location.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Total Employees</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{employees.length}</dd>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Employees Tab */
          <div className="space-y-6">
            {/* Active Employees */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-user-check text-green-600 mr-2"></i>
                  Active Employees ({activeEmployees.length})
                </h3>
                
                {activeEmployees.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active employees at this location.</p>
                ) : (
                  <>
                    {/* Desktop Table - Hidden on mobile */}
                    <div className="overflow-x-auto hidden lg:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Job Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {activeEmployees.map((employee) => (
                            <tr key={employee.employee_id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-alliance-blue rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {employee.first_name[0]}{employee.last_name[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {employee.first_name} {employee.last_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.job_title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {employee.email || <span className="italic">No email</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <a
                                  href={`/employees/${employee.employee_id}`}
                                  className="text-alliance-blue hover:text-alliance-navy transition-colors duration-150"
                                >
                                  View Profile
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card Layout - Visible on mobile only */}
                    <div className="lg:hidden space-y-3">
                      {activeEmployees.map((employee) => (
                        <div key={employee.employee_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-alliance-blue rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {employee.first_name[0]}{employee.last_name[0]}
                                </span>
                              </div>
                              <div className="ml-3">
                                <h4 className="text-base font-semibold text-gray-900">
                                  {employee.first_name} {employee.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">{employee.job_title}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {employee.email || <span className="italic">No email</span>}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`/employees/${employee.employee_id}`}
                              className="text-alliance-blue hover:text-alliance-navy text-sm font-medium"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Inactive Employees */}
            {inactiveEmployees.length > 0 && (
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                <div className="px-6 py-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-user-times text-red-600 mr-2"></i>
                    Inactive Employees ({inactiveEmployees.length})
                  </h3>
                  
                  {/* Desktop Table - Hidden on mobile */}
                  <div className="overflow-x-auto hidden lg:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {inactiveEmployees.map((employee) => (
                          <tr key={employee.employee_id} className="hover:bg-gray-50 transition-colors duration-150 opacity-75">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {employee.first_name[0]}{employee.last_name[0]}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {employee.first_name} {employee.last_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.job_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.email || <span className="italic">No email</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a
                                href={`/employees/${employee.employee_id}`}
                                className="text-alliance-blue hover:text-alliance-navy transition-colors duration-150"
                              >
                                View Profile
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Card Layout - Visible on mobile only */}
                  <div className="lg:hidden space-y-3">
                    {inactiveEmployees.map((employee) => (
                      <div key={employee.employee_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-base font-semibold text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </h4>
                              <p className="text-sm text-gray-600">{employee.job_title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {employee.email || <span className="italic">No email</span>}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`/employees/${employee.employee_id}`}
                            className="text-alliance-blue hover:text-alliance-navy text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}