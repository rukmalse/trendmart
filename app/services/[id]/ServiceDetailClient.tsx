'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, User, Phone, Mail, ShieldCheck } from 'lucide-react'

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default function ServiceDetailClient({ id }: { id: string }) {
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [uniqueImages, setUniqueImages] = useState<string[]>([])

  useEffect(() => {
    async function fetchServiceDetails() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      setService(data)

      // Remove duplicate image links if any
      const rawImages = data.images && data.images.length > 0 ? data.images : ['/placeholder.png']
      const filteredImages = Array.from(new Set(rawImages)) as string[]
      
      setUniqueImages(filteredImages)
      if (filteredImages.length > 0) {
        setSelectedImage(filteredImages[0])
      }

      setLoading(false)
    }

    fetchServiceDetails()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading service details...</p>
      </div>
    )
  }

  if (!service) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
            Service
          </span>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Viewer Container */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-4">
              <div className="relative w-full h-[350px] sm:h-[450px] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
                <Image 
                  src={selectedImage || uniqueImages[0] || '/placeholder.png'} 
                  alt={service.title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                  className="object-cover" 
                />
              </div>

              {/* Thumbnails */}
              {uniqueImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {uniqueImages.map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 bg-gray-100 transition ${
                        selectedImage === img ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-400'
                      }`}
                    >
                      <Image 
                        src={img} 
                        alt={`Thumb ${idx}`} 
                        fill 
                        sizes="80px"
                        className="object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Title, Price and Details */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight break-words">
                {service.title}
              </h1>

              {service.price && (
                <div className="text-2xl sm:text-3xl font-black text-orange-600">
                  LKR {Number(service.price).toLocaleString()}
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500 gap-4 pt-2 border-t">
                {service.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" /> {service.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" /> {new Date(service.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Service Description</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed break-all">
                  {service.description || 'No description provided.'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Side: Contact Box */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Service Provider</h3>
                  <p className="text-xs text-gray-400">Verified Professional</p>
                </div>
              </div>

              <div className="space-y-3">
                {service.phone && (
                  <a 
                    href={`tel:${service.phone}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Phone className="w-4 h-4" /> {service.phone}
                  </a>
                )}

                {service.email && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs text-gray-600 break-all">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{service.email}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>ආරක්ෂිත උපදෙස්</span>
                </div>
                <p className="text-blue-900/80 leading-relaxed">
                  සේේවාව ලබා ගැනීමට පෙර තත්ත්වය පරීක්ෂා කර බලා කටයුතු කරන්න.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}