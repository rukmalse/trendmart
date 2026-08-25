'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostBannerPage() {
  const [title, setTitle] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('لطفاً ബാങ്ക് സ്ലിപ്പ് (Bank Slip) upload করুন') // හෝ alert එකක්
      return
    }

    setLoading(true)

    try {
      // 1. Get current logged in user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login first to post a banner.')
        router.push('/login')
        return
      }

      // 2. Upload Slip to Supabase Storage (storage bucket එකේ name එක 'slips' හෝ 'ads' විය යුතුය)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `banner-slips/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ads') // ඔබේ storage bucket නම මෙහි දෙන්න
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL of the slip
      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath)

      // 3. Insert into carousel_ads table
      const { error: insertError } = await supabase.from('carousel_ads').insert({
        user_id: user.id,
        title,
        target_url: targetUrl,
        image_url: targetUrl, // (සටහන: මෙහි banner image එක වෙනම upload කරනවා නම් වෙනම logic එකක් දෙන්න පුළුවන්, නැතහොත් target_url එකම පාවිච්චි කරන්න පුළුවන්. පහත දැක්වෙන්නේ මූලික සැකැස්මයි)
        slip_url: publicUrl,
        amount: Number(amount),
        status: 'pending'
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTitle('')
      setTargetUrl('')
      setAmount('')
      setFile(null)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border my-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Post a Carousel Banner Ad</h1>
      <p className="text-sm text-gray-500 mb-6">Promote your business at the top of our website.</p>

      {success ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
          Banner request submitted successfully! Admin will review and activate it soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Banner Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded-lg text-sm"
              placeholder="E.g., Special Sale - 50% Off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Website Link (URL)</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded-lg text-sm"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Banner Image URL (හෝ පින්තූරයක් දමන්න)</label>
            <input
              type="text"
              onChange={(e) => setTargetUrl(e.target.value)} // අවශ්‍ය නම් වෙනම image upload එකක්ද එක් කළ හැක
              required
              className="w-full mt-1 p-2 border rounded-lg text-sm"
              placeholder="Paste banner image direct link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Paid Amount (LKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded-lg text-sm"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Payment Slip</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm transition"
          >
            {loading ? 'Submitting...' : 'Submit Banner Request'}
          </button>
        </form>
      )}
    </div>
  )
}