'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, Phone, MapPin, Calendar, ShieldCheck, 
  Share2, Heart, User, CheckCircle2, Sparkles, Tag, Layers
} from 'lucide-react'

export default function AdDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const id = params?.id

  const [ad, setAd] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string>('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (!id) return

    async function fetchAdDetails() {
      setLoading(true)
      try {
        const { data: adData, error: adError } = await supabase
          .from('ads')
          .select('*')
          .eq('id', id)
          .single()

        if (adError || !adData) {
          setLoading(false)
          return
        }

        setAd(adData)
        if (adData.images && adData.images.length > 0) {
          setActiveImage(adData.images[0])
        }

        const sellerId = adData.user_id || adData.profile_id
        if (sellerId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sellerId)
            .single()

          if (profileData) {
            setSeller(profileData)
          }
        }

        const savedFavs = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
        setIsFavorite(savedFavs.includes(id))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdDetails()
  }, [id])

  const toggleFavorite = () => {
    let savedFavs = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
    if (savedFavs.includes(id)) {
      savedFavs = savedFavs.filter((favId: string) => favId !== id)
      setIsFavorite(false)
    } else {
      savedFavs.push(id)
      setIsFavorite(true)
    }
    localStorage.setItem('trendmart_favorites', JSON.stringify(savedFavs))
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad?.title,
        text: ad?.description,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const sellerPhone = ad?.phone || seller?.phone || seller?.mobile || null
  const sellerName = seller?.full_name || seller?.name || ad?.contact_name || 'Verified Seller'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading ad details...</span>
        </div>
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ad Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">This ad may have been removed or is no longer available.</p>
        <Link href="/" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50/70 text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Top Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 transition bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center text-xs sm:text-sm font-bold text-slate-700 hover:text-orange-600 transition bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow gap-2"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            {shareCopied ? 'Link Copied!' : 'Share Ad'}
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gallery Box */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="h-[320px] sm:h-[480px] bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
                {activeImage ? (
                  <img src={activeImage} alt={ad.title} className="w-full h-full object-cover transition-all duration-300" />
                ) : (
                  <span className="text-slate-400 text-sm">No Image Available</span>
                )}

                <button 
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition group"
                >
                  <Heart className={`w-5 h-5 transition ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-600 group-hover:text-red-500'}`} />
                </button>
              </div>

              {/* Thumbnails list */}
              {ad.images && ad.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-none">
                  {ad.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImage === img ? 'border-orange-500 ring-4 ring-orange-500/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Specs Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mb-2">
                  <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(ad.created_at || Date.now()).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {ad.city || ad.district || 'Sri Lanka'}</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{ad.title}</h1>
                
                <div className="mt-3 inline-block bg-orange-50 text-orange-600 border border-orange-200/60 font-black text-2xl sm:text-4xl px-5 py-2.5 rounded-2xl">
                  LKR {Number(ad.price || 0).toLocaleString()}
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                {ad.condition && (
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">Condition</span>
                    <strong className="text-slate-900 text-sm capitalize flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-orange-500" /> {ad.condition}</strong>
                  </div>
                )}
                {ad.district && (
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">District</span>
                    <strong className="text-slate-900 text-sm">{ad.district}</strong>
                  </div>
                )}
                {ad.city && (
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">City</span>
                    <strong className="text-slate-900 text-sm">{ad.city}</strong>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" /> Description
                </h3>
                <p className="text-slate-600 text-sm sm:text-base whitespace-pre-line leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
                  {ad.description || 'No description provided.'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Seller Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm sticky top-6 space-y-6">
              
              {/* Seller Profile Info */}
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl border border-orange-100 shrink-0 shadow-inner">
                  {seller?.avatar_url ? (
                    <img src={seller.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                    {sellerName}
                    <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Verified TrendMart Member</p>
                </div>
              </div>

              {/* Call Action Button */}
              <div>
                {sellerPhone ? (
                  <a 
                    href={`tel:${sellerPhone}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center text-sm sm:text-base shadow-xl shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 gap-2.5"
                  >
                    <Phone className="w-5 h-5 animate-pulse" /> Call {sellerPhone}
                  </a>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl text-center text-xs font-semibold">
                    Contact number not provided by seller.
                  </div>
                )}
              </div>

              {/* Safety Warning Card */}
              <div className="bg-sky-50/80 border border-sky-100 p-4.5 rounded-2xl text-xs space-y-2 text-sky-900">
                <div className="font-bold flex items-center gap-1.5 text-sky-950 text-sm">
                  <ShieldCheck className="w-4 h-4 text-sky-600" /> ආරක්ෂිත උපදෙස් (Safety Tips)
                </div>
                <p className="text-sky-900 leading-relaxed text-[11px] sm:text-xs">
                  භාණ්ඩය හෝ දේපළ நேரில் පරීක්ෂා කර බලා මුදල් ගෙවන්න. අත්තිකාරම් මුදල් යැවීමේදී අතිශයින් සැලකිලිමත් වන්න.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  )
}