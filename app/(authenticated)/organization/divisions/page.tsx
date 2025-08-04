import { redirect } from 'next/navigation'
import { getUser, getCurrentEmployee } from '@/lib/supabase/server'

export default async function DivisionsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const currentEmployee = await getCurrentEmployee()

  if (!currentEmployee) {
    redirect('/login')
  }

  // Note: This page is a placeholder. The current database schema doesn't include divisions table.
  // The organizational hierarchy is: Locations → Districts → Regions → Markets
  // Redirecting to districts page instead
  redirect('/organization/districts')
}