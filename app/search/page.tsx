'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdCard from '@/components/AdCard'
import Link from 'next/link'
import { Search as SearchIcon, ArrowLeft, Filter } from 'lucide-react'

export default function SearchPage() {
  const [ads, setAds] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch Categories on Load (Duplicate issues fixed here)
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*')
      if (data) {
        // එකම නම ඇති කැටගරි ඩබල් වීම වැළැක්වීමට Unique කරගැනීම
        const uniqueCategories = Array.from(
          new Map(data.map(item => [item.name?.trim().toLowerCase(), item])).values()
        )
        setCategories(uniqueCategories)
      }
    }
    fetchCategories()
  }, [])

  // Fetch Ads based on search & category
  useEffect(() => {
    async function fetchAds() {
      setLoading(true)
      let query = supabase.from('ads').select('*')

      if (searchQuery.trim() !== '') {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      if (selectedCategory !== '') {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching ads:', error)
      } else {
        setAds(data || [])
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      fetchAds()
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen w-full overflow-x-hidden box-border">
      
      {/* Top Bar / Back */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <h1 className="text-xl font-black text-gray-900">Search Ads</h1>
      </div>

      {/* Search Input and Filters */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-8 space-y-4 w-full box-border">
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for vehicles, mobile phones, jobs, items..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 box-border"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedCategory === '' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm font-medium">Searching ads...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border shadow-sm w-full">
          <p className="text-gray-500 font-semibold text-sm mb-2">No matching advertisements found.</p>
          <p className="text-xs text-gray-400">Try searching with a different keyword or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {ads.map((ad) => (
            <div key={ad.id} className="w-full overflow-hidden">
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
      )}

    </main>
  )
}