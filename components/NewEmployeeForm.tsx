'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type UserType = Database['public']['Tables']['user_types']['Row']

export default function NewEmployeeForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [userTypes, setUserTypes] = useState<UserType[]>([])
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    user_type_id: 3, // Default to EMPLOYEE
    hire_date: new Date().toISOString().split('T')[0],
    mobile_phone: '',
    employee_number: '',
    is_full_time: true,
    is_active: true,
  })

  useEffect(() => {
    fetchUserTypes()
  }, [])

  const fetchUserTypes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_types')
      .select('*')
      .order('user_type_id')

    if (!error && data) {
      setUserTypes(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Generate a temporary password
      const tempPassword = `${formData.first_name.charAt(0).toUpperCase()}${formData.last_name.toLowerCase()}123!`

      // Create employee through API route (which handles auth user creation)
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          temporary_password: tempPassword
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create employee')
      }

      // Show success message with temporary password
      alert(`Employee created successfully!\n\nTemporary password: ${result.temporaryPassword}\n\nPlease share this password with the employee. They will be prompted to change it on first login.`)
      
      router.push('/employees')
    } catch (error: any) {
      console.error('Error creating employee:', error)
      alert(`Failed to create employee: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Add New Employee
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="first_name"
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="last_name"
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Auto-generated from email if empty"
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="mobile_phone" className="block text-sm font-medium text-gray-700">
                    Mobile phone
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="mobile_phone"
                      id="mobile_phone"
                      value={formData.mobile_phone}
                      onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="user_type_id" className="block text-sm font-medium text-gray-700">
                    User type
                  </label>
                  <div className="mt-1">
                    <select
                      id="user_type_id"
                      name="user_type_id"
                      value={formData.user_type_id}
                      onChange={(e) => setFormData({ ...formData, user_type_id: parseInt(e.target.value) })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      {userTypes.map((type) => (
                        <option key={type.user_type_id} value={type.user_type_id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
                    Hire date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="hire_date"
                      id="hire_date"
                      required
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700">
                    Employee number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="employee_number"
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-700">Status</legend>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="is_full_time"
                            name="is_full_time"
                            type="checkbox"
                            checked={formData.is_full_time}
                            onChange={(e) => setFormData({ ...formData, is_full_time: e.target.checked })}
                            className="focus:ring-alliance-blue h-4 w-4 text-alliance-blue border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="is_full_time" className="font-medium text-gray-700">
                            Full-time employee
                          </label>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="focus:ring-alliance-blue h-4 w-4 text-alliance-blue border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="is_active" className="font-medium text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <Link
                href="/employees"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create employee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}