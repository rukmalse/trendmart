'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, PhoneCall, Share2, ShieldCheck, Phone, Check, Briefcase } from 'lucide-react'

// Leaflet සිතියම SSR (Server-Side Rendering) දෝෂ මඟහරවා ගැනීම සඳහා dynamic import කිරීම
const LocationMap = dynamic(() => import('@/components/LocationMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-gray-400">Loading Map...</div>
})

export default function ServiceDetailPage() {
  const params = useParams()
  // URL එකේ ඇති [id] හෝ encoded `%5Bid%5D` වැරදි ලෙස ලබා ගැනීම වැළැක්වීම
  const rawId = params?.id
  const serviceId = typeof rawId === 'string' ? decodeURIComponent(rawId) : ''
  
  const supabase = createClient()

  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 🌟 Action States
  const [showPhone, setShowPhone] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchServiceDetails() {
      // id එක නිවැරදි UUID එකක් දැයි පරීක්ෂා කිරීම (literal `[id]` හෝ හිස් වීම වැළැක්වීමට)
      if (!serviceId || serviceId === '[id]' || serviceId.includes('%5B')) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (error) {
        console.error('Error fetching service details:', error.message)
      }

      if (data) {
        setService(data)
      }
      setLoading(false)
    }

    fetchServiceDetails()
  }, [serviceId])

  // 📞 Call Provider Functionality
  const phoneNumber = service?.phone || '0771234567'

  const handleCallProvider = (e: React.MouseEvent) => {
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      e.preventDefault()
      setShowPhone(!showPhone)
    }
  }

  // 🔗 Share Service Functionality
  const handleShareService = async () => {
    const shareData = {
      title: service?.business_name || 'Trend Mart Service',
      text: `Check out this service on Trend Mart: ${service?.business_name}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch (err) {
        alert('Link එක copy කර ගැනීමට නොහැකි විය.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800">සේවාව සොයාගැනීමට නොහැකි විය.</h2>
        <p className="text-gray-500 text-sm mt-1">මෙම සේවාව ඉවත් කර හෝ අක්‍රිය කර තිබිය හැක.</p>
        <Link 
          href="/" 
          className="mt-4 bg-orange-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition hover:bg-orange-600"
        >
          මුල් පිටුවට යන්න
        </Link>
      </div>
    )
  }

  // සිතියම පෙන්වීම සඳහා Coordinates සකස් කර ගැනීම
  const hasCoordinates = service.latitude && service.longitude;
  const mapCenter = hasCoordinates 
    ? { lat: Number(service.latitude), lng: Number(service.longitude) } 
    : { lat: 7.8731, lng: 80.7718 }; // Default: Sri Lanka Center

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Service Info & Description */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service Header */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                {service.service_category_id || service.category || 'Service'}
              </span>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                Verified Provider
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{service.business_name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <MapPin className="w-4 h-4 text-orange-500" /> {service.address || 'Sri Lanka'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" /> {new Date(service.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Service Overview / Specification */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Category</p>
                  <p className="text-sm font-bold text-gray-800 capitalize">{service.service_category_id || service.category || 'General'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Location</p>
                  <p className="text-sm font-bold text-gray-800 truncate max-w-[180px]">{service.address || 'Sri Lanka'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-gray-900">About the Service</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {service.description || 'විස්තර සඳහන් කර නොමැත.'}
            </p>
          </div>

          {/* Location Map Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Service Location</h3>
            <div className="w-full rounded-2xl overflow-hidden border">
              <LocationMap 
                center={mapCenter} 
                locations={[service]} 
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Contact Card */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 sticky top-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Contact Service Provider</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">
                {service.business_name}
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Action Buttons */}
            <div className="space-y-3">
              
              {/* 📞 Call Provider Button */}
              <div className="space-y-2">
                <a
                  href={`tel:${phoneNumber}`}
                  onClick={handleCallProvider}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  {showPhone ? phoneNumber : 'Call Provider'}
                </a>

                {showPhone && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-900 font-bold text-center py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    <span>{phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Button (If available) */}
              {service.whatsapp && (
                <a
                  href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <span>Chat on WhatsApp</span>
                </a>
              )}
              
              {/* 🔗 Share Service Button */}
              <button
                onClick={handleShareService}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <span>Share Service</span>
                  </>
                )}
              </button>

            </div>

            {/* Safety Tips Box */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Safety Tips
              </div>
              <ul className="text-xs text-blue-900/80 space-y-1 list-disc list-inside">
                <li>සේවා ලබා ගැනීමට පෙර ගිවිසුම් හෝ කොන්දේසි ගැන සාකච්ඡා කරන්න.</li>
                <li>කලින් සම්පූර්ණ මුදල් ගෙවීමෙන් වළකින්න.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </main>
  )
}