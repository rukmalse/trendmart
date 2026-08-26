'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, LayoutDashboard, Menu, X, Megaphone, Briefcase } from 'lucide-react'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('customer')
  const [avatarUrl, setAvatarUrl] = useState<string>('') 
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Trend Mart',
    logo_url: '',
    primary_color: '#f97316'
  })

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          if (profile.role) setUserRole(profile.role)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
        }
      }
      setLoading(false)
    }
    checkUser()

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
      setUser(session?.user || null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', session.user.id)
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
          <Link href="/request-banner" className="text-sm font-bold text-gray-700 hover:text-orange-500 transition flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-orange-500" />
            Request Banner
          </Link>
        </nav>

        {/* 3. User State & Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {!loading && (
            user ? (
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                <Link href="/profile" className="hover:text-orange-500 font-medium flex items-center gap-2" title="View Profile">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="truncate max-w-[100px]">{user.email}</span>
                </Link>

                <span className="text-gray-300">|</span>

                <Link href="/dashboard/my-ads" className="flex items-center gap-1 font-bold text-gray-700 hover:text-orange-600 transition" title="My Ads">
                  <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                  <span>My Jobs</span>
                </Link>

                <span className="text-gray-300">|</span>

                <Link href={dashboardHref} className="flex items-center gap-1 font-bold transition" style={{ color: siteSettings.primary_color }} title="Dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <span className="text-gray-300">|</span>

                <button onClick={handleLogout} className="text-red-500 hover:underline font-bold">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-bold text-gray-700 hover:text-orange-500 px-3 py-2">
                Login
              </Link>
            )
          )}

          <Link href="/services/create" className="text-xs font-bold px-3 py-2 rounded-xl border transition" style={{ color: siteSettings.primary_color, backgroundColor: `${siteSettings.primary_color}10`, borderColor: `${siteSettings.primary_color}30` }}>
            + Post Service
          </Link>

          <Link href="/jobs/create" className="text-xs font-bold text-white px-4 py-2 rounded-xl shadow transition" style={{ backgroundColor: siteSettings.primary_color }}>
            + Post Job
          </Link>
        </div>

        {/* 4. Mobile Menu Toggle & Quick Buttons */}
        <div className="flex md:hidden items-center space-x-2">
          <Link 
            href="/services/create" 
            className="text-[11px] font-bold text-white px-2.5 py-1.5 rounded-lg shadow"
            style={{ backgroundColor: siteSettings.primary_color }}
          >
            + Post
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* 5. Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-700 border-b"
          >
            Home
          </Link>
          <Link 
            href="/jobs" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-700 border-b"
          >
            Manpower & Jobs
          </Link>
          <Link 
            href="/request-banner" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-bold text-gray-700 border-b"
          >
            <Megaphone className="w-4 h-4 text-orange-500" /> Request Banner Ad
          </Link>
          <Link 
            href="/services/create" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-orange-600 border-b"
          >
            + Post a Service
          </Link>

          {!loading && (
            user ? (
              <div className="space-y-2 pt-2">
                <Link 
                  href="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded-xl"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold truncate">{user.email}</span>
                </Link>

                <Link 
                  href="/dashboard/my-ads"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-bold text-gray-800 border-b"
                >
                  <Briefcase className="w-4 h-4 text-orange-500" /> My Posted Ads
                </Link>

                <Link 
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-bold text-gray-800 border-b"
                >
                  <LayoutDashboard className="w-4 h-4 text-orange-500" /> Dashboard
                </Link>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-sm font-bold text-red-500 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2.5 bg-gray-100 rounded-xl font-bold text-sm text-gray-800"
                >
                  Login / Register
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </header>
  )
}