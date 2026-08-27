'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Trash2, Clock, RefreshCw, Zap, Eye, CreditCard, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Ad {
  id: string
  title: string
  category: string
  price: number
  status: string
  bump_status: string
  slip_url?: string
  created_at: string
  user_id: string
}

interface BumpRequest {
  id: string
  ad_id: string
  payment_method: string
  slip_url: string
  amount: number
  status: string
  created_at: string
  ads?: {
    title: string
    price: number
  } | null
}

interface PaymentRequest {
  id: string
  created_at: string
  payment_method: string
  deposited_date: string
  deposited_time: string
  amount: number
  reference_no: string
  slip_url: string
  status: string
}

interface BannerRequest {
  id: string
  user_id: string
  business_name: string
  target_url: string
  duration_days: number
  banner_url: string
  payment_slip_url: string
  status: string
  created_at: string
}

export default function SuperAdminMainDashboard() {
  const [pendingAds, setPendingAds] = useState<Ad[]>([])
  const [bumpAds, setBumpAds] = useState<BumpRequest[]>([])
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([])
  const [bannerRequests, setBannerRequests] = useState<BannerRequest[]>([])
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false) // Super Admin authorization state එක
  
  const supabase = createClient()
  const router = useRouter()

  // 0. Check Super Admin Authorization & Fetch Data
  useEffect(() => {
    const verifySuperAdminAndFetch = async () => {
      setLoading(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.replace('/login') // Login වී නැත්නම් login page එකට යවන්න
          return
        }

        // Database එකෙන් user ගේ role එක පරීක්ෂා කිරීම (profiles table එක පාවිච්චි කර ඇත)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Super Admin කෙනෙක් නොවේ නම් (role එක 'super-admin' නොවේ නම්) කෙලින්ම Home page එකට redirect කරන්න
        if (profileError || profile?.role !== 'super-admin') {
          router.replace('/') 
          return
        }

        // Super Admin කෙනෙක් නම් පමණක් true කර data fetch කරගන්න
        setIsSuperAdmin(true)
        await fetchData()

      } catch (err) {
        console.error('Authorization error:', err)
        router.replace('/')
      }
    }

    verifySuperAdminAndFetch()
  }, [])

  // 1. Fetch Data (Optimized with Supabase Joins for Bumps)
  const fetchData = async () => {
    try {
      // Fetch Pending Ads in parallel
      const adsPromise = supabase
        .from('ads')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // Fetch Pending Bump Requests using Supabase Foreign Key Relationship (Join)
      const bumpsPromise = supabase
        .from('ad_bumps')
        .select(`
          *,
          ads (
            title,
            price
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // Fetch Pending Bank Payments
      const paymentsPromise = supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // Fetch Pending Banner Requests
      const bannersPromise = supabase
        .from('banner_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const [
        { data: adsData, error: adsError },
        { data: bumpsData, error: bumpsError },
        { data: paymentsData, error: paymentsError },
        { data: bannersData, error: bannersError }
      ] = await Promise.all([adsPromise, bumpsPromise, paymentsPromise, bannersPromise])

      if (adsError) console.error('Error fetching ads:', adsError.message)
      if (bumpsError) console.error('Error fetching bumps:', bumpsError.message)
      if (paymentsError) console.error('Error fetching payments:', paymentsError.message)
      if (bannersError) console.error('Error fetching banners:', bannersError.message)

      if (adsData) setPendingAds(adsData)
      if (bumpsData) setBumpAds(bumpsData as BumpRequest[])
      if (paymentsData) setPendingPayments(paymentsData)
      if (bannersData) setBannerRequests(bannersData)

    } catch (err) {
      console.error('Unexpected error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSlip(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 2. Approve or Reject Ad Status
  const handleUpdateStatus = async (id: string, actionType: 'active' | 'rejected') => {
    setActionLoading(id)
    const { error } = await supabase
      .from('ads')
      .update({ status: actionType })
      .eq('id', id)

    if (!error) {
      await fetchData()
    } else {
      alert(`Failed to update status: ${error.message}`)
    }
    setActionLoading(null)
  }

  // 3. Approve or Reject Bump Request
  const handleUpdateBumpStatus = async (bumpId: string, adId: string, actionType: 'approved' | 'rejected') => {
    setActionLoading(bumpId)

    const { error: bumpError } = await supabase
      .from('ad_bumps')
      .update({ status: actionType })
      .eq('id', bumpId)

    if (bumpError) {
      alert(`Database Error: ${bumpError.message}`)
      setActionLoading(null)
      return
    }

    if (adId) {
      const updatePayload: { bump_status: string; bumped_at?: string } = { 
        bump_status: actionType === 'approved' ? 'approved' : 'rejected' 
      }

      if (actionType === 'approved') {
        updatePayload.bumped_at = new Date().toISOString()
      }

      const { error: adUpdateError } = await supabase
        .from('ads')
        .update(updatePayload)
        .eq('id', adId)

      if (adUpdateError) {
        console.error('Failed to update ad bump_status:', adUpdateError.message)
      }
    }

    await fetchData()
    setActionLoading(null)
  }

  // 4. Approve or Reject Bank Payment Confirmation
  const handleUpdatePaymentStatus = async (paymentId: string, actionType: 'approved' | 'rejected') => {
    setActionLoading(paymentId)

    const { error } = await supabase
      .from('payments')
      .update({ status: actionType })
      .eq('id', paymentId)

    if (!error) {
      await fetchData()
    } else {
      alert(`Failed to update payment status: ${error.message}`)
    }
    setActionLoading(null)
  }

  // 5. Approve or Reject Banner Request
  const handleUpdateBannerStatus = async (bannerId: string, actionType: 'approved' | 'rejected') => {
    setActionLoading(bannerId)

    const { error } = await supabase
      .from('banner_requests')
      .update({ status: actionType })
      .eq('id', bannerId)

    if (!error) {
      await fetchData()
    } else {
      alert(`Failed to update banner status: ${error.message}`)
    }
    setActionLoading(null)
  }

  // 6. Delete Ad
  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad permanently?')) return

    setActionLoading(id)
    const { error } = await supabase.from('ads').delete().eq('id', id)

    if (!error) {
      await fetchData()
    } else {
      alert(`Failed to delete ad: ${error.message}`)
    }
    setActionLoading(null)
  }

  // Super Admin කෙනෙක් නොවේ නම් හෝ role එක check වෙනකම් loading screen එක පමණක් පෙන්වීම
  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm font-medium">Verifying super-admin permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Quick Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Review pending advertisements, bump requests, banner requests and bank payment slips.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ---------------- 1. PENDING BANNER REQUESTS SECTION ---------------- */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">Pending Banner Requests ({bannerRequests.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading banner requests...</div>
        ) : bannerRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No pending banner requests at this moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Target URL</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 text-center">Banner Image</th>
                  <th className="p-4 text-center">Payment Slip</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bannerRequests.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-gray-800">
                      {banner.business_name}
                    </td>
                    <td className="p-4">
                      <a 
                        href={banner.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline max-w-xs truncate block"
                      >
                        {banner.target_url} ↗
                      </a>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {banner.duration_days} Days
                    </td>
                    <td className="p-4 text-center">
                      {banner.banner_url ? (
                        <button
                          onClick={() => setSelectedSlip(banner.banner_url)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> View Banner
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">No Image</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {banner.payment_slip_url ? (
                        <button
                          onClick={() => setSelectedSlip(banner.payment_slip_url)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> View Slip
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">No Slip</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateBannerStatus(banner.id, 'approved')}
                          disabled={actionLoading === banner.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateBannerStatus(banner.id, 'rejected')}
                          disabled={actionLoading === banner.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
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

      {/* ---------------- 2. PENDING BANK PAYMENT CONFIRMATIONS SECTION ---------------- */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Payment Confirmations ({pendingPayments.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading payment requests...</div>
        ) : pendingPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No pending bank payment slips at this moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Reference / Note</th>
                  <th className="p-4 text-center">Bank Slip</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-xs text-gray-600 font-medium">
                      {payment.deposited_date || new Date(payment.created_at).toLocaleDateString()} {payment.deposited_time || ''}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      LKR {payment.amount ? payment.amount.toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-700">
                      {payment.reference_no || 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      {payment.slip_url ? (
                        <button
                          onClick={() => setSelectedSlip(payment.slip_url)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> View Slip
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">No Slip Found</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdatePaymentStatus(payment.id, 'approved')}
                          disabled={actionLoading === payment.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdatePaymentStatus(payment.id, 'rejected')}
                          disabled={actionLoading === payment.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
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

      {/* ---------------- 3. PENDING BUMP REQUESTS SECTION ---------------- */}
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
                  <th className="p-4">Ad Title</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-center">Bank Slip</th>
                  <th className="p-4 text-center">Bump Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bumpAds.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <Link 
                        href={`/ads/${item.ad_id}`} 
                        target="_blank"
                        className="font-semibold text-gray-800 hover:text-purple-600 hover:underline block"
                      >
                        {item.ads?.title || 'View Advertisement'} ↗
                      </Link>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      LKR {item.amount ? item.amount.toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      {item.slip_url ? (
                        <button
                          onClick={() => setSelectedSlip(item.slip_url)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> View Slip
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">No Slip Found</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateBumpStatus(item.id, item.ad_id, 'approved')}
                          disabled={actionLoading === item.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Bump
                        </button>
                        <button
                          onClick={() => handleUpdateBumpStatus(item.id, item.ad_id, 'rejected')}
                          disabled={actionLoading === item.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
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

      {/* ---------------- 4. PENDING ADS APPROVAL SECTION ---------------- */}
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
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                          title="Approve Ad"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                          disabled={actionLoading === ad.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                          title="Reject Ad"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={actionLoading === ad.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
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

      {/* ---------------- SLIP / BANNER PREVIEW MODAL ---------------- */}
      {selectedSlip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedSlip(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Preview Image</h3>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="flex justify-center bg-gray-50 p-4 rounded-xl max-h-[70vh] overflow-auto">
              <img 
                src={selectedSlip} 
                alt="Preview" 
                className="max-w-full h-auto object-contain rounded-lg border shadow-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a 
                href={selectedSlip} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
              >
                Open in New Tab ↗
              </a>
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}