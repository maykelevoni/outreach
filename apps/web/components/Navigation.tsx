'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MailIcon, ListIcon, FileTextIcon } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Campaigns',
      href: '/campaigns',
      icon: ListIcon,
    },
    {
      name: 'Email Templates',
      href: '/templates',
      icon: FileTextIcon,
    },
  ]

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex items-center px-2 py-2">
              <MailIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Outreach
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="mr-2 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
