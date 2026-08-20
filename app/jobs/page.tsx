'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Briefcase, UserCheck, MapPin, Search, Plus, Phone, Navigation } from 'lucide-react'

// Haversine formula to calculate distance in KM between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function JobsPage() {
  const supabase = createClient()

  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'vacancy' | 'worker_profile'>('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Near Me (GPS) States
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [nearMeActive, setNearMeActive] = useState(false)
  const [maxDistance, setMaxDistance] = useState<number>(20) // Default 20 km radius
  const [gpsLoading, setGpsLoading] = useState(false)

  const categories = [
    'Electrician & Electrical',
    'Plumber & Piping',
    'Driver & Transport',
    'Housekeeper & Maid',
    'Construction & Masonry',
    'Carpenter & Woodwork',
    'AC & Appliance Repair',
    'Chef & Kitchen Staff',
    'Office & Administrative',
    'Sales & Marketing',
    'IT & Technical',
    'Security Guard',
    'Other Skilled / Unskilled'
  ]

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false })

    if (activeTab !== 'all') {
      query = query.eq('listing_type', activeTab)
    }

    if (selectedCategory) {
      query = query.eq('category', selectedCategory)
    }

    if (selectedDistrict && !nearMeActive) {
      query = query.eq('district', selectedDistrict)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error.message)
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [activeTab, selectedCategory, selectedDistrict, nearMeActive])

  // Enable Live GPS Location for "Near Me"
  const handleNearMeToggle = () => {
    if (nearMeActive) {
      setNearMeActive(false)
      setUserLat(null)
      setUserLng(null)
      return
    }

    if (!navigator.geolocation) {
      alert('ඔබගේ Browser එක මඟින් Geolocation සපයන්නේ නැත.')
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude)
        setUserLng(position.coords.longitude)
        setNearMeActive(true)
        setGpsLoading(false)
      },
      (error) => {
        setGpsLoading(false)
        alert('GPS Location ලබා ගැනීමට නොහැකි විය. කරුණාකර Browser Permission Allow කරන්න.')
        console.error(error)
      },
      { enableHighAccuracy: true }
    )
  }

  // Filter Jobs based on Search & GPS Distance
  const filteredJobs = jobs.map(job => {
    let distance: number | null = null;
    if (userLat && userLng && job.latitude && job.longitude) {
      distance = getDistanceFromLatLonInKm(userLat, userLng, Number(job.latitude), Number(job.longitude))
    }
    return { ...job, distance }
  }).filter(job => {
    // Search text filter
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Near Me distance filter
    if (nearMeActive && userLat && userLng) {
      if (job.distance === null) return false; // Hide items without coordinates when Near Me is ON
      return matchesSearch && job.distance <= maxDistance;
    }

    return matchesSearch;
  }).sort((a, b) => {
    // Sort by nearest distance if Near Me is active
    if (nearMeActive && a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Manpower & <span className="text-blue-600">Job Bank</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ළඟම ඉන්න පළපුරුදු ශ්‍රමිකයන් (Skilled Workers) සහ Jobs පහසුවෙන් සොයාගන්න.
            </p>
          </div>

          <Link
            href="/post-job"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-md text-sm transition"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Post Job / Service
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border mb-6 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setActiveTab('vacancy')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center transition ${
              activeTab === 'vacancy' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 mr-1" /> Jobs
          </button>
          <button
            onClick={() => setActiveTab('worker_profile')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center transition ${
              activeTab === 'worker_profile' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Workers
          </button>
        </div>

        {/* Search & GPS Filters Bar */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm mb-8 space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search title, city, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>

            {/* GPS "Near Me" Toggle Button */}
            <button
              type="button"
              onClick={handleNearMeToggle}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition border ${
                nearMeActive 
                  ? 'bg-orange-500 text-white border-orange-600 shadow' 
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Navigation className={`w-4 h-4 mr-2 ${gpsLoading ? 'animate-spin' : ''}`} />
              {nearMeActive ? '📍 Near Me Active (ON)' : '🎯 Find Services Near Me'}
            </button>
          </div>

          {/* Near Me Radius Selector (Only Visible when Near Me is Active) */}
          {nearMeActive && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-3 rounded-xl text-xs">
              <span className="font-bold text-orange-900 flex items-center">
                📍 Showing workers/jobs near your GPS location
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-orange-700 font-semibold">Max Distance:</span>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="bg-white border border-orange-300 rounded-lg px-2 py-1 font-bold text-orange-900 focus:outline-none"
                >
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={20}>Within 20 km</option>
                  <option value={50}>Within 50 km</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Listings Display */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-medium text-sm">
            Listings load වෙමින් පවතී...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-700 font-bold text-base">
              {nearMeActive ? 'ඔබ ඉන්න ප්‍රදේශයට ආසන්නව කිසිදු Listing එකක් නොමැත.' : 'තවමත් කිසිදු Listing එකක් සොයාගත නොහැකි විය.'}
            </h3>
            <p className="text-gray-400 text-xs mt-1">ඔබ ප්‍රථම Job / Worker Listing එක පළ කරන්න.</p>
            <Link
              href="/post-job"
              className="mt-4 inline-block bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
            >
              + Post Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      job.listing_type === 'vacancy' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {job.listing_type === 'vacancy' ? '💼 Job Vacancy' : '👷 Worker Profile'}
                    </span>

                    {/* Distance Badge if available */}
                    {job.distance !== null && (
                      <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                        📍 {job.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base mb-1 hover:text-blue-600 transition">
                    {job.title}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      {job.city}, {job.district}
                    </span>
                    <span className="font-semibold text-blue-600">
                      {job.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="border-t pt-3 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Salary / Rate:</span>
                    <span className="text-xs font-black text-orange-600">
                      {job.salary_amount 
                        ? `LKR ${Number(job.salary_amount).toLocaleString()} / ${job.salary_type}`
                        : 'Negotiable'}
                    </span>
                  </div>

                  <a
                    href={`tel:${job.contact_phone}`}
                    className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Call {job.contact_phone}
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}