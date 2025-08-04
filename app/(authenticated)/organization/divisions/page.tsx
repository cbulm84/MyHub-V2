import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export default async function DivisionsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const [currentEmployee, canEdit] = await Promise.all([
    getCurrentEmployee(),
    canUserEdit()
  ])

  if (!currentEmployee) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch divisions with company info and region counts
  const { data: divisions, error } = await supabase
    .from('divisions')
    .select(`
      *,
      companies (
        company_id,
        name
      ),
      director:employees!division_director_employee_id (
        employee_id,
        first_name,
        last_name
      )
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(`Failed to load divisions: ${error.message}`)
  }

  // Get region counts per division
  const { data: regionCounts } = await supabase
    .from('regions')
    .select('division_id')
    .eq('is_active', true)

  const counts = regionCounts?.reduce((acc, region) => {
    acc[region.division_id] = (acc[region.division_id] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  const divisionsWithCounts = (divisions || []).map(division => ({
    ...division,
    region_count: counts[division.division_id] || 0
  }))

  return (      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Divisions</h1>
              <p className="mt-2 text-sm text-gray-700">
                Major business units within companies. Each division contains multiple regions.
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/organization/divisions/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                >
                  Add division
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Director</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Regions</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {divisionsWithCounts.map((division) => (
                        <tr key={division.division_id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            {division.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {division.code || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {division.companies?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {division.director ? 
                              `${division.director.first_name} ${division.director.last_name}` : 
                              '-'
                            }
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {division.region_count}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              division.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {division.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              href={`/organization/divisions/${division.division_id}`}
                              className="text-alliance-navy hover:text-alliance-navy-dark"
                            >
                              View<span className="sr-only">, {division.name}</span>
                            </Link>
                            {canEdit && (
                              <>
                                <span className="mx-2">|</span>
                                <Link
                                  href={`/organization/divisions/${division.division_id}/edit`}
                                  className="text-alliance-navy hover:text-alliance-navy-dark"
                                >
                                  Edit<span className="sr-only">, {division.name}</span>
                                </Link>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  )
}