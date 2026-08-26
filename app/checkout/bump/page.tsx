'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle2, ArrowLeft, Loader2, CreditCard } from 'lucide-react'
import Link from 'next/link'

function BumpCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adId = searchParams.get('ad_id')
  
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bankLoading, setBankLoading] = useState(true)
  
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Bank of Ceylon',
    accountNo: '1234567890',
    accountName: 'TrendMart IT Solutions',
    branch: 'Dambulla'
  })

  const supabase = createClient()

  // ඩේටාබේස් එකෙන් බැංකු විස්තර ඩයිනමික් ලෙස ලබා ගැනීම
  useEffect(() => {
    async function fetchBankInfo() {
      try {
        setBankLoading(true)
        const { data, error } = await supabase
          .from('settings')
          .select('bank_name, account_number, account_name, bank_branch')
          .single()

        if (data && !error) {
          setBankDetails({
            bankName: data.bank_name || 'Bank of Ceylon',
            accountNo: data.account_number || '1234567890',
            accountName: data.account_name || 'TrendMart IT Solutions',
            branch: data.bank_branch || 'Dambulla'
          })
        }
      } catch (err) {
        console.error('Error fetching bank details:', err)
      } finally {
        setBankLoading(false)
      }
    }

    fetchBankInfo()
  }, [supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleBumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !adId) {
      alert('Please select your bank payment slip and ensure Ad ID is present.')
      return
    }

    setLoading(true)

    // 1. Upload Slip to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `bump_${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(fileName, file)

    if (uploadError) {
      alert('Slip upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('payment-slips')
      .getPublicUrl(fileName)

    const slipUrl = publicUrlData.publicUrl

    // 2. Insert record into ad_bumps table
    const { error: dbError } = await supabase.from('ad_bumps').insert({
      ad_id: adId,
      slip_url: slipUrl,
      amount: 500, // Bump ගාස්ුව
      payment_method: 'Bank Transfer',
      status: 'pending'
    })

    if (dbError) {
      alert('Database error: ' + dbError.message)
      setLoading(false)
      return
    }

    // 3. Update ads table bump_status to 'pending' so it tracks properly
    const { error: adUpdateError } = await supabase
      .from('ads')
      .update({ bump_status: 'pending' })
      .eq('id', adId)

    if (adUpdateError) {
      console.error('Failed to update ad bump_status:', adUpdateError.message)
    }

    alert('Bump request and slip submitted successfully!')
    router.push('/dashboard')
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Request Bump Advertisement</h1>
          <p className="text-xs text-gray-500 mt-0.5">ඔබගේ දැන්වීම මුල් පිටුවට ඉහළට ගෙන ඒම සඳහා ගෙවීම සිදු කර බැංකු රුපියත (Slip) පහතින් Upload කරන්න.</p>
        </div>
      </div>

      {/* 💳 ගෙවීම් කළ යුතු බැංකු ගිණුම් විස්තර (Banner Ad පේජ් එකේ වැනි නිල් පාට බොක්ස් එක) */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2 text-xs text-blue-950">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>ගෙවීම් කළ යුතු බැංකු ගිණුම් විස්තර</span>
        </div>

        {bankLoading ? (
          <p className="text-gray-500 py-2">Loading bank details...</p>
        ) : (
          <div className="space-y-1.5 font-medium text-gray-700">
            <p>ගිණුමේ නම: <span className="font-bold text-gray-900">{bankDetails.accountName}</span></p>
            <p>ගිණුම් අංකය: <span className="font-bold text-gray-900 select-all">{bankDetails.accountNo}</span></p>
            <p>බැංකුව සහ ශාඛාව: <span className="font-bold text-gray-900">{bankDetails.bankName}, {bankDetails.branch}</span></p>
          </div>
        )}
        <div className="pt-2 border-t border-blue-200/60 font-bold text-blue-900 text-sm">
          ගාස්ුව: Rs. 500/= ක් වේ.
        </div>
      </div>

      <form onSubmit={handleBumpSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Upload Bank Slip</label>
          <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/50 transition">
            {preview ? (
              <div className="text-center space-y-2">
                <img src={preview} alt="Slip preview" className="max-h-40 mx-auto rounded-xl shadow border" />
                <p className="text-xs text-blue-600 font-semibold">වෙනස් කිරීමට නැවත ක්ලික් කරන්න</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Upload className="w-8 h-8 text-blue-500 mx-auto animate-bounce" />
                <p className="text-xs font-semibold text-gray-700">Click to select payment slip image</p>
                <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Submit Payment Slip</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function BumpCheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-medium">Loading...</div>}>
      <BumpCheckoutContent />
    </Suspense>
  )
}