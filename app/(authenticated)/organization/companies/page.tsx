import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, getCurrentEmployee, canUserEdit } from '@/lib/supabase/server'

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

  // Note: This page is a placeholder. The current database schema doesn't include companies/divisions tables.
  // The organizational hierarchy is: Locations → Districts → Regions → Markets
  // Redirecting to markets page instead
  redirect('/organization/markets')
}