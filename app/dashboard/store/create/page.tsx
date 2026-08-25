'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Store, Phone, MapPin, FileText, Globe, ArrowRight } from 'lucide-react'

const sriLankaDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

export default function CreateStorePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [formData, setFormData] = useState({
    store_name: '',
    slug: '',
    description: '',
    phone: '',
    address: '',
    district: 'Colombo',
    logo_url: '',
  })

  // ස්ටෝර් නම වෙනස් වන විට ස්වයංක්‍රීයව Slug එක පසුබිමෙන් සකසා ගැනීම
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')

    setFormData({
      ...formData,
      store_name: val,
      slug: generatedSlug,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // ඩේටාබේස් එකට ස්ටෝර් එක ඇතුළත් කිරීම (Slug එක ස්වයංක්‍රීයව යවනු ලැබේ)
      const { error } = await supabase.from('stores').insert({
        user_id: user.id,
        store_name: formData.store_name,
        slug: formData.slug || 'store-' + Date.now(), // Slug එක හිස් වුවහොත් fallback එකක් ලෙස ID එකක් එක්වේ
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        district: formData.district,
        logo_url: formData.logo_url,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push(`/store/${formData.slug}`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <div className="flex items-center space-x-3">
            <Store className="w-8 h-8" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black">Create Your Digital Store</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Showcase your products and business online under your own link.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Store Name</label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={handleNameChange}
              placeholder="e.g. Cursor-Click IT Solutions"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* 🛑 URL Slug Input කොටස මෙහිදී සම්පූර්ණයෙන්ම ඉවත් කර ඇත (Hidden) */}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone Number</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Phone className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0760661264"
                  className="w-full bg-transparent text-sm focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">District</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium cursor-pointer"
              >
                {sriLankaDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Store Address</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="No: 22/1/2, Kandewatta Road, Randeniya"
                className="w-full bg-transparent text-sm focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Logo Image URL (Optional)</label>
            <input
              type="text"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Store Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write a short description about your business..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center text-sm"
          >
            {loading ? 'Creating Store...' : 'Create Store Now'} <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </form>
      </div>
    </div>
  )
}