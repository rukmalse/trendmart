'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdCard from '@/components/AdCard'
import Link from 'next/link'

export default function SavedAdsPage() {
  const [savedAds, setSavedAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSavedAds() {
      try {
        const favorites = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
        
        if (favorites.length === 0) {
          setSavedAds([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .in('id', favorites)

        if (error) console.error(error)
        else setSavedAds(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSavedAds()
  }, [])

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Saved Ads ❤️</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Your favorite bookmarked classified advertisements</p>
        </div>
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition">
          Back to Home
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm font-medium">Loading saved ads...</div>
      ) : savedAds.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border shadow-sm">
          <p className="text-gray-500 font-semibold text-sm mb-4">You haven't saved any ads to your wishlist yet.</p>
          <Link href="/" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-6 py-3 rounded-xl transition">
            Browse Ads
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {savedAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </main>
  )
}