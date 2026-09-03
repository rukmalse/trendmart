'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, LayoutDashboard, Menu, X, Briefcase, Home, PlusCircle } from 'lucide-react'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('customer')
  const [avatarUrl, setAvatarUrl] = useState<string>('') 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false) // 👈 Mobile/Click friendly dropdown state

  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Trend Mart',
    logo_url: '',
    primary_color: '#f97316'
  })

  useEffect(() => {
    async function getUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', currentUser.id)
          .single()
        
        if (profile) {
          if (profile.role) setUserRole(profile.role)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
        }
      }
    }
    getUserData()

    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setSiteSettings({
          site_name: data.site_name || 'Trend Mart',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#f97316'
        })
      }
    }
    fetchSettings()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', currentUser.id)
          .single()
        if (profile) {
          if (profile.role) setUserRole(profile.role)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
        }
      } else {
        setUserRole('customer')
        setAvatarUrl('')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole('customer')
    setAvatarUrl('')
    setMobileMenuOpen(false)
    setDropdownOpen(false)
    router.refresh()
    router.push('/')
  }

  const dashboardHref = (userRole === 'admin' || userRole === 'super_admin') ? '/admin' : '/dashboard'

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* 1. Logo / Site Name */}
        <Link href="/" className="flex items-center space-x-2">
          {siteSettings.logo_url ? (
            <img 
              src={siteSettings.logo_url} 
              alt={siteSettings.site_name} 
              className="h-12 sm:h-16 max-w-[180px] sm:max-w-[220px] object-contain" 
            />
          ) : (
            <span className="font-black text-xl sm:text-2xl tracking-tight text-gray-900">
              {siteSettings.site_name.includes(' ') ? (
                <>
                  {siteSettings.site_name.split(' ')[0]}
                  <span style={{ color: siteSettings.primary_color }}>
                    {` ${siteSettings.site_name.split(' ').slice(1).join(' ')}`}
                  </span>
                </>
              ) : (
                <span style={{ color: siteSettings.primary_color }}>{siteSettings.site_name}</span>
              )}
            </span>
          )}
        </Link>

        {/* 2. Main Navigation (Desktop) */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-bold text-gray-700 hover:text-orange-500 transition">
            Home
          </Link>
          <Link href="/jobs" className="text-sm font-bold text-gray-700 hover:text-orange-500 transition flex items-center">
            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 uppercase">New</span>
            Manpower & Jobs
          </Link>
        </nav>

        {/* 3. User State & Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          <Link 
            href="/post-ad" 
            className="text-xs font-bold text-white px-4 py-2 rounded-xl shadow transition" 
            style={{ backgroundColor: siteSettings.primary_color }}
          >
            + Post Ad
          </Link>

          {user ? (
            <div className="relative">
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center cursor-pointer p-1"
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 shadow-sm" 
                    style={{ borderColor: siteSettings.primary_color }}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm"
                    style={{ backgroundColor: siteSettings.primary_color }}
                  >
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Dropdown Menu (Click toggle for reliability) */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  <Link 
                    href="/dashboard/my-ads" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                    <span>My Jobs</span>
                  </Link>

                  <Link 
                    href={dashboardHref} 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
                    <span>Dashboard</span>
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-xs font-bold text-gray-700 hover:text-orange-500 px-3 py-2 bg-gray-100 rounded-xl transition">
              Login
            </Link>
          )}
        </div>

        {/* 4. Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* 5. Mobile Side Menu (Drawer Style) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity md:hidden">
          <div className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Top Header inside Drawer: Logo & Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-black text-lg text-gray-900 tracking-tight">TRENDMART</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              
              {/* User Profile Box & Small Logout below it */}
              {user ? (
                <div className="space-y-1.5">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm"
                        style={{ backgroundColor: siteSettings.primary_color }}
                      >
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-gray-400 font-medium">Logged in as</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pr-1">
                    <button 
                      onClick={handleLogout}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition"
                    >
                      <LogOut className="w-3 h-3" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
              <div className="flex gap-2">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Sign Up / Login
                </Link>
                
              </div>
              )}

              {/* Navigation Menu Items */}
              <div className="space-y-1 pt-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase px-3 mb-2 tracking-wider">Navigation</p>
                
                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                >
                  <Home className="w-5 h-5 text-gray-400" /> Home
                </Link>

                <Link 
                  href="/jobs" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                >
                  <Briefcase className="w-5 h-5 text-gray-400" /> Manpower & Jobs
                </Link>

                {user && (
                  <>
                    <Link 
                      href="/dashboard/my-ads" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <Briefcase className="w-5 h-5 text-orange-500" /> My Jobs
                    </Link>

                    <Link 
                      href={dashboardHref} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <LayoutDashboard className="w-5 h-5 text-orange-500" /> Dashboard
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Footer Actions: Post Ad Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Link 
                href="/post-ad" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-sm shadow-md transition"
                style={{ backgroundColor: siteSettings.primary_color }}
              >
                <PlusCircle className="w-5 h-5" /> Post Ad
              </Link>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}