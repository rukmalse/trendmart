'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Trash2, Clock, RefreshCw, Zap } from 'lucide-react'
import Link from 'next/link'

interface Ad {
  id: string
  title: string
  category: string
  price: number
  status: string
  bump_status: string
  created_at: string
  user_id: string
}

export default function AdminMainDashboard() {
  const [pendingAds, setPendingAds] = useState<Ad[]>([])
  const [bumpAds, setBumpAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Initialize Supabase client cleanly
  const supabase = createClient()

  // 1. Fetch Pending Ads & Pending Bump Requests
  const fetchData = async () => {
    setLoading(true)

    // Fetch Pending Ads (නව හෝ Edit කළ දැන්වීම්)
    const { data: adsData } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (adsData) setPendingAds(adsData)

    // Fetch Pending Bump Requests (Bump කිරීමට ඉල්ලා ඇති දැන්වීම්)
    const { data: bumpsData } = await supabase
      .from('ads')
      .select('*')
      .eq('bump_status', 'pending')
      .order('created_at', { ascending: false })

    if (bumpsData) setBumpAds(bumpsData)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Approve or Reject Ad Status
  const handleUpdateStatus = async (id: string, actionType: 'active' | 'rejected') => {
    setActionLoading(id)
    const { error } = await supabase
      .from('ads')
      .update({ status: actionType })
      .eq('id', id)

    if (!error) {
      setPendingAds((prev) => prev.filter((ad) => ad.id !== id))
    } else {
      alert(`Failed to update status: ${error.message}`)
    }
    setActionLoading(null)
  }

  // 3. Approve or Reject Bump Request
  const handleUpdateBumpStatus = async (id: string, actionType: 'approved' | 'none') => {
    setActionLoading(id)
    const updateData: any = { bump_status: actionType }
    
    // Bump එක Approve කළහොත් දැන්වීම ඉස්මතු කිරීමට 'bumped_at' වේලාවද යාවත්කාලීන කරයි
    if (actionType === 'approved') {
      updateData.bumped_at = new Date()
    }

    const { error } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      setBumpAds((prev) => prev.filter((ad) => ad.id !== id))
    } else {
      alert(`Failed to update bump status: ${error.message}`)
    }
    setActionLoading(null)
  }

  // 4. Delete Ad
  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad permanently?')) return

    setActionLoading(id)
    const { error } = await supabase.from('ads').delete().eq('id', id)

    if (!error) {
      setPendingAds((prev) => prev.filter((ad) => ad.id !== id))
      setBumpAds((prev) => prev.filter((ad) => ad.id !== id))
    } else {
      alert(`Failed to delete ad: ${error.message}`)
    }
    setActionLoading(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Quick Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Review pending advertisements and bump requests.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ---------------- 1. PENDING BUMP REQUESTS SECTION ---------------- */}
      <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Pending Bump Requests ({bumpAds.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading bump requests...</div>
        ) : bumpAds.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No pending bump requests at this moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-center">Bump Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bumpAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <Link 
                        href={`/ads/${ad.id}`} 
                        target="_blank"
                        className="font-semibold text-gray-800 hover:text-purple-600 hover:underline block"
                      >
                        {ad.title} ↗
                      </Link>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      LKR {ad.price ? ad.price.toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateBumpStatus(ad.id, 'approved')}
                          disabled={actionLoading === ad.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Bump
                        </button>
                        <button
                          onClick={() => handleUpdateBumpStatus(ad.id, 'none')}
                          disabled={actionLoading === ad.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-semibold transition"
                        >
                          <XCircle className="w-4 h-4" /> Reject
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

      {/* ---------------- 2. PENDING ADS APPROVAL SECTION ---------------- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-800">Pending Ad Approvals ({pendingAds.length})</h2>
          </div>
          <Link
            href="/admin/ads"
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            View All Ads →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading pending ads...</div>
        ) : pendingAds.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">All caught up!</h3>
            <p className="text-gray-500 text-sm mt-1">There are no pending ads requiring review at this moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">Title & Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <Link 
                        href={`/ads/${ad.id}`} 
                        target="_blank"
                        className="font-semibold text-gray-800 hover:text-orange-600 hover:underline block"
                      >
                        {ad.title} ↗
                      </Link>
                      <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1">
                        {ad.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      LKR {ad.price ? ad.price.toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(ad.created_at).toLocaleDateString()} {new Date(ad.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(ad.id, 'active')}
                          disabled={actionLoading === ad.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                          title="Approve Ad"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                          disabled={actionLoading === ad.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
                          title="Reject Ad"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={actionLoading === ad.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete Ad"
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