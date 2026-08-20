'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Eye, Image as ImageIcon, MapPin, Tag } from 'lucide-react'

interface Ad {
  id: string
  title: string
  description: string
  price: number
  condition: string
  district: string
  city: string
  images: string[]
  status: string
  created_at: string
}

export default function PendingAdsTable({ pendingAds }: { pendingAds: Ad[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Status Update (Approve / Reject)
  const handleStatusChange = async (adId: string, newStatus: 'active' | 'rejected') => {
    setLoading(true)
    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId)

    setLoading(false)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Ad status successfully updated to ${newStatus}!`)
      setSelectedAd(null)
      router.refresh() // Page එක auto-refresh කර ලැයිස්තුව update කරයි
    }
  }

  const openAdDetails = (ad: Ad) => {
    setSelectedAd(ad)
    setActiveImage(ad.images?.[0] || null)
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Pending Ads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-semibold uppercase text-xs">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title & Details</th>
              <th className="p-4">Price (LKR)</th>
              <th className="p-4">Location</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {pendingAds.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                  නිරීක්ෂණය සඳහා Pending Ads කිසිවක් නොමැත.
                </td>
              </tr>
            ) : (
              pendingAds.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50 transition">
                  {/* Thumbnail */}
                  <td className="p-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border">
                      {ad.images && ad.images.length > 0 ? (
                        <img
                          src={ad.images[0]}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      {ad.images && ad.images.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          +{ad.images.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Info */}
                  <td className="p-4">
                    <p className="font-bold text-gray-900 line-clamp-1">{ad.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600">
                        {ad.condition}
                      </span>
                      <span>•</span>
                      <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="p-4 font-bold text-gray-900">
                    Rs. {ad.price?.toLocaleString()}
                  </td>

                  {/* Location */}
                  <td className="p-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {ad.city}, {ad.district}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => openAdDetails(ad)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium text-xs flex items-center gap-1"
                        title="View Full Ad"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>

                      {/* Quick Approve */}
                      <button
                        onClick={() => handleStatusChange(ad.id, 'active')}
                        disabled={loading}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>

                      {/* Quick Reject */}
                      <button
                        onClick={() => handleStatusChange(ad.id, 'rejected')}
                        disabled={loading}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- AD PREVIEW MODAL -------------------- */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            
            {/* Close Modal Button */}
            <button
              onClick={() => setSelectedAd(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">{selectedAd.title}</h2>

            {/* Main Active Image Display */}
            <div className="mb-4">
              <div className="w-full h-80 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt="Active Preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-gray-400">No images available</p>
                )}
              </div>

              {/* All Images Thumbnails List */}
              {selectedAd.images && selectedAd.images.length > 0 && (
                <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-2">
                  {selectedAd.images.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                        activeImage === imgUrl ? 'border-orange-500 scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ad Information */}
            <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl mb-4 border">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Price</p>
                <p className="text-lg font-extrabold text-orange-600">Rs. {selectedAd.price?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Condition</p>
                <p className="text-sm font-bold text-gray-800 capitalize">{selectedAd.condition}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Location</p>
                <p className="text-sm font-bold text-gray-800">{selectedAd.city}, {selectedAd.district}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Submitted On</p>
                <p className="text-sm font-bold text-gray-800">{new Date(selectedAd.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Ad Description */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-2xl border">
                {selectedAd.description}
              </p>
            </div>

            {/* Modal Approve / Reject Action Buttons */}
            <div className="flex gap-4 border-t pt-4">
              <button
                onClick={() => handleStatusChange(selectedAd.id, 'rejected')}
                disabled={loading}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Reject Ad
              </button>
              <button
                onClick={() => handleStatusChange(selectedAd.id, 'active')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                <CheckCircle2 className="w-5 h-5" /> Approve & Publish
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}