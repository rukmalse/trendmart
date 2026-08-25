'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, Upload, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'

export default function BankDepositPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Commercial Bank',
    accountNo: '8027679803',
    accountName: 'H M R Senanayaka',
    branch: 'Teldeniya'
  })

  const [formData, setFormData] = useState({
    depositedDate: '',
    depositedTime: '',
    amount: '',
    referenceNo: ''
  })
  const [slipFile, setSlipFile] = useState<File | null>(null)

  // Hydration ගැටළු මඟහරවා ගැනීමට මෙය අත්‍යවශ්‍ය වේ
  useEffect(() => {
    setMounted(true)

    async function fetchBankInfo() {
      const { data } = await supabase
        .from('settings')
        .select('bank_name, account_number, account_name, bank_branch')
        .eq('id', 1)
        .single()

      if (data) {
        setBankDetails({
          bankName: data.bank_name || 'Commercial Bank',
          accountNo: data.account_number || '1234567890',
          accountName: data.account_name || 'Trend Mart',
          branch: data.bank_branch || 'Main Branch'
        })
      }
    }
    fetchBankInfo()
  }, [])

  if (!mounted) {
    return null // Server එකේදී සහ මුල් රෙන්ඩර් එකේදී Hydration මඟහරවයි
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slipFile) {
      alert('කරුණාකර බැංකු ස්ලිප් පතේ පින්තූරය උඩුගත කරන්න.')
      return
    }

    setSubmitting(true)
    try {
      const fileExt = slipFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `payment-slips/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, slipFile)

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from('slips')
        .getPublicUrl(filePath)

      const slipUrl = publicUrlData?.publicUrl || 'No URL'

      const { error: dbError } = await supabase
        .from('payments')
        .insert([
          {
            payment_method: 'bank_deposit',
            deposited_date: formData.depositedDate,
            deposited_time: formData.depositedTime,
            amount: parseFloat(formData.amount),
            reference_no: formData.referenceNo,
            slip_url: slipUrl,
            status: 'pending'
          }
        ])

      if (dbError) {
        throw dbError
      }

      setSuccess(true)
    } catch (error: any) {
      alert('ගැටළුවක් මතු විය: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-black text-gray-900">ස්ලිප් පත සාර්ථකව යවන ලදී!</h2>
          <p className="text-sm text-gray-500">
            ඔබගේ බැංකු තැන්පතුව අප වෙත ලැබී ඇත. ඇඩ්මින්වරයා විසින් එය පරීක්ෂා කර ඉක්මනින්ම ඔබේ ගිණුම සක්‍රීය කරනු ඇත.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition shadow-md"
          >
            ප්‍රධාන පිටුවට යන්න (Home)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> ආපසු යන්න (Back)
        </button>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          
          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-orange-600" /> බැංකු තැන්පතු විස්තර (Bank Deposit)
            </h1>
            <p className="text-xs text-gray-500">පහත සඳහන් බැංකු ගිණුමකට මුදල් තැන්පත් කර, අදාළ විස්තර සහ ස්ලිප් පත පහතින් අමුණන්න.</p>
          </div>

          <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">බැංකුව (Bank):</span>
              <span className="font-bold text-gray-900">{bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ගිණුම් අංකය (Account No):</span>
              <span className="font-bold text-gray-900 select-all">{bankDetails.accountNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ගිණුමේ නම (Account Name):</span>
              <span className="font-bold text-gray-900">{bankDetails.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ශාඛාව (Branch):</span>
              <span className="font-bold text-gray-900">{bankDetails.branch}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">තැන්පත් කළ දිනය (Date)</label>
                <input 
                  type="date" 
                  required
                  value={formData.depositedDate}
                  onChange={(e) => setFormData({...formData, depositedDate: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">වේලාව (Time)</label>
                <input 
                  type="time" 
                  required
                  value={formData.depositedTime}
                  onChange={(e) => setFormData({...formData, depositedTime: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">මුළු මුදල (Amount - LKR)</label>
              <input 
                type="number" 
                placeholder="උදා: 6999"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">විමර්ශන අංකය / නම (Reference / Note)</label>
              <input 
                type="text" 
                placeholder="ඔබේ නම හෝ රිසිට් අංකය"
                value={formData.referenceNo}
                onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">බැංකු ස්ලිප් පත (Upload Slip Image/PDF)</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-orange-600 bg-gray-50/50 transition">
                <Upload className="w-8 h-8 text-orange-600 mb-2" />
                <span className="text-xs font-bold text-gray-700">
                  {slipFile ? slipFile.name : 'ස්ලිප් පත තෝරන්න (Browse File)'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG හෝ PDF (උපරිම 5MB)</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => e.target.files && setSlipFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {submitting ? 'යවමින් පවතී...' : 'ස්ලිප් පත තහවුරු කරන්න (Submit Slip)'}
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}