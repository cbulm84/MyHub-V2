import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export default async function CompaniesPage() {
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

  // Fetch companies with division counts
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      *,
      divisions (count)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(`Failed to load companies: ${error.message}`)
  }

  // Get division counts
  const { data: divisionCounts } = await supabase
    .from('divisions')
    .select('company_id')
    .eq('is_active', true)

  const counts = divisionCounts?.reduce((acc, div) => {
    acc[div.company_id] = (acc[div.company_id] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  const companiesWithCounts = (companies || []).map(company => ({
    ...company,
    division_count: counts[company.company_id] || 0
  }))

  return (      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Companies</h1>
              <p className="mt-2 text-sm text-gray-700">
                Top-level organizations in the system. Each company can have multiple divisions.
              </p>
            </div>
            {canEdit && (
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  href="/organization/companies/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-alliance-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                >
                  Add company
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
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Legal Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Divisions</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {companiesWithCounts.map((company) => (
                        <tr key={company.company_id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            {company.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {company.legal_name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {company.email || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {company.division_count}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              company.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              href={`/organization/companies/${company.company_id}`}
                              className="text-alliance-navy hover:text-alliance-navy-dark"
                            >
                              View<span className="sr-only">, {company.name}</span>
                            </Link>
                            {canEdit && (
                              <>
                                <span className="mx-2">|</span>
                                <Link
                                  href={`/organization/companies/${company.company_id}/edit`}
                                  className="text-alliance-navy hover:text-alliance-navy-dark"
                                >
                                  Edit<span className="sr-only">, {company.name}</span>
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