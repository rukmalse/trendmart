'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CarouselAd {
  id: string
  business_name: string
  target_url: string
  banner_url: string
}

export default function TopCarouselAds() {
  const [ads, setAds] = useState<CarouselAd[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchActiveAds = async () => {
      const { data, error } = await supabase
        .from('banner_requests')
        .select('id, business_name, target_url, banner_url')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching banner ads:', error.message)
      }

      if (data && data.length > 0) {
        setAds(data)
      }
    }

    fetchActiveAds()
  }, [])

  // Auto index shift timer
  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [ads.length])

  if (ads.length === 0) return null

  return (
    <div className="w-full max-w-7xl mx-auto px-4 my-4">
      {/* 16:9 Aspect Ratio Container for YouTube Thumbnail Style */}
      <div className="relative w-full aspect-[16/9] max-h-[450px] overflow-hidden rounded-xl shadow-md bg-black">
        {ads.map((ad, index) => (
          <div
            key={ad.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Link href={ad.target_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
              <img
                src={ad.banner_url}
                alt={ad.business_name || 'Sponsored'}
                className="w-full h-full object-contain hover:opacity-95 transition"
              />
            </Link>
            <span className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded uppercase font-semibold tracking-wider">
              Sponsored
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}