'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Market = Database['public']['Tables']['markets']['Row']
type Region = Database['public']['Tables']['regions']['Row']
type District = Database['public']['Tables']['districts']['Row']

export default function NewOrganizationEntityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityType = searchParams.get('type') || 'market'
  
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchParentData = async () => {
      if (entityType === 'region') {
        const { data } = await supabase
          .from('markets')
          .select('*')
          .eq('is_active', true)
          .order('name')
        setMarkets(data || [])
      } else if (entityType === 'district') {
        const { data } = await supabase
          .from('regions')
          .select('*')
          .eq('is_active', true)
          .order('name')
        setRegions(data || [])
      }
    }
    fetchParentData()
  }, [entityType, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (entityType === 'market') {
        // Get the next market_id
        const { data: maxMarket } = await supabase
          .from('markets')
          .select('market_id')
          .order('market_id', { ascending: false })
          .limit(1)
          .single()
        
        const nextMarketId = maxMarket ? maxMarket.market_id + 1 : 1
        
        const { error } = await supabase
          .from('markets')
          .insert({ 
            market_id: nextMarketId,
            name,
            is_active: true,
            metadata: {}
          })
        
        if (error) throw error
        router.push('/organization')
      } else if (entityType === 'region') {
        if (!parentId) {
          setError('Please select a market')
          setLoading(false)
          return
        }
        
        // Get the next region_id
        const { data: maxRegion } = await supabase
          .from('regions')
          .select('region_id')
          .order('region_id', { ascending: false })
          .limit(1)
          .single()
        
        const nextRegionId = maxRegion ? maxRegion.region_id + 1 : 1
        
        const { error } = await supabase
          .from('regions')
          .insert({ 
            region_id: nextRegionId,
            name, 
            market_id: parentId,
            is_active: true,
            metadata: {}
          })
        
        if (error) throw error
        router.push('/organization')
      } else if (entityType === 'district') {
        if (!parentId) {
          setError('Please select a region')
          setLoading(false)
          return
        }
        
        // Get the next district_id
        const { data: maxDistrict } = await supabase
          .from('districts')
          .select('district_id')
          .order('district_id', { ascending: false })
          .limit(1)
          .single()
        
        const nextDistrictId = maxDistrict ? maxDistrict.district_id + 1 : 1
        
        const { error } = await supabase
          .from('districts')
          .insert({ 
            district_id: nextDistrictId,
            name, 
            region_id: parentId,
            is_active: true,
            metadata: {}
          })
        
        if (error) throw error
        router.push('/organization')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (entityType) {
      case 'market': return 'New Market'
      case 'region': return 'New Region'
      case 'district': return 'New District'
      default: return 'New Entity'
    }
  }

  return (      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">{getTitle()}</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow-alliance rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                />
              </div>

              {entityType === 'region' && (
                <div>
                  <label htmlFor="market" className="block text-sm font-medium text-gray-700">
                    Market
                  </label>
                  <select
                    id="market"
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                  >
                    <option value="">Select a market</option>
                    {markets.map((market) => (
                      <option key={market.market_id} value={market.market_id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {entityType === 'district' && (
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <select
                    id="region"
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-alliance-blue focus:ring-alliance-blue sm:text-sm"
                  >
                    <option value="">Select a region</option>
                    {regions.map((region) => (
                      <option key={region.region_id} value={region.region_id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/organization')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>  )
}