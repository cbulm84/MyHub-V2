'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type District = Database['public']['Tables']['districts']['Row']

export default function NewLocationPage() {
  const router = useRouter()
  const { user, loading: authLoading, userType } = useAuth()
  const [saving, setSaving] = useState(false)
  const [districts, setDistricts] = useState<District[]>([])
  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    store_number: '',
    location_type: 'STORE' as 'STORE' | 'OFFICE' | 'WAREHOUSE' | 'OTHER',
    district_id: null as number | null,
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    is_active: true,
  })

  // Check permissions
  const canCreate = userType?.name === 'ADMIN' || userType?.name === 'HR'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user && !canCreate) {
      router.push('/locations')
    } else if (user) {
      fetchDistricts()
    }
  }, [user, authLoading, canCreate, router])

  const fetchDistricts = async () => {
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .order('name')

    if (!error && data) {
      setDistricts(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Generate next location ID
      const { data: maxId } = await supabase
        .from('locations')
        .select('location_id')
        .order('location_id', { ascending: false })
        .limit(1)
        .single()

      const nextId = maxId ? maxId.location_id + 1 : 10000

      // Create location
      const { error } = await supabase
        .from('locations')
        .insert({
          location_id: nextId,
          name: formData.name,
          store_number: formData.store_number || null,
          location_type: formData.location_type,
          district_id: formData.district_id,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          phone: formData.phone || null,
          is_active: formData.is_active,
        })

      if (error) throw error

      router.push('/locations')
    } catch (error: any) {
      console.error('Error creating location:', error)
      alert(`Failed to create location: ${error.message}`)
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
                Add New Location
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
              <div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Location name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="store_number" className="block text-sm font-medium text-gray-700">
                      Store number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="store_number"
                        id="store_number"
                        value={formData.store_number}
                        onChange={(e) => setFormData({ ...formData, store_number: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="location_type" className="block text-sm font-medium text-gray-700">
                      Location type
                    </label>
                    <div className="mt-1">
                      <select
                        id="location_type"
                        name="location_type"
                        value={formData.location_type}
                        onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="STORE">Store</option>
                        <option value="OFFICE">Office</option>
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="district_id" className="block text-sm font-medium text-gray-700">
                      District
                    </label>
                    <div className="mt-1">
                      <select
                        id="district_id"
                        name="district_id"
                        value={formData.district_id || ''}
                        onChange={(e) => setFormData({ ...formData, district_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">No District</option>
                        {districts.map((district) => (
                          <option key={district.district_id} value={district.district_id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="address_line_1"
                        id="address_line_1"
                        required
                        value={formData.address_line_1}
                        onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                        placeholder="Street address"
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="address_line_2"
                        id="address_line_2"
                        value={formData.address_line_2}
                        onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                        placeholder="Apartment, suite, etc. (optional)"
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="city"
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State / Province
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="state"
                        id="state"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                      ZIP / Postal code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="postal_code"
                        id="postal_code"
                        required
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="shadow-sm focus:ring-alliance-blue focus:border-alliance-blue block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                            <p className="text-gray-500">This location is currently operational</p>
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
                  href="/locations"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create location'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>  )
}