'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, MapPin, Navigation, Star, Phone, Tag, 
  Car, Home, Building2, Smartphone, Tv, Flower2, Dog, 
  Tractor, Wrench, Shirt, Trophy, Factory, GraduationCap, 
  ShoppingBag, Briefcase, Globe2, X, Award, Heart
} from 'lucide-react'

const sriLankaDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-2xl bg-slate-100 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400 font-medium text-xs sm:text-sm">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading Interactive Map...</span>
    </div>
  ),
})

const iconMap: Record<string, any> = {
  Car, Home, Building2, Smartphone, Tv, Flower2, Dog, 
  Tractor, Wrench, Shirt, Trophy, Factory, GraduationCap, 
  ShoppingBag, Briefcase, Globe2, Tag
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'classifieds' | 'services'>('classifieds')
  
  const [allAds, setAllAds] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [homeBgUrl, setHomeBgUrl] = useState<string>('') // Background image state
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('') 
  
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest')
  const [selectedCondition, setSelectedCondition] = useState<string>('all')
  const [favorites, setFavorites] = useState<string[]>([])

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 6.9271, lng: 79.8612 })
  const [isLocating, setIsLocating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initData() {
      const savedFavs = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
      setFavorites(savedFavs)

      setLoading(true)
      try {
        // 0. Fetch Settings for Background Image
        const { data: settingsData } = await supabase
          .from('settings')
          .select('home_bg_url')
          .eq('id', 1)
          .single()

        if (settingsData && settingsData.home_bg_url) {
          setHomeBgUrl(settingsData.home_bg_url)
        }

        // 1. Fetch Categories & Remove Duplicates
        const { data: catData, error: catError } = await supabase.from('categories').select('*')
        if (catError) console.error('Category error:', catError.message)
        
        if (catData) {
          const uniqueCategories = Array.from(
            new Map(catData.map(item => [item.name?.trim().toLowerCase(), item])).values()
          )
          setCategories(uniqueCategories)
        }

        // 2. Fetch Ads
        const { data: adsData, error: adsError } = await supabase.from('ads').select('*')

        if (adsError) {
          console.error('Ads fetch error:', adsError.message)
          setAllAds([])
        } else {
          setAllAds(adsData || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }

      fetchNearbyServices(userLocation.lat, userLocation.lng)
    }
    initData()
  }, [])

  const toggleFavorite = (e: React.MouseEvent, adId: string) => {
    e.preventDefault()
    e.stopPropagation()
    let updatedFavs = [...favorites]
    if (updatedFavs.includes(adId)) {
      updatedFavs = updatedFavs.filter(id => id !== adId)
    } else {
      updatedFavs.push(adId)
    }
    setFavorites(updatedFavs)
    localStorage.setItem('trendmart_favorites', JSON.stringify(updatedFavs))
  }

  const fetchNearbyServices = async (lat: number, lng: number) => {
    try {
      const { data } = await supabase.rpc('get_nearby_service_providers', { user_lat: lat, user_lng: lng, radius_km: 50 })
      setServices(data || [])
    } catch (e) {
      console.error("RPC Error:", e)
    }
  }

  // Filtering Logic
  const filteredAds = allAds.filter((ad) => {
    if (selectedCategory && ad.category_id !== selectedCategory) {
      return false
    }

    if (selectedCondition !== 'all' && ad.condition?.toLowerCase() !== selectedCondition.toLowerCase()) {
      return false
    }

    if (selectedDistrict) {
      const matchDistrict = ad.district?.toLowerCase().includes(selectedDistrict.toLowerCase())
      const matchCity = ad.city?.toLowerCase().includes(selectedDistrict.toLowerCase())
      if (!matchDistrict && !matchCity) return false
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const matchTitle = ad.title?.toLowerCase().includes(q)
      const matchDesc = ad.description?.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }

    return true
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
    } else if (sortBy === 'price_low') {
      return Number(a.price || 0) - Number(b.price || 0)
    } else if (sortBy === 'price_high') {
      return Number(b.price || 0) - Number(a.price || 0)
    }
    return 0
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero & Tabs */}
      <section 
        className="relative text-white py-14 px-4 bg-cover bg-center"
        style={{
          backgroundImage: homeBgUrl ? `url(${homeBgUrl})` : undefined
        }}
      >
        {/* Fallback gradient if no background image is set */}
        {!homeBgUrl && <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800"></div>}

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight">
            Buy, Sell or Find <span className="text-orange-400">Services Near You</span>
          </h1>
          <p className="text-blue-100 mb-8 text-sm sm:text-base">
            Sri Lanka’s Premier Hybrid Classifieds & GPS Directory
          </p>

          <div className="flex justify-center mb-6">
            <div className="bg-blue-900/60 p-1.5 rounded-2xl flex space-x-2 border border-blue-500/30">
              <button
                onClick={() => setActiveTab('classifieds')}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'classifieds' ? 'bg-orange-500 text-white shadow-md' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Tag className="inline-block w-4 h-4 mr-2" /> Classified Ads
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'services' ? 'bg-orange-500 text-white shadow-md' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Navigation className="inline-block w-4 h-4 mr-2" /> Find Services (GPS)
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 text-gray-800">
            <div className="flex-1 flex items-center px-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent py-3 focus:outline-none text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="sm:w-56 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200">
              <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-transparent py-3 focus:outline-none text-xs sm:text-sm font-medium cursor-pointer"
              >
                <option value="">All Sri Lanka</option>
                {sriLankaDistricts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {activeTab === 'classifieds' && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Browse Categories</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Explore popular categories</p>
            </div>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                Clear Category
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.icon] || Tag
              const isSelected = selectedCategory === cat.id

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400' : 'bg-white border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-orange-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>{cat.name}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Services Tab View */}
      {activeTab === 'services' && (
        <section className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white p-3 rounded-2xl border shadow-sm">
            <LocationMap center={userLocation} locations={services} />
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{service.business_name}</h3>
                <p className="text-xs text-gray-500 mb-3">{service.address}</p>
                <a href={`tel:${service.phone}`} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center text-sm">
                  <Phone className="w-4 h-4 mr-2" /> Call {service.phone}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ads List Grid */}
      {activeTab === 'classifieds' && (
        <section className="max-w-7xl mx-auto px-4 py-8 mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Product & Ad Listings</h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading products...</div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border shadow-sm">
              <p className="text-gray-500 font-semibold text-sm mb-2">ප්‍රදර්ශනය කිරීමට දැන්වීම් කිහිපයක් හෝ හමු නොවීය.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {filteredAds.map((ad) => (
                <Link key={ad.id} href={`/ads/${ad.id}`} className="block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {ad.images && ad.images.length > 0 ? (
                      <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                    <p className="text-orange-600 font-black text-lg my-1">LKR {Number(ad.price || 0).toLocaleString()}</p>
                    <div className="text-xs text-gray-500 mt-2">📍 {ad.city || 'Sri Lanka'}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}