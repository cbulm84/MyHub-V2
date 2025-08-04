'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type UserType = Database['public']['Tables']['user_types']['Row']

interface EmployeeEditFormProps {
  employee: Employee
  userTypes: UserType[]
  currentUserId: string
}

export default function EmployeeEditForm({ employee, userTypes, currentUserId }: EmployeeEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>(employee)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          username: formData.username,
          user_type_id: formData.user_type_id,
          employee_number: formData.employee_number,
          file_number: formData.file_number,
          
          // Phone numbers
          mobile_phone: formData.mobile_phone,
          home_phone: formData.home_phone,
          work_phone: formData.work_phone,
          
          // Employment details
          hire_date: formData.hire_date,
          is_full_time: formData.is_full_time,
          is_on_leave: formData.is_on_leave,
          is_active: formData.is_active,
          
          // Termination info
          termination_date: formData.termination_date,
          termination_reason_id: formData.termination_reason_id,
          termination_notes: formData.termination_notes,
          
          updated_at: new Date().toISOString(),
          updated_by: currentUserId
        })
        .eq('employee_id', employee.employee_id)

      if (error) throw error

      router.push(`/employees/${employee.employee_id}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating employee:', error)
      alert(`Failed to update employee: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              />
            </div>

            <div className="col-span-6 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              />
            </div>

            <div className="col-span-6 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Employee Number
              </label>
              <input
                type="text"
                value={formData.employee_number || ''}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                User Type
              </label>
              <select
                value={formData.user_type_id || ''}
                onChange={(e) => setFormData({ ...formData, user_type_id: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              >
                <option value="">Select a role</option>
                {userTypes.map((type) => (
                  <option key={type.user_type_id} value={type.user_type_id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Phone
              </label>
              <input
                type="tel"
                value={formData.mobile_phone || ''}
                onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
              />
            </div>

            <div className="col-span-6 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Home Phone
              </label>
              <input
                type="tel"
                value={formData.home_phone || ''}
                onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
              />
            </div>

            <div className="col-span-6 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Work Phone
              </label>
              <input
                type="tel"
                value={formData.work_phone || ''}
                onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Employment Details
          </h3>
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Hire Date
              </label>
              <input
                type="date"
                value={formData.hire_date || ''}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                required
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                File Number
              </label>
              <input
                type="text"
                value={formData.file_number || ''}
                onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
              />
            </div>

            <div className="col-span-6 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_full_time || false}
                  onChange={(e) => setFormData({ ...formData, is_full_time: e.target.checked })}
                  className="h-4 w-4 text-alliance-blue focus:ring-alliance-blue border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Full Time Employee</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_on_leave || false}
                  onChange={(e) => setFormData({ ...formData, is_on_leave: e.target.checked })}
                  className="h-4 w-4 text-alliance-blue focus:ring-alliance-blue border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Currently on Leave</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-alliance-blue focus:ring-alliance-blue border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active Employee</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Termination Information (if not active) */}
      {!formData.is_active && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Termination Information
            </h3>
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Termination Date
                </label>
                <input
                  type="date"
                  value={formData.termination_date || ''}
                  onChange={(e) => setFormData({ ...formData, termination_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                />
              </div>

              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Termination Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.termination_notes || ''}
                  onChange={(e) => setFormData({ ...formData, termination_notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Link
          href={`/employees/${employee.employee_id}`}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}