'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Mail, Search, RefreshCw, Calendar, Trash2 } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  const fetchUsers = async () => {
    setLoading(true)
    // 1. Profiles ටේබල් එකෙන් ඩේටා ලබා ගැනීම
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && profiles) {
      // 2. එක් එක් යූසර් දමා ඇති ඇඩ්ස් ගණන (Total Ads) සොයා ගැනීම
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

  // User Role එක වෙනස් කිරීම (Admin / User)
  const handleRoleChange = async (id: string, newRole: string) => {
    setActionLoading(id)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (!error) {
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, role: newRole } : user))
      )
      alert('User role updated successfully!')
    } else {
      alert(`Failed to update role: ${error.message}`)
    }
    setActionLoading(null)
  }

  // යූසර් ප්‍රොފައިල් එකක් ඉවත් කිරීම (Delete)
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

  // නම හෝ ඊමේල් එක මඟින් සෙවුම් කිරීම (Search Filter)
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Registered members, roles, and service provider accounts.</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No registered profiles found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4 text-center">Total Ads</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{user.full_name || 'Unnamed User'}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {user.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className="bg-gray-50 border border-gray-300 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full text-xs">
                        {user.ads_count} Ads
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
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
                        title="Delete User"
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