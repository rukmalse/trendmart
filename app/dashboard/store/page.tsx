'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, Plus, Edit3, Trash2, ExternalLink, MapPin, Phone, Loader2 } from 'lucide-react'

export default function ManageStorePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUserStore()
  }, [])

  const fetchUserStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      setStore(data)
    } catch (err: any) {
      console.error('Error fetching store:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStore = async () => {
    if (!confirm('ඔබට විශ්වාසද මෙම ස්ටෝර් එක සම්පූර්ණයෙන්ම ඉවත් කිරීමට අවශ්‍ය බව? (මෙය නැවත ලබාගත නොහැක)')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id)

      if (error) throw error
      setStore(null)
      alert('ස්ටෝර් එක සාර්ථකව ඉවත් කරන ලදී.')
    } catch (err: any) {
      alert('ස්ටෝර් එක ඉවත් කිරීමේදී දෝෂයක් ඇති විය: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Store Management</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">ඔබගේ ව්‍යාපාරික ස්ටෝර් එක කළමනාකරණය කරන්න</p>
        </div>

        {!store && (
          <Link
            href="/stores/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center shadow-md transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Store
          </Link>
        )}
      </div>

      {store ? (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Cover & Logo Header */}
          <div 
            className="relative h-48 bg-cover bg-center"
            style={{
              backgroundImage: store.cover_url 
                ? `url(${store.cover_url})` 
                : 'linear-gradient(to right, #1d4ed8, #3730a3)'
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <Link
                href={`/stores/${store.slug}`}
                target="_blank"
                className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-xl text-xs font-bold flex items-center shadow transition"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Page
              </Link>
            </div>
          </div>

          {/* Store Details Body */}
          <div className="px-6 sm:px-8 pb-8 pt-4 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 mb-6 gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-lg overflow-hidden border-4 border-white flex items-center justify-center shrink-0">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-blue-600" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/stores/edit"
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center transition"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 text-blue-600" /> Edit Store
                </Link>
                <button
                  onClick={handleDeleteStore}
                  disabled={deleting}
                  className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center transition disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />} 
                  Delete Store
                </button>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900">{store.store_name}</h2>
            {store.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2">{store.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-100 text-xs text-gray-600 font-medium">
              {store.phone && (
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> {store.phone}
                </div>
              )}
              {store.address && (
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> {store.address}, {store.district}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No Store Created Yet</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">ඔබ තවමත් TrendMart හි ව්‍යාපාරික ස්ටෝර් එකක් සාදා නැත. දැන්ම ඔබේ ස්ටෝර් එක සාදාගන්න.</p>
          <Link
            href="/stores/create"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm mt-6 shadow-md transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Your Store Now
          </Link>
        </div>
      )}
    </div>
  )
}