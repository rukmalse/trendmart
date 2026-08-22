'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Search, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const supabase = createClient()

  const fetchAllAds = async () => {
    setLoading(true)
    let query = supabase.from('ads').select('*').order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    if (!error && data) {
      setAds(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAllAds()
  }, [statusFilter])

  // Status එක වෙනස් කිරීම සඳහා (Active/Approved හෝ Rejected කිරීමට)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Failed to update status: ' + error.message)
    } else {
      // සාර්ථක නම් ලැයිස්තුව යාවත්කාලීන කරන්න
      setAds((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, status: newStatus } : ad))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    const { error } = await supabase.from('ads').delete().eq('id', id)
    if (!error) {
      setAds((prev) => prev.filter((ad) => ad.id !== id))
    } else {
      alert('Failed to delete: ' + error.message)
    }
  }

  const filteredAds = ads.filter((ad) =>
    ad.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage All Ads</h1>
          <p className="text-xs text-gray-500 mt-1">View, search, filter, approve and delete system advertisements.</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active (Approved)</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading advertisements...</div>
        ) : filteredAds.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No ads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="p-4">Ad Title</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-800">
                      <Link 
                        href={`/ads/${ad.id}`} 
                        className="hover:text-orange-600 hover:underline transition"
                      >
                        {ad.title}
                      </Link>
                    </td>
                    <td className="p-4 font-bold">LKR {Number(ad.price || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        ad.status === 'active' ? 'bg-green-100 text-green-700' :
                        ad.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approve Button */}
                        {ad.status !== 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(ad.id, 'active')}
                            title="Approve Ad"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                        )}

                        {/* Reject Button */}
                        {ad.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                            title="Reject Ad"
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg text-xs font-bold transition"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(ad.id)}
                          title="Delete Ad"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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