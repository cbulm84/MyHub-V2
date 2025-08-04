'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PhoneIcon, HomeIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type Address = Database['public']['Tables']['addresses']['Row']

interface ContactInfoModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee
  address: Address | null
}

export default function ContactInfoModal({ isOpen, onClose, employee, address }: ContactInfoModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-alliance-blue bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10">
                    <PhoneIcon className="h-6 w-6 text-alliance-blue" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Contact Information
                    </Dialog.Title>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {employee.first_name} {employee.last_name}
                      </h4>
                      
                      {/* Phone Numbers */}
                      <div className="space-y-3 mb-6">
                        <h5 className="text-sm font-medium text-gray-700 border-b pb-1">Phone Numbers</h5>
                        
                        {employee.mobile_phone && (
                          <div className="flex items-center space-x-3">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">
                                <a href={`tel:${employee.mobile_phone}`} className="hover:text-alliance-blue">
                                  {employee.mobile_phone}
                                </a>
                              </p>
                              <p className="text-xs text-gray-500">Mobile ({employee.mobile_phone_type})</p>
                            </div>
                          </div>
                        )}
                        
                        {employee.home_phone && (
                          <div className="flex items-center space-x-3">
                            <HomeIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">
                                <a href={`tel:${employee.home_phone}`} className="hover:text-alliance-blue">
                                  {employee.home_phone}
                                </a>
                              </p>
                              <p className="text-xs text-gray-500">Home ({employee.home_phone_type})</p>
                            </div>
                          </div>
                        )}
                        
                        {employee.work_phone && (
                          <div className="flex items-center space-x-3">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">
                                <a href={`tel:${employee.work_phone}`} className="hover:text-alliance-blue">
                                  {employee.work_phone}
                                </a>
                              </p>
                              <p className="text-xs text-gray-500">Work ({employee.work_phone_type})</p>
                            </div>
                          </div>
                        )}
                        
                        {!employee.mobile_phone && !employee.home_phone && !employee.work_phone && (
                          <p className="text-sm text-gray-500 italic">No phone numbers on file</p>
                        )}
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-3 mb-6">
                        <h5 className="text-sm font-medium text-gray-700 border-b pb-1">Email</h5>
                        <div className="flex items-center space-x-3">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            <a href={`mailto:${employee.email}`} className="hover:text-alliance-blue">
                              {employee.email}
                            </a>
                          </p>
                        </div>
                      </div>
                      
                      {/* Mailing Address */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 border-b pb-1">Mailing Address</h5>
                        {address ? (
                          <div className="text-sm text-gray-900">
                            <p>{address.street_line1}</p>
                            {address.street_line2 && <p>{address.street_line2}</p>}
                            <p>
                              {address.city}, {address.state_province} {address.postal_code}
                            </p>
                            <p className="text-gray-600">{address.country_code}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No address on file</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}