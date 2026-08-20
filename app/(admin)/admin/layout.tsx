import Link from 'next/link'
import { LayoutDashboard, Package, Users, BarChart3, ArrowLeft } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Ads', href: '/admin/ads', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Daily Reports', href: '/admin/reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">TrendMart</h2>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
              Admin Portal
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors font-medium text-sm"
              >
                <Icon className="w-5 h-5 text-gray-500 hover:text-orange-600" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Main Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}