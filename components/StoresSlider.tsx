'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Store } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  logo_url?: string
  category?: string
  slug?: string
}

interface StoresSliderProps {
  stores: StoreItem[]
}

export default function StoresSlider({ stores }: StoresSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // ඊතල ක්ලික් කළ විට වමට හෝ දකුණට ස්ලයිඩ් වීමට
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current
      const scrollAmount = clientWidth * 0.75 // එක වාරයකට ස්ලයිඩර් ප්‍රමාණයෙන් 75%ක් මාරු වේ
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!stores || stores.length === 0) return null

  return (
    <div className="w-full max-w-7xl mx-auto px-4 my-8">
      {/* Header with Navigation Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Featured Stores & Shops</h2>
          <p className="text-xs text-gray-500">Explore trusted businesses and services on TrendMart</p>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slider Horizontal Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar for clean look
      >
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/stores/${store.slug || store.id}`}
            className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition group flex flex-col items-center text-center"
          >
            {/* Store Logo / Image */}
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden mb-3 border-2 border-white shadow-inner flex items-center justify-center">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <Store className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Store Name */}
            <h3 className="font-semibold text-gray-800 text-sm truncate w-full group-hover:text-orange-600 transition">
              {store.name}
            </h3>
            
            {/* Category or Tag */}
            <span className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-0.5 rounded-full truncate max-w-full">
              {store.category || 'Verified Store'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}