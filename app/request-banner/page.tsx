'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Upload, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react'

export default function RequestBannerPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form Fields
  const [businessName, setBusinessName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [durationDays, setDurationDays] = useState('7') // Default 7 days
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      if (error || !currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!bannerFile) {
      alert('කරුණාකර Banner Image එකක් තෝරන්න!')
      return
    }

    if (!slipFile) {
      alert('කරුණාකර ගෙවීම කළ Bank Slip එකේ Image එකක් Upload කරන්න!')
      return
    }

    try {
      setSubmitting(true)

      // 1. Upload Banner Image
      const bannerExt = bannerFile.name.split('.').pop()
      const bannerFileName = `banner-${user.id}-${Math.random()}.${bannerExt}`
      const { error: bannerUploadError } = await supabase.storage
        .from('banners') // Ensure you have a 'banners' bucket or change bucket name as needed
        .upload(bannerFileName, bannerFile)

      if (bannerUploadError) {
        // If storage bucket name differs, throw error or fallback
        throw new Error('Banner Image upload failed: ' + bannerUploadError.message)
      }

      const { data: { publicUrl: bannerPublicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(bannerFileName)

      // 2. Upload Payment Slip Image
      const slipExt = slipFile.name.split('.').pop()
      const slipFileName = `banner-slip-${user.id}-${Math.random()}.${slipExt}`
      const { error: slipUploadError } = await supabase.storage
        .from('slips') // Using 'slips' bucket (same as ad bumps)
        .upload(slipFileName, slipFile)

      if (slipUploadError) {
        throw new Error('Slip upload failed: ' + slipUploadError.message)
      }

      const { data: { publicUrl: slipPublicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(slipFileName)

      // 3. Save Request to Database (e.g. banner_requests table)
      const { error: insertError } = await supabase
        .from('banner_requests')
        .insert([
          {
            user_id: user.id,
            business_name: businessName,
            target_url: targetUrl,
            duration_days: parseInt(durationDays),
            banner_url: bannerPublicUrl,
            payment_slip_url: slipPublicUrl,
            status: 'pending'
          }
        ])

      if (insertError) {
        throw new Error('Database insert error: ' + insertError.message)
      }

      alert('ඔබගේ Banner Ad ඉල්ලීම සහ Bank Slip එක සාර්ථකව Admin වෙත යවන ලදී! අනුමැතියෙන් පසු එය ප්‍රදර්ශනය කෙරේ.')
      router.push('/dashboard')

    } catch (error: any) {
      alert('දෝෂයක් ඇති විය: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-orange-500" /> Request Banner Ad
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            මුල් පිටුවේ ප්‍රධාන කැරුසල් බැනර් එකක් සඳහා ඔබේ දැන්වීම යොමු කරන්න. ගෙවීම සිදු කර බැංකු ලදුපත (Slip) පහතින් Upload කරන්න.
          </p>
        </div>

        {/* Bank Details Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 space-y-3">
          <h3 className="font-bold text-blue-900 text-sm">💳 ගෙවීම් කළ යුතු බැංකු ගිණුම් විස්තර</h3>
          <div className="text-xs text-blue-800 space-y-1 font-medium">
            <p>ගිණුමේ නම: <span className="font-bold">TrendMart IT Solutions</span></p>
            <p>ගිණුම් අංකය: <span className="font-bold">1234567890</span></p>
            <p>බැංකුව සහ ශාඛාව: <span className="font-bold">Bank of Ceylon, Dambulla</span></p>
            <p className="text-[11px] text-blue-600 pt-1">ගාස්තුව: 7 දිනකට LKR 1,500/= ක් වේ.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Business / Brand Name</label>
            <input 
              type="text" 
              required
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)} 
              placeholder="උදා: SL Hanguk Education" 
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Target Link (Website / Ad / Store URL)</label>
            <input 
              type="text" 
              required
              value={targetUrl} 
              onChange={(e) => setTargetUrl(e.target.value)} 
              placeholder="https://www.slhanguk.lk" 
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Duration / Package</label>
            <select 
              value={durationDays} 
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="7">7 Days - LKR 1,500</option>
              <option value="14">14 Days - LKR 2,800</option>
              <option value="30">30 Days - LKR 5,000</option>
            </select>
          </div>

          {/* Banner Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Banner Design Image (Landscape)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                required
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="banner-file-input"
              />
              <label htmlFor="banner-file-input" className="cursor-pointer space-y-2 block">
                <ImageIcon className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="text-xs font-bold text-gray-700">
                  {bannerFile ? bannerFile.name : 'Click to select banner image (e.g. 1200x400px)'}
                </p>
                <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>

          {/* Bank Slip Image Upload (Bump Style) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Bank Payment Slip (ගෙවීම් කළ ලදුපත)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                required
                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="banner-slip-input"
              />
              <label htmlFor="banner-slip-input" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-orange-500 mx-auto" />
                <p className="text-xs font-bold text-gray-700">
                  {slipFile ? slipFile.name : 'Click to select bank payment slip image'}
                </p>
                <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} 
            Submit Banner Request
          </button>

        </form>

      </div>
    </main>
  )
}