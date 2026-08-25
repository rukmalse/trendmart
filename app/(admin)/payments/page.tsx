'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, CheckCircle, XCircle, FileText, Clock, Loader2 } from 'lucide-react'

export default function AdminPaymentsPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ඩේටාබේස් එකෙන් පේමන්ට් ලැයිස්තුව ලබා ගැනීම
  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Approve හෝ Reject කිරීමේ ෆන්ක්ෂන් එක
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id)
    const { error } = await supabase
      .from('payments')
      .update({ status: status })
      .eq('id', id)

    if (error) {
      alert('තත්ත්වය යාවත්කාලීන කිරීමේ දෝෂයක් මතු විය: ' + error.message)
    } else {
      fetchPayments()
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" /> බැංකු තැන්පතු ස්ලිප් පරීක්ෂාව (Admin Payments)
          </h1>
          <p className="text-xs text-gray-500 mt-1">පරිශීලකයින් විසින් උඩුගත කරන ලද බැංකු ස්ලිප් පරීක්ෂා කර අනුමත කරන්න.</p>
        </div>
        <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold">
          සොමු මුළු ඉල්ලීම්: {payments.length}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            තවමත් බැංකු තැන්පතු ඉල්ලීම් කිසිවක් ලැබී නැත.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                  <th className="p-4 font-bold">දිනය සහ වේලාව</th>
                  <th className="p-4 font-bold">මුදල (LKR)</th>
                  <th className="p-4 font-bold">විමර්ශන / නම</th>
                  <th className="p-4 font-bold">ස්ලිප් පත (Slip)</th>
                  <th className="p-4 font-bold">තත්ත්වය (Status)</th>
                  <th className="p-4 font-bold text-right">ක්‍රියාමාර්ග (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {payments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-gray-700">
                      <div className="font-bold">{item.deposited_date}</div>
                      <div className="text-xs text-gray-400">{item.deposited_time}</div>
                    </td>
                    <td className="p-4 font-black text-gray-900">
                      LKR {item.amount?.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {item.reference_no || 'සඳහන් කර නැත'}
                    </td>
                    <td className="p-4">
                      {item.slip_url && item.slip_url !== 'No URL' ? (
                        <a 
                          href={item.slip_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                        >
                          <FileText className="w-4 h-4" /> ස්ලිප් එක බලන්න
                        </a>
                      ) : (
                        <span className="text-xs text-red-400">ලබා දී නැත</span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> අනුමතයි (Approved)
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> ප්‍රතික්ෂේපිතයි (Rejected)
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> පරීක්ෂා කරමින් (Pending)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {actionLoading === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin inline text-orange-600" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                            disabled={item.status === 'approved'}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                            disabled={item.status === 'rejected'}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-30"
                          >
                            Reject
                          </button>
                        </>
                      )}
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