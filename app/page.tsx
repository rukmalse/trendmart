'use client'

import TopCarouselAds from '@/components/TopCarouselAds'
import StoresSlider from '@/components/StoresSlider'
import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, MapPin, Navigation, Star, Phone, Tag, 
  Car, Home, Building2, Smartphone, Tv, Flower2, Dog, 
  Tractor, Wrench, Shirt, Trophy, Factory, GraduationCap, 
  ShoppingBag, Briefcase, Globe2, X, Award, Heart, Store, ArrowRight, SlidersHorizontal, Zap,
  ChevronLeft, ChevronRight, Gem
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
  ShoppingBag, Briefcase, Globe2, Tag, Gem
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'classifieds' | 'services'>('classifieds')
  
  const [allAds, setAllAds] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([]) 
  const [homeBgUrl, setHomeBgUrl] = useState<string>('') 
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('') // Updated to empty string for "All Categories"
  const [selectedDistrict, setSelectedDistrict] = useState<string>('') 
  
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest')
  const [selectedCondition, setSelectedCondition] = useState<string>('all')
  const [favorites, setFavorites] = useState<string[]>([])

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 6.9271, lng: 79.8612 })
  const [loading, setLoading] = useState(true)

  const categoriesScrollRef = useRef<HTMLDivElement>(null)

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const { scrollLeft, clientWidth } = categoriesScrollRef.current
      const scrollAmount = clientWidth * 0.75
      categoriesScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    async function initData() {
      const savedFavs = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
      setFavorites(savedFavs)

      setLoading(true)
      try {
        const { data: settingsData } = await supabase
          .from('settings')
          .select('home_bg_url')
          .eq('id', 1)
          .single()

        if (settingsData && settingsData.home_bg_url) {
          setHomeBgUrl(settingsData.home_bg_url)
        }

        const { data: catData, error: catError } = await supabase.from('categories').select('*')
        if (catError) console.error('Category error:', catError.message)
        
        if (catData) {
          const uniqueCategories = Array.from(
            new Map(catData.map(item => [item.name?.trim().toLowerCase(), item])).values()
          )
          setCategories(uniqueCategories)
        }

        const { data: adsData, error: adsError } = await (supabase
          .from('ads')
          .select('*')
          .eq('status', 'active')
          .order('bumped_at', { ascending: false, nullsLast: true } as any) as any)

        if (adsError) {
          console.error('Ads fetch error:', adsError.message)
          setAllAds([])
        } else {
          setAllAds(adsData || [])
        }

        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .order('created_at', { ascending: false })

        if (storesError) {
          console.error('Stores fetch error:', storesError.message)
          setStores([])
        } else {
          setStores(storesData || [])
        }

      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            fetchNearbyServices();
          },
          () => {
            fetchNearbyServices();
          },
          { enableHighAccuracy: true }
        )
      } else {
        fetchNearbyServices();
      }
    }
    initData()
  }, [])

  const fetchNearbyServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setServices([])
      } else {
        setServices(data || [])
      }
    } catch (e) {
      setServices([])
    }
  }

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

  const filteredAds = allAds.filter((ad) => {
    if (selectedCategory && selectedCategory !== '' && ad.category_id !== selectedCategory) {
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
    const aBumped = a.bump_status === 'approved' ? 1 : 0;
    const bBumped = b.bump_status === 'approved' ? 1 : 0;
    if (aBumped !== bBumped) {
      return bBumped - aBumped;
    }

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
        {!homeBgUrl && <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800"></div>}

        <div className="relative max-w-4xl mx-auto text-center z-10">
          
          <div className="flex justify-center items-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 text-white border border-white/25 backdrop-blur-md shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative"></span>
              🔥 <strong className="text-orange-300 ml-1">{allAds.length}</strong> Active Ads Live Across Sri Lanka
            </span>
          </div>

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

          {/* Search Box with Dynamic Category Dropdown */}
          <div className="bg-white rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 text-gray-800">
            {/* Search Input */}
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

            {/* Dynamic Category Selector Dropdown (Includes Used items, Gems & Jewelries, etc.) */}
            <div className="sm:w-48 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200">
              <Tag className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent py-3 focus:outline-none text-xs sm:text-sm font-medium cursor-pointer truncate"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div className="sm:w-48 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200">
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

      {/* Top Carousel Banner Component */}
      {activeTab === 'classifieds' && (
        <TopCarouselAds />
      )}

      {/* Featured Stores Slider Component */}
      {activeTab === 'classifieds' && stores.length > 0 && (
        <StoresSlider stores={stores} />
      )}

      {/* 🌟 Categories Slider Section */}
      {activeTab === 'classifieds' && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Browse Categories</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Explore popular categories by sliding through</p>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <button onClick={() => setSelectedCategory('')} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                  Clear Category
                </button>
              )}
              {/* Slider Navigation Arrows */}
              <button 
                onClick={() => scrollCategories('left')}
                className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 shadow-sm text-gray-700 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollCategories('right')}
                className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 shadow-sm text-gray-700 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Sliding Container */}
          <div 
            ref={categoriesScrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 px-1 snap-x scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.icon] || Tag
              const isSelected = selectedCategory === cat.id

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                  className={`min-w-[200px] sm:min-w-[220px] p-4 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer snap-start shrink-0 shadow-sm hover:shadow-md ${
                    isSelected ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400' : 'bg-white border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-orange-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <h3 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>{cat.name}</h3>
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
            {services.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 text-sm">
                කිසිදු සේවාවක් හමු නොවීය.
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                  <div>
                    {service.service_category_id && (
                      <span className="inline-block text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full mb-2.5 border border-orange-100">
                        {service.service_category_id}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{service.business_name}</h3>
                    
                    {service.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{service.address || 'Sri Lanka'}</span>
                    </p>
                  </div>

                  <a 
                    href={`tel:${service.phone}`} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center text-sm transition shadow-sm"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Call {service.phone}
                  </a>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Ads List Grid */}
      {activeTab === 'classifieds' && (
        <section className="max-w-7xl mx-auto px-4 py-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-black text-gray-900">Product & Ad Listings</h2>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="all">All Conditions</option>
                <option value="brand new">Brand New</option>
                <option value="used">Used</option>
              </select>

              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-gray-700 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading products...</div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border shadow-sm">
              <p className="text-gray-500 font-semibold text-sm mb-2">ප්‍රදර්ශනය කිරීමට අනුමත කරන ලද දැන්වීම් කිහිපයක් හමු නොවීය.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {filteredAds.map((ad) => {
                const isFavorite = favorites.includes(ad.id)

                return (
                  <Link key={ad.id} href={`/ads/${ad.id}`} className="block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition group relative">
                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      
                      {ad.bump_status === 'approved' && (
                        <div className="absolute top-3 left-3 z-20 bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          Bumped
                        </div>
                      )}

                      {ad.images && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}

                      <button 
                        onClick={(e) => toggleFavorite(e, ad.id)}
                        className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:bg-white transition"
                        title="Save to Wishlist"
                      >
                        <Heart className={`w-4 h-4 transition ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'}`} />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                      <p className="text-orange-600 font-black text-lg my-1">LKR {Number(ad.price || 0).toLocaleString()}</p>
                      <div className="text-xs text-gray-500 mt-2">📍 {ad.city || 'Sri Lanka'}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}
    </main>
  )
}