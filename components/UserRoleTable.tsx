'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UserRoleTable({ users }: { users: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleEditClick = (user: any) => {
    setEditingId(user.id)
    setSelectedRole(user.role || 'user')
  }

  const handleSaveRole = async (userId: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: selectedRole })
      .eq('id', userId)

    if (error) {
      alert('Error updating role: ' + error.message)
    } else {
      setEditingId(null)
      router.refresh() // Page එක Refresh කර අලුත් Role එක පෙන්වීම
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b font-bold text-lg">Manage Users & Roles</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="p-4">Name / Email</th>
              <th className="p-4">Current Role</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition">
                
                {/* Email and Name Display */}
                <td className="p-4">
                  <p className="font-bold text-gray-900">{u.full_name || 'No Name'}</p>
                  <p className="text-xs text-gray-500">{u.email || 'No Email'}</p>
                </td>

                {/* Role Badge or Dropdown */}
                <td className="p-4">
                  {editingId === u.id ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="border rounded-lg px-2 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="provider">Provider</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                      u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'provider' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  )}
                </td>

                {/* Edit and Save Action Buttons */}
                <td className="p-4">
                  {editingId === u.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveRole(u.id)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Edit Role
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}