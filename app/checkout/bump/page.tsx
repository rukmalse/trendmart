'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function BumpCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adId = searchParams.get('ad_id')
  
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
      amount: 500, // Bump ගාස්ුව (අවශ්‍ය පරිදි වෙනස් කරන්න)
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
    router.push('/dashboard') // සාර්ථක වූ පසු ඩෑෂ්බෝඩ් එකට යැවීම
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Bump Advertisement Payment</h1>
      </div>

      <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-900 space-y-1">
        <p className="font-bold">Instructions:</p>
        <p>1. Please transfer the Bump Fee (e.g., LKR 500) to our bank account.</p>
        <p>2. Upload your bank deposit slip below for verification.</p>
      </div>

      <form onSubmit={handleBumpSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Upload Bank Slip</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border p-3 rounded-xl text-sm bg-gray-50 cursor-pointer"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          {loading ? 'Submitting...' : 'Submit Payment Slip'}
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