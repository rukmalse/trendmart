'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Upload, Save, Palette, Phone, ShieldAlert, BarChart3, User, Users, Search, RefreshCw, Trash2, Calendar, Mail } from 'lucide-react'

export default function SuperAdminDashboard() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [siteName, setSiteName] = useState('Trend Mart')
  const [primaryColor, setPrimaryColor] = useState('#f97316')
  const [contactNumber, setContactNumber] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  // Profile Picture States
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  // Report State
  const [reports, setReports] = useState<any[]>([])

  // User Management States
  const [usersList, setUsersList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch Data Function
  const fetchData = async () => {
    setFetching(true)

    // 1. Fetch Settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsData) {
      setSiteName(settingsData.site_name || 'Trend Mart')
      setPrimaryColor(settingsData.primary_color || '#f97316')
      setContactNumber(settingsData.contact_number || '')
      setLogoPreview(settingsData.logo_url || '')
      setAvatarPreview(settingsData.admin_avatar_url || '')
    }

    // 2. Fetch Reports / Platform Data
    const { data: reportData } = await supabase
      .from('ads')
      .select('*')
      .limit(10)

    if (reportData) {
      setReports(reportData)
    }

    // 3. Fetch Users & Total Ads Count
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!profileError && profiles) {
      const usersWithAds = await Promise.all(
        profiles.map(async (user) => {
          const { count } = await supabase
            .from('ads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          return {
            ...user,
            ads_count: count || 0,
          }
        })
      )
      setUsersList(usersWithAds)
    }

    setFetching(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Update User Role Handler
  const handleRoleChange = async (id: string, newRole: string) => {
    setActionLoading(id)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (!error) {
      setUsersList((prev) =>
        prev.map((user) => (user.id === id ? { ...user, role: newRole } : user))
      )
      alert('User role updated successfully!')
    } else {
      alert(`Failed to update role: ${error.message}`)
    }
    setActionLoading(null)
  }

  // Delete User Profile Handler
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user profile?')) return

    setActionLoading(id)
    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (!error) {
      setUsersList((prev) => prev.filter((user) => user.id !== id))
    } else {
      alert(`Failed to delete user: ${error.message}`)
    }
    setActionLoading(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let logoUrl = logoPreview
    let avatarUrl = avatarPreview

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `settings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, logoFile)

      if (uploadError) {
        alert('Logo upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath)

      logoUrl = publicUrlData.publicUrl
    }

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar_${Date.now()}.${fileExt}`
      const filePath = `settings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, avatarFile)

      if (uploadError) {
        alert('Avatar upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath)

      avatarUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase
      .from('settings')
      .update({
        site_name: siteName,
        primary_color: primaryColor,
        contact_number: contactNumber,
        logo_url: logoUrl,
        admin_avatar_url: avatarUrl,
        updated_at: new Date(),
      })
      .eq('id', 1)

    setLoading(false)

    if (error) {
      alert('Error updating settings: ' + error.message)
    } else {
      alert('සුපර් ඇඩ්මින් ප්‍රොෆයිලය සහ සැකසුම් සාර්ථකව යාවත්කාලීන කරන ලදී!')
      router.refresh()
    }
  }

  // Filtered Users for Search
  const filteredUsers = usersList.filter(
    (user) =>
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (fetching) {
    return <div className="text-center py-20 font-bold text-gray-600">Loading Super Admin Dashboard...</div>
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="bg-white p-8 rounded-3xl border shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-orange-600" /> Super Admin Control Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage profile picture, platform branding, footer contact number, users, and reports.</p>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-gray-100 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Admin Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white p-8 rounded-3xl border shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" /> Manage Registered Users & Roles
              </h2>
              <p className="text-sm text-gray-500">View user accounts, change roles (Admin / User), and monitor postings.</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Users
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-left border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-50 border-b text-xs uppercase text-gray-600">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4 text-center">Total Ads</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-900">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold">{user.full_name || 'Anonymous User'}</div>
                        <div className="text-xs text-gray-400 font-mono">ID: {user.id.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className="bg-gray-50 border border-gray-300 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-full text-xs">
                          {user.ads_count} Ads
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings & Profile Form Section */}
        <div className="bg-white p-8 rounded-3xl border shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-600" /> Super Admin Profile & Settings
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Super Admin Profile Picture Upload */}
            <div className="bg-gray-50 p-6 rounded-2xl border space-y-3">
              <label className="block text-sm font-bold text-gray-800">Super Admin Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-white flex items-center justify-center shadow-inner">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 flex items-center shadow-sm transition">
                  <Upload className="w-4 h-4 mr-2 text-orange-500" />
                  Change Profile Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Contact Number Field */}
            <div className="bg-orange-50 p-5 rounded-2xl border-2 border-orange-400 space-y-2 shadow-sm">
              <label className="text-sm font-bold text-orange-900 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-orange-600" /> 
                Footer Contact Number (මෙතැනට අංකය ඇතුළත් කරන්න)
              </label>
              <p className="text-xs text-orange-700">මෙම අංකය වෙබ් අඩවියේ පතුලේ (Footer) ස්වයංක්‍රීයව දිස්වේ.</p>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="උදා: 0760661264"
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 focus:border-orange-600 focus:outline-none text-base font-bold bg-white text-gray-900"
              />
            </div>

            {/* Site Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website Logo</label>
              <div className="flex items-center space-x-4">
                {logoPreview ? (
                  <div className="w-20 h-20 border rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center p-1">
                    <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 border rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    No Logo
                  </div>
                )}
                
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 flex items-center shadow-sm transition">
                  <Upload className="w-4 h-4 mr-2 text-orange-500" />
                  Upload New Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Palette className="w-4 h-4 mr-1.5 text-orange-500" /> Theme Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border cursor-pointer p-1 bg-white"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 px-4 py-2.5 rounded-xl border text-sm uppercase font-mono text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 text-base flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving Changes...' : 'Save Super Admin Settings'}
            </button>
          </form>
        </div>

        {/* Reports Section */}
        <div className="bg-white p-8 rounded-3xl border shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" /> Platform Activity Reports
          </h2>
          <p className="text-sm text-gray-500">Overview of recent platform listings and submissions.</p>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-sm text-gray-700">
                  <th className="p-4">ID</th>
                  <th className="p-4">Title / Name</th>
                  <th className="p-4">Status / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-900">
                {reports.length > 0 ? (
                  reports.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs">{item.id}</td>
                      <td className="p-4 font-semibold">{item.title || item.name || 'N/A'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                          {item.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">No report records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}