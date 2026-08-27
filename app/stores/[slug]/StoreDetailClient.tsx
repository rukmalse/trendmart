'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Store as StoreIcon, Phone, MapPin, Calendar, Package } from 'lucide-react'

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default function StoreDetailClient({ slug }: { slug: string }) {
  const [store, setStore] = useState<any>(null)
  const [storeItems, setStoreItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchStoreAndItems() {
      // 1. Fetch Store details (slug හෝ id මඟින් සෙවීම)
      let { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()

      // slug මඟින් සොයාගැනීමට නොහැකි වූ නම් id මඟින් උත්සාහ කිරීම
      if (storeError || !storeData) {
        const { data: storeById, error: idError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', slug)
          .single()

        if (idError || !storeById) {
          setLoading(false)
          return
        }
        storeData = storeById
      }

      setStore(storeData)

      // 2. Fetch items/ads related to this store (store_id හෝ store name මඟින්)
      if (storeData) {
        const { data: itemsData } = await supabase
          .from('ads')
          .select('*')
          .eq('store_id', storeData.id)

        if (itemsData) {
          setStoreItems(itemsData)
        }
      }

      setLoading(false)
    }

    fetchStoreAndItems()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading store details...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-800 font-bold text-lg mb-2">Store not found!</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
            Official Store
          </span>
        </div>

        {/* Store Header Banner */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl flex-shrink-0">
              <StoreIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {store.name}
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                {store.description || 'No description available for this store.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-600">
            {store.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="font-bold">{store.phone}</span>
              </div>
            )}
            {store.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{store.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Products / Ads Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Store Items ({storeItems.length})
          </h2>

          {storeItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No items found in this store yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/ads/${item.id}`}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:border-blue-500 transition group p-4 space-y-3"
                >
                  <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
                    <Image 
                      src={item.images?.[0] || '/placeholder.png'} 
                      alt={item.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition duration-300" 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    {item.price && (
                      <p className="text-sm font-black text-orange-600 mt-1">
                        LKR {Number(item.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}