'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostBannerPage() {
  const [title, setTitle] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('') // බැනර් පින්තූරය සඳහා
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null) // බැංකු ਸ്ലਿප් එක සඳහා
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('කරුණාකර බැංකු ს്ലිප් (Bank Slip) එකක් Upload කරන්න.')
      return
    }

    setLoading(true)

    try {
      // 1. Get current logged in user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('ബാനർ ਪୋസ്റ്റ് කිරීමට පෙර කරුණාකර Login වන්න.')
        router.push('/login')
        return
      }

      // 2. Upload Slip to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `banner-slips/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ads')
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
        image_url: imageUrl, // නිවැරදි බැනර් ඉමේජ් ලින්ක් එක
        slip_url: publicUrl,
        amount: Number(amount),
        status: 'pending'
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTitle('')
      setTargetUrl('')
      setImageUrl('')
      setAmount('')
      setFile(null)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-sm border border-gray-200 my-10">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Post a Carousel Banner Ad</h1>
      <p className="text-sm text-gray-500 mb-6">Promote your business at the top of our website.</p>

      {success ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center text-sm font-medium">
          Banner request submitted successfully! Admin will review and activate it soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Banner Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
              placeholder="E.g., Special Sale - 50% Off"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target Website Link (URL)</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Banner Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
              placeholder="Paste banner image direct link"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Paid Amount (LKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Bank Payment Slip</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition shadow-md"
          >
            {loading ? 'Submitting...' : 'Submit Banner Request'}
          </button>
        </form>
      )}
    </div>
  )
}