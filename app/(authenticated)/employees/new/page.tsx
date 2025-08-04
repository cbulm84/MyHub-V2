import { redirect } from 'next/navigation'
import { getUser, getCurrentEmployee, canUserEdit } from '@/lib/supabase/server'
import NewEmployeeForm from '@/components/NewEmployeeForm'

export default async function NewEmployeePage() {
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

  // Only ADMIN and HR can create new employees
  if (!canEdit) {
    redirect('/employees')
  }

  return (      <NewEmployeeForm />  )
}