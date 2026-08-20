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
    <Link href={`/ads/${ad.id}`} className="bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition relative block">
      {/* Favorite / Wishlist Heart Button */}
      <button 
        onClick={toggleFavorite}
        className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:bg-white transition"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
      </button>

      <div className="aspect-square w-full bg-gray-200 rounded-xl mb-3 overflow-hidden">
        {ad.images && ad.images[0] && (
          <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
        )}
      </div>
      <h3 className="font-bold text-gray-900 truncate">{ad.title}</h3>
      <p className="text-orange-600 font-bold mt-1">Rs. {ad.price?.toLocaleString()}</p>
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <MapPin className="w-3 h-3 mr-1" />
        {ad.city}
      </div>
    </Link>
  )
}