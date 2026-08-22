'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Phone, Building2, FileText, CheckCircle2 } from 'lucide-react'

const SERVICE_CATEGORIES = [
  'Electrician & Wiring',
  'Plumbing & Water Systems',
  'Masonry & Construction',
  'AC Repair & Maintenance',
  'CCTV & Security Systems',
  'IT, Computer & Laptop Repair',
  'House & Office Cleaning',
  'Vehicle Repair & Mechanics',
  'Salons, Bridal & Beauty',
  'Catering & Cooking Services',
  'Education & Tuition Classes',
  'Other Professional Services'
]

export default function PostServicePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    service_category_id: SERVICE_CATEGORIES[0], 
    phone: '',
    whatsapp: '',
    address: '',
    description: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('කරුණාකර පළමුව Login වන්න!')
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('service_providers')
      .insert([
        {
          user_id: user.id,
          business_name: formData.business_name,
          service_category_id: formData.service_category_id, 
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          address: formData.address,
          description: formData.description,
          latitude: 6.9271,  // ඩිෆෝල්ට් GPS අගයන් (මැප් එකේ පෙන්වීම සඳහා)
          longitude: 79.8612,
          verified: false
        }
      ])

    setLoading(false)

    if (error) {
      console.error('Error inserting service:', error.message)
      alert('දෝෂයක් සිදු විය: ' + error.message)
    } else {
      alert('ඔබගේ සේවාව සාර්ථකව ඇතුළත් කරන ලදී!')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-sm border">
        
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Post a New Service</h1>
          <p className="text-sm text-gray-500 mt-1">ඔබගේ ව්‍යාපාරය හෝ සේවාව Trend Mart GPS Directory එකේ නොමිලේ ලියාපදිංචි කරන්න.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
              <Building2 className="w-4 h-4 text-orange-500" /> Business / Service Name *
            </label>
            <input 
              type="text" 
              name="business_name" 
              value={formData.business_name} 
              onChange={handleChange} 
              required 
              placeholder="උදා: Apex Motors & Repair"
              className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-orange-500" /> Category *
            </label>
            <select 
              name="service_category_id" 
              value={formData.service_category_id} 
              onChange={handleChange} 
              required 
              className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50 cursor-pointer"
            >
              {SERVICE_CATEGORIES.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Phone className="w-4 h-4 text-orange-500" /> Phone Number *
              </label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                placeholder="07xxxxxxxx"
                className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Phone className="w-4 h-4 text-green-600" /> WhatsApp Number (Optional)
              </label>
              <input 
                type="text" 
                name="whatsapp" 
                value={formData.whatsapp} 
                onChange={handleChange} 
                placeholder="07xxxxxxxx"
                className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-orange-500" /> Address *
            </label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              required
              placeholder="ලිපිනය සඳහන් කරන්න (උදා: Main Street, Dambulla)"
              className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
              <FileText className="w-4 h-4 text-orange-500" /> Description / Services Offered
            </label>
            <textarea 
              name="description" 
              rows={5}
              value={formData.description} 
              onChange={handleChange} 
              placeholder="ඔබ සපයන සේවාවන් ගැන විස්තරපූර්වකව ලියන්න..."
              className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/50"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 rounded-xl transition shadow-lg text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Service...
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Post Service Now
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}