'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, PhoneCall, Share2, ShieldCheck, Image as ImageIcon, Phone, Check, Clock, Zap, Upload, X, Loader2, CheckCircle2 } from 'lucide-react'

export default function AdDetailPage() {
  const params = useParams()
  const adId = params.id as string
  const supabase = createClient()

  const [ad, setAd] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // 🛡️ Admin & User States
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  // 🌟 Action States
  const [showPhone, setShowPhone] = useState(false)
  const [copied, setCopied] = useState(false)

  // 🚀 Bump Feature States
  const [isBumpModalOpen, setIsBumpModalOpen] = useState(false)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [bumpLoading, setBumpLoading] = useState(false)
  const [bumpSuccess, setBumpSuccess] = useState(false)

  useEffect(() => {
    async function fetchAdDetails() {
      if (!adId) return

      try {
        // 1. Get current logged-in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
          
          // Check if user is admin using 'profiles' table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile && profile.role === 'admin') {
            setIsAdmin(true)
          }
        }

        // 2. Fetch ad details with profile
        const { data, error } = await supabase
          .from('ads')
          .select(`
            *,
            profiles:user_id (
              phone,
              full_name
            )
          `)
          .eq('id', adId)
          .single()

        if (error) {
          console.error('Error fetching ad details with profile:', error.message)
          // Fallback query
          const { data: fallbackData } = await supabase
            .from('ads')
            .select('*')
            .eq('id', adId)
            .single()
          
          if (fallbackData) {
            setAd(fallbackData)
            if (fallbackData.images && fallbackData.images.length > 0) {
              setSelectedImage(fallbackData.images[0])
            }
          }
        }

        if (data) {
          setAd(data)
          if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0])
          }
        }
      } catch (err) {
        console.error('Error in fetchAdDetails:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdDetails()
  }, [adId])

  // Direct Admin Approve Handler
  const handleApproveAd = async () => {
    setApproving(true)
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_approved: true, status: 'active' })
        .eq('id', ad.id)

      if (error) throw error

      alert('දැන්වීම සාර්ථකව අනුමත කරන ලදී!')
      window.location.reload()
    } catch (err: any) {
      alert('දෝෂයක් සිදු විය: ' + err.message)
    } finally {
      setApproving(false)
    }
  }

  // 📞 Call Seller Functionality
  const phoneNumber = ad?.phone || ad?.contact_number || ad?.profiles?.phone || '0771234567'

  const handleCallSeller = (e: React.MouseEvent) => {
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      e.preventDefault()
      setShowPhone(!showPhone)
    }
  }

  // 🔗 Share Ad Functionality
  const handleShareAd = async () => {
    const shareData = {
      title: ad?.title || 'Trend Mart Listing',
      text: `Check out this ad on Trend Mart: ${ad?.title}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch (err) {
        alert('Link එක copy කර ගැනීමට නොහැකි විය.')
      }
    }
  }

  // 🚀 Handle Bump Form Submission
  const handleBumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slipFile) {
      alert('කරුණාකර බැංකු රිසිට්පත (Slip image) තෝරන්න.')
      return
    }

    setBumpLoading(true)
    try {
      const fileExt = slipFile.name.split('.').pop()
      const fileName = `${ad.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(fileName, slipFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('slips')
        .getPublicUrl(fileName)

      const slipUrl = publicUrlData.publicUrl

      const { error: bumpError } = await supabase
        .from('ad_bumps')
        .insert([
          {
            ad_id: ad.id,
            payment_method: 'bank_deposit',
            slip_url: slipUrl,
            amount: 500.00,
            status: 'pending'
          }
        ])

      if (bumpError) throw bumpError

      await supabase
        .from('ads')
        .update({ bump_status: 'pending' })
        .eq('id', ad.id)

      setBumpSuccess(true)
      setTimeout(() => {
        setIsBumpModalOpen(false)
        setBumpSuccess(false)
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      console.error('Bump error:', err.message)
      alert('දෝෂයක් සිදු විය: ' + err.message)
    } finally {
      setBumpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800">Ad එක සොයාගැනීමට නොහැකි විය.</h2>
        <p className="text-gray-500 text-sm mt-1">මෙම Ad එක ඉවත් කර හෝ අක්‍රිය කර තිබිය හැක.</p>
        <Link 
          href="/" 
          className="mt-4 bg-orange-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition hover:bg-orange-600"
        >
          මුල් පිටුවට යන්න
        </Link>
      </div>
    )
  }

  if (ad.status === 'deactivated') {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">මෙම දැන්වීම අක්‍රිය කර ඇත</h2>
          <p className="text-gray-500 text-sm">
            මෙම දැන්වීමේ හිමිකරු විසින් එය දැනට Deactivate කර ඇති බැවින්, එය මහජන ප්‍රදර්ශනය සඳහා නොමැත.
          </p>
          <Link 
            href="/" 
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
          >
            මුල් පිටුවට යන්න
          </Link>
        </div>
      </main>
    )
  }

  // 🛡️ ACCESS CONTROL: 
  const isOwner = currentUserId && ad.user_id === currentUserId
  const isPendingApproval = ad.is_approved === false || ad.status === 'pending'

  if (isPendingApproval && !isAdmin && !isOwner) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">දැන්වීම සමාලෝචනය වෙමින් පවතී</h2>
          <p className="text-gray-500 text-sm">
            මෙම දැන්වීම තවම ඇඩ්මින් විසින් අනුමත කර නැත. අනුමත කළ පසු එය ප්‍රදර්ශනය කෙරේ.
          </p>
          <Link 
            href="/" 
            className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition"
          >
            මුල් පිටුවට යන්න
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      
      {/* 🚀 ADMIN / OWNER PREVIEW NOTIFICATION BANNER */}
      {isPendingApproval && (
        <div className="bg-amber-500 text-black px-4 py-3 shadow-md sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <Clock className="w-5 h-5 shrink-0" />
            <span>⚠️ මෙය තවම අනුමත නොකළ (Pending) දැන්වීමකි. පෙනෙන්නේ ඇඩ්මින් / හිමිකරු ඔබට පමණි.</span>
          </div>

          {isAdmin && (
            <button
              onClick={handleApproveAd}
              disabled={approving}
              className="bg-black hover:bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition ml-auto disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
              <span>Approve Ad Now</span>
            </button>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Image Gallery & Description */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ad Header */}
          <div>
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-2 uppercase">
              {ad.category || 'General'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{ad.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> {ad.city}, {ad.district}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" /> {new Date(ad.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* IMAGE GALLERY COMPONENT */}
          <div className="bg-white p-4 rounded-3xl border shadow-sm space-y-4">
            <div className="relative w-full h-[320px] sm:h-[450px] bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={ad.title}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span>ඡායාරූප නොමැත</span>
                </div>
              )}
            </div>

            {ad.images && ad.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {ad.images.map((imgUrl: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === imgUrl
                        ? 'border-orange-500 scale-105 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ad Overview / Specification */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-xs text-gray-400 font-medium">Condition</p>
                <p className="text-sm font-bold text-gray-800 capitalize">{ad.condition}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-xs text-gray-400 font-medium">District</p>
                <p className="text-sm font-bold text-gray-800">{ad.district}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-xs text-gray-400 font-medium">City</p>
                <p className="text-sm font-bold text-gray-800">{ad.city}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {ad.description}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Price & Seller Contact Card */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 sticky top-20">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Price</p>
              <p className="text-3xl font-extrabold text-orange-600 mt-1">
                Rs. {ad.price?.toLocaleString()}
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Action Buttons */}
            <div className="space-y-3">
              
              {/* 📞 Call Seller Button */}
              <div className="space-y-2">
                <a
                  href={`tel:${phoneNumber}`}
                  onClick={handleCallSeller}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  {showPhone ? phoneNumber : 'Call Seller'}
                </a>

                {showPhone && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-900 font-bold text-center py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    <span>{phoneNumber}</span>
                  </div>
                )}
              </div>
              
              {/* 🚀 Bump Ad Button */}
              <button
                onClick={() => setIsBumpModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                <span>🚀 Bump This Ad (Rs. 500)</span>
              </button>

              {/* 🔗 Share Ad Button */}
              <button
                onClick={handleShareAd}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <span>Share Ad</span>
                  </>
                )}
              </button>

            </div>

            {/* Safety Tips Box */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Safety Tips
              </div>
              <ul className="text-xs text-blue-900/80 space-y-1 list-disc list-inside">
                <li>භාණ්ඩය පරික්ෂා කර බලා මුදල් ගෙවන්න.</li>
                <li>කලින් advance මුදල් තැන්පත් කිරීමෙන් වලකින්න.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* 🚀 BUMP MODAL / POPUP */}
      {isBumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-6 relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Zap className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Bump Your Ad</h3>
                  <p className="text-xs text-gray-500">දැන්වීම ඉහළට ගෙන වැඩි පිරිසකට පෙන්වන්න</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBumpModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bumpSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Bump ඉල්ලීම සාර්ථකයි!</h4>
                <p className="text-xs text-gray-500">බැංකු රිසිට්පත ලැබී ඇත. ඇඩ්මින් අනුමත කළ පසු ඔබේ දැන්වීම Bump වනු ඇත.</p>
              </div>
            ) : (
              <form onSubmit={handleBumpSubmit} className="space-y-4">
                
                {/* Bank Details Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2 text-xs">
                  <p className="font-bold text-orange-900 text-sm mb-1">🏦 Bank Account Details</p>
                  <div className="flex justify-between text-orange-800">
                    <span className="font-medium">Bank & Branch:</span>
                    <span className="font-bold">Commercial Bank, Teldeniya</span>
                  </div>
                  <div className="flex justify-between text-orange-800">
                    <span className="font-medium">A/C Number:</span>
                    <span className="font-bold">8027679803</span>
                  </div>
                  <div className="flex justify-between text-orange-800">
                    <span className="font-medium">A/C Name:</span>
                    <span className="font-bold">H. M. R. Senanayaka</span>
                  </div>
                  <div className="flex justify-between text-orange-900 border-t border-orange-200 pt-2 font-bold text-sm">
                    <span>Bump Fee:</span>
                    <span className="text-orange-600">Rs. 500.00</span>
                  </div>
                </div>

                {/* File Upload Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Upload Bank Receipt (Slip Image / PDF)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-2xl p-4 cursor-pointer bg-gray-50 transition">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-semibold text-gray-600">
                      {slipFile ? slipFile.name : 'Click to upload slip image'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG or PDF</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files && setSlipFile(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={bumpLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {bumpLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Bump Request</span>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </main>
  )
}