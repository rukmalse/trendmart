'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Users, Search, RefreshCw, Trash2, Calendar, Mail, ShieldAlert } from 'lucide-react'

interface UserProfile {
  id: string
  email?: string
  full_name?: string
  created_at: string
  ads_count?: number
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch Profiles / Users Data
  const fetchUsers = async () => {
    setLoading(true)
    
    // Fetch user profiles along with their total ads count
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && profiles) {
      // Optional: Fetch ad counts per user
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
      setUsers(usersWithAds)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Delete User Profile
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user profile? This action cannot be undone.')) return

    setActionLoading(id)
    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (!error) {
      setUsers((prev) => prev.filter((user) => user.id !== id))
    } else {
      alert(`Failed to delete user: ${error.message}`)
    }
    setActionLoading(null)
  }

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Registered Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            View user accounts, registration details, and posted ads count.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Users
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading users data...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Total Ads</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">
                        {user.full_name || 'Anonymous User'}
                      </div>
                      <div className="text-xs text-gray-400">ID: {user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{user.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-full text-xs">
                        {user.ads_count} Ads
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remove User Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}