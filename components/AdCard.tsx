// components/AdCard.tsx
'use client'

import Link from 'next/link'
import { MapPin, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdCard({ ad }: { ad: any }) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
    setIsFavorite(favorites.includes(ad.id))
  }, [ad.id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault() // Link එක click වීම වැළැක්වීමට
    e.stopPropagation()
    
    let favorites = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
    
    if (favorites.includes(ad.id)) {
      favorites = favorites.filter((id: string) => id !== ad.id)
      setIsFavorite(false)
    } else {
      favorites.push(ad.id)
      setIsFavorite(true)
    }
    
    localStorage.setItem('trendmart_favorites', JSON.stringify(favorites))
  }

  return (
    <Link href={`/ads/${ad.id}`} className="bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition relative block group">
      
      {/* Product Image Container (Relative කර ඇත, එවිට Heart එක පින්තූරය මත හරියටම වාඩි වේ) */}
      <div className="aspect-square w-full bg-gray-200 rounded-xl mb-3 overflow-hidden relative">
        {ad.images && ad.images[0] ? (
          <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
        )}

        {/* Favorite / Wishlist Heart Button */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:bg-white transition"
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 transition ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'}`} />
        </button>
      </div>

      <h3 className="font-bold text-gray-900 truncate text-sm">{ad.title}</h3>
      <p className="text-orange-600 font-bold mt-1 text-sm">Rs. {Number(ad.price || 0).toLocaleString()}</p>
      
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
        {ad.city || ad.district || 'Sri Lanka'}
      </div>
    </Link>
  )
}