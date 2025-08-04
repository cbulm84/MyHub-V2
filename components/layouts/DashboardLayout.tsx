import DashboardLayoutClient from './DashboardLayoutClient'
import { getCurrentEmployee } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee()
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Organization', href: '/organization', icon: 'sitemap' },
    { name: 'Locations', href: '/locations', icon: 'building' },
    { name: 'Employees', href: '/employees', icon: 'users' },
    { name: 'Assignments', href: '/assignments', icon: 'clipboard' },
    { name: 'Import Data', href: '/admin/import', icon: 'file-import' },
  ]

  return (
    <DashboardLayoutClient 
      navigation={navigation}
      employee={employee}
    >
      {children}
    </DashboardLayoutClient>
  )
}