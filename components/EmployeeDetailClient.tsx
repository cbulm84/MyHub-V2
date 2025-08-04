'use client'

import { useState } from 'react'
import Link from 'next/link'
import ContactInfoModal from '@/components/ContactInfoModal'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type Address = Database['public']['Tables']['addresses']['Row']

interface EmployeeDetailClientProps {
  employee: Employee
  address: Address | null
  canEdit: boolean
  employeeId: number
}

export default function EmployeeDetailClient({ employee, address, canEdit, employeeId }: EmployeeDetailClientProps) {
  const [showContactModal, setShowContactModal] = useState(false)

  const handleResetPassword = async () => {
    if (!employee || !confirm('Are you sure you want to reset this employee\'s password?')) return

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          mobile_phone: employee.mobile_phone,
          is_active: employee.is_active,
          reset_password: true
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset password')
      }

      alert(`Password reset successfully!\n\nNew temporary password: ${result.temporaryPassword}\n\nPlease share this with the employee.`)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      alert(`Failed to reset password: ${error.message}`)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowContactModal(true)}
        className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
      >
        Contact Information
      </button>
      {canEdit && (
        <>
          <Link
            href={`/employees/${employeeId}/edit`}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-alliance-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
          >
            Edit
          </Link>
          {employee.auth_user_id && (
            <button
              onClick={handleResetPassword}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alliance-blue"
            >
              Reset Password
            </button>
          )}
        </>
      )}
      
      {/* Contact Information Modal */}
      <ContactInfoModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        employee={employee}
        address={address}
      />
    </>
  )
}