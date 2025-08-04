'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type Location = Database['public']['Tables']['locations']['Row']
type JobTitle = Database['public']['Tables']['job_titles']['Row']

export default function NewAssignmentPage() {
  const router = useRouter()
  const { user, loading: authLoading, userType } = useAuth()
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  
  const [formData, setFormData] = useState({
    employee_id: '',
    location_id: '',
    job_title_id: '',
    supervisor_employee_id: '',
    assignment_type: 'PRIMARY' as 'PRIMARY' | 'SECONDARY' | 'TEMPORARY' | 'TRAINING',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_primary: true,
    notes: ''
  })

  // Check permissions
  const canCreate = userType?.name === 'ADMIN' || userType?.name === 'HR'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user && !canCreate) {
      router.push('/assignments')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading, canCreate, router])

  const fetchData = async () => {
    // Fetch employees
    const { data: empData } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('last_name')

    if (empData) setEmployees(empData)

    // Fetch locations
    const { data: locData } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (locData) setLocations(locData)

    // Fetch job titles
    const { data: jobData } = await supabase
      .from('job_titles')
      .select('*')
      .order('name')

    if (jobData) setJobTitles(jobData)
  }

  const fetchSupervisors = useCallback(async () => {
    if (!formData.location_id) return

    // Get employees at this location who could be supervisors
    const { data } = await supabase
      .from('employee_assignments')
      .select(`
        employee_id,
        employees!employee_assignments_employee_id_fkey (
          employee_id,
          first_name,
          last_name,
          user_type_id
        )
      `)
      .eq('location_id', parseInt(formData.location_id))
      .eq('is_current', true)
      .neq('employee_id', parseInt(formData.employee_id || '0'))

    if (data) {
      const uniqueSupervisors = data.reduce((acc, item) => {
        if (!acc.find((e: any) => e.employee_id === item.employees?.employee_id)) {
          acc.push(item.employees)
        }
        return acc
      }, [] as any[])
      setSupervisors(uniqueSupervisors)
    }
  }, [formData.location_id, formData.employee_id])

  // Fetch potential supervisors when location changes
  useEffect(() => {
    if (formData.location_id) {
      fetchSupervisors()
    }
  }, [formData.location_id, fetchSupervisors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Check if employee already has a primary assignment
      if (formData.is_primary) {
        const { data: existing } = await supabase
          .from('employee_assignments')
          .select('id')
          .eq('employee_id', parseInt(formData.employee_id))
          .eq('is_current', true)
          .eq('is_primary', true)
          .single()

        if (existing) {
          if (!confirm('This employee already has a primary assignment. Do you want to make this the new primary assignment?')) {
            setSaving(false)
            return
          }

          // Update existing primary to secondary
          await supabase
            .from('employee_assignments')
            .update({ is_primary: false, assignment_type: 'SECONDARY' })
            .eq('id', existing.id)
        }
      }

      // Create new assignment
      const { error } = await supabase
        .from('employee_assignments')
        .insert({
          employee_id: parseInt(formData.employee_id),
          location_id: parseInt(formData.location_id),
          job_title_id: parseInt(formData.job_title_id),
          supervisor_employee_id: formData.supervisor_employee_id ? parseInt(formData.supervisor_employee_id) : null,
          assignment_type: formData.assignment_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          is_primary: formData.is_primary,
          is_current: true,
          notes: formData.notes || null,
          store_override: false
        })

      if (error) throw error

      alert('Assignment created successfully!')
      router.push('/assignments')
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      alert(`Failed to create assignment: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !canCreate) {
    return (        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alliance-blue"></div>
        </div>    )
  }

  return (      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Create New Assignment
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
              <div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                      Employee
                    </label>
                    <div className="mt-1">
                      <select
                        id="employee_id"
                        name="employee_id"
                        required
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select an employee</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.last_name}, {emp.first_name} (ID: {emp.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="mt-1">
                      <select
                        id="location_id"
                        name="location_id"
                        required
                        value={formData.location_id}
                        onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select a location</option>
                        {locations.map((loc) => (
                          <option key={loc.location_id} value={loc.location_id}>
                            {loc.name} {loc.store_number && `(#${loc.store_number})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="job_title_id" className="block text-sm font-medium text-gray-700">
                      Job Title
                    </label>
                    <div className="mt-1">
                      <select
                        id="job_title_id"
                        name="job_title_id"
                        required
                        value={formData.job_title_id}
                        onChange={(e) => setFormData({ ...formData, job_title_id: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select a job title</option>
                        {jobTitles.map((job) => (
                          <option key={job.job_title_id} value={job.job_title_id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="supervisor_employee_id" className="block text-sm font-medium text-gray-700">
                      Supervisor
                    </label>
                    <div className="mt-1">
                      <select
                        id="supervisor_employee_id"
                        name="supervisor_employee_id"
                        value={formData.supervisor_employee_id}
                        onChange={(e) => setFormData({ ...formData, supervisor_employee_id: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">No supervisor</option>
                        {supervisors.map((sup) => (
                          <option key={sup.employee_id} value={sup.employee_id}>
                            {sup.last_name}, {sup.first_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="assignment_type" className="block text-sm font-medium text-gray-700">
                      Assignment Type
                    </label>
                    <div className="mt-1">
                      <select
                        id="assignment_type"
                        name="assignment_type"
                        value={formData.assignment_type}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          assignment_type: e.target.value as any,
                          is_primary: e.target.value === 'PRIMARY'
                        })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="SECONDARY">Secondary</option>
                        <option value="TEMPORARY">Temporary</option>
                        <option value="TRAINING">Training</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="start_date"
                        id="start_date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="end_date"
                        id="end_date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Leave blank for indefinite assignments
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <Link
                  href="/assignments"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>  )
}