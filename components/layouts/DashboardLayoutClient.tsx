'use client'

import { Fragment, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { createClient } from '@/lib/supabase/client'
import { HomeIcon, UsersIcon, BuildingIcon, ClipboardIcon, MenuIcon, XIcon, SitemapIcon, FileImportIcon } from '../icons/NavigationIcons'

interface NavigationItem {
  name: string
  href: string
  icon: string
}

interface DashboardLayoutClientProps {
  navigation: NavigationItem[]
  employee: any
  children: React.ReactNode
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  users: UsersIcon,
  building: BuildingIcon,
  clipboard: ClipboardIcon,
  sitemap: SitemapIcon,
  'file-import': FileImportIcon,
}

export default function DashboardLayoutClient({ navigation, employee, children }: DashboardLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : ''
  const userType = employee?.user_types?.name || ''
  const userDescription = employee?.user_types?.description || 'Employee'
  
  // Get job title from current assignments
  const currentAssignment = employee?.current_assignments?.find((a: any) => a.is_primary) || employee?.current_assignments?.[0]
  const jobTitle = currentAssignment?.job_titles?.name || 'Employee'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="relative z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                {/* Mobile Sidebar */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-alliance-navy px-6 pb-2">
                  <div className="flex h-16 items-center justify-center bg-alliance-blue -mx-6 px-6">
                    <img 
                      src="https://ieiuhdxdziszeabilnxp.supabase.co/storage/v1/object/public/media//am_logo_full_allwhite%20(1).png" 
                      alt="Alliance Mobile Logo" 
                      className="h-20 w-auto"
                    />
                  </div>
                  
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-2">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`
                              group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors
                              ${pathname === item.href 
                                ? 'bg-alliance-blue text-white' 
                                : 'text-gray-300 hover:bg-alliance-blue hover:text-white'
                              }
                            `}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {(() => {
                              const Icon = iconMap[item.icon]
                              return Icon ? <Icon className="h-6 w-6 shrink-0" aria-hidden="true" /> : null
                            })()}
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-alliance-navy">
          <div className="flex h-16 items-center justify-center bg-alliance-blue">
            <img 
              src="https://ieiuhdxdziszeabilnxp.supabase.co/storage/v1/object/public/media//am_logo_full_allwhite%20(1).png" 
              alt="Alliance Mobile Logo" 
              className="h-20 w-auto"
            />
          </div>
          
          <nav className="flex flex-1 flex-col px-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group flex gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                      ${pathname === item.href 
                        ? 'bg-alliance-blue text-white' 
                        : 'text-gray-300 hover:bg-alliance-blue hover:text-white'
                      }
                    `}
                  >
                    {(() => {
                      const Icon = iconMap[item.icon]
                      return Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /> : null
                    })()}
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-alliance-blue px-4 shadow-lg sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-white bg-opacity-20 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="font-semibold text-white text-lg xs:text-sm" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.125rem)' }}>
                {userDescription} Portal
              </h2>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center text-sm">
                  <div className="mr-3 text-right hidden sm:block">
                    <p className="font-medium text-white">{employeeName}</p>
                    <p className="text-xs text-white text-opacity-80">{jobTitle}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold border border-white border-opacity-30">
                    {employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                      <p className="font-medium text-gray-900 text-sm">{employeeName}</p>
                      <p className="text-xs text-gray-500">{jobTitle}</p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}