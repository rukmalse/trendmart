'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Calendar, User, Phone, Mail, ShieldCheck, Share2, Check } from 'lucide-react'

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AdDetailClient({ id }: { id: string }) {
  const [ad, setAd] = useState<any>(null)
  const [categoryName, setCategoryName] = useState<string>('General')
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [uniqueImages, setUniqueImages] = useState<string[]>([])
  const [errorNotFound, setErrorNotFound] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    async function fetchAdDetails() {
      if (!id) return

      try {
        // 1. Fetch Ad Details
        const { data: adData, error: adError } = await supabase
          .from('ads')
          .select('*')
          .eq('id', id)
          .single()

        if (adError || !adData) {
          console.error('Error fetching ad:', adError)
          setErrorNotFound(true)
          setLoading(false)
          return
        }

        setAd(adData)

        // Images setup & Duplicate filtering
        const rawImages = adData.images && Array.isArray(adData.images) && adData.images.length > 0 
          ? adData.images 
          : ['/placeholder.png']
        const filteredImages = Array.from(new Set(rawImages)) as string[]
        
        setUniqueImages(filteredImages)
        if (filteredImages.length > 0) {
          setSelectedImage(filteredImages[0])
        }

        // 2. Fetch Category Name
        if (adData.category_id) {
          const { data: catData } = await supabase
            .from('categories')
            .select('name')
            .eq('id', adData.category_id)
            .single()
          if (catData?.name) {
            setCategoryName(catData.name)
          }
        }

        // 3. Fetch Seller Profile (Profiles table එක නැතහොත් ads table එකේ ඇති phone/email direct පාවිච්චි කිරීමට fallback සපයා ඇත)
        if (adData.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone_number, email')
            .eq('id', adData.user_id)
            .single()
          
          if (profileData) {
            setSellerProfile(profileData)
          }
        }

      } catch (err) {
        console.error('Unexpected error:', err)
        setErrorNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAdDetails()
  }, [id])

  // Share link function
  const handleShare = () => {
    const currentUrl = window.location.href
    if (navigator.share) {
      navigator.share({
        title: ad?.title || 'Trend Mart Ad',
        text: 'Check out this ad on Trend Mart',
        url: currentUrl,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Loading ad details...</p>
        </div>
      </div>
    )
  }

  if (errorNotFound || !ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4 text-center px-4">
        <h2 className="text-2xl font-bold text-gray-800">Ad Not Found</h2>
        <p className="text-gray-500 text-sm">The ad you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition">
          Back to Home
        </Link>
      </div>
    )
  }

  // Seller details fallback (Profiles table එකෙන් හෝ Ads table එකේ ඇති phone/email/seller_name වලින් ඩේටා ලබා ගනී)
  const sellerName = sellerProfile?.full_name || ad.seller_name || ad.contact_name || 'Verified Seller'
  const sellerPhone = sellerProfile?.phone_number || ad.phone || ad.phone_number || ad.mobile
  const sellerEmail = sellerProfile?.email || ad.email

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Button & Category Badge */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5 text-blue-600" />}
              {copied ? 'Link Copied!' : 'Share Ad'}
            </button>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Viewer Container */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-4">
              <div className="relative w-full h-[350px] sm:h-[450px] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
                <Image 
                  src={selectedImage || uniqueImages[0] || '/placeholder.png'} 
                  alt={ad.title || 'Ad Image'} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                  className="object-cover" 
                />
              </div>

              {/* Thumbnails */}
              {uniqueImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {uniqueImages.map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 bg-gray-100 transition ${
                        selectedImage === img ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-400'
                      }`}
                    >
                      <Image 
                        src={img} 
                        alt={`Thumb ${idx}`} 
                        fill 
                        sizes="80px"
                        className="object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ad Title, Price and Details */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight break-words">
                {ad.title}
              </h1>

              <div className="text-2xl sm:text-3xl font-black text-orange-600">
                LKR {Number(ad.price || 0).toLocaleString()}
              </div>

              <div className="flex items-center text-xs text-gray-500 gap-4 pt-2 border-t">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> {ad.city || ad.location || 'Location not specified'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" /> {ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Description</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed break-all">
                  {ad.description || 'No description provided.'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Side: Contact & Seller Box */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{sellerName}</h3>
                  <p className="text-xs text-gray-400">Verified Member</p>
                </div>
              </div>

              <div className="space-y-3">
                {sellerPhone ? (
                  <a 
                    href={`tel:${sellerPhone}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Phone className="w-4 h-4" /> {sellerPhone}
                  </a>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl text-xs text-orange-800 text-center font-medium">
                    Contact number not provided by seller.
                  </div>
                )}

                {sellerEmail && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs text-gray-600 break-all">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{sellerEmail}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>ආරක්ෂිත උපදෙස්</span>
                </div>
                <p className="text-blue-900/80 leading-relaxed">
                  භාණ්ඩය පරීක්ෂා කර බලා මුදල් ගෙවන්න. අත්තිකාරම් මුදල් යැවීමේදී සැලකිලිමත් වන්න.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}