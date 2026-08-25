'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Eye } from 'lucide-react'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null)
  const supabase = createClient()

  const fetchBanners = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('carousel_ads')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setBanners(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleUpdateStatus = async (id: string, status: 'active' | 'rejected') => {
    const { error } = await supabase
      .from('carousel_ads')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert('Failed: ' + error.message)
    } else {
      fetchBanners()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Carousel Banners</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No banner requests found.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Slip</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-800">{b.title}</td>
                  <td className="p-4 font-bold">LKR {b.amount?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      b.status === 'active' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {b.slip_url && (
                      <button
                        onClick={() => setSelectedSlip(b.slip_url)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Slip
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'active')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'rejected')}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold">Payment Slip</h3>
              <button onClick={() => setSelectedSlip(null)} className="font-bold text-lg">✕</button>
            </div>
            <img src={selectedSlip} alt="Slip" className="w-full h-auto rounded border" />
          </div>
        </div>
      )}
    </div>
  )
}