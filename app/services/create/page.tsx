'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PlusCircle, Loader2 } from 'lucide-react'

export default function CreateServicePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    category: 'Service', // හෝ Manpower
    address: '',
    phone: '',
    whatsapp: '',
    description: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. දැනට Login වී සිටින යූසර්ගේ ID එක ලබා ගැනීම
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('කරුණාකර පළමුව Login වන්න!')
      router.push('/login')
      return
    }

    // 2. service_providers වගුවට ඩේටා ඇතුළත් කිරීම (user_id සමඟ)
    const { error } = await supabase
      .from('service_providers')
      .insert([
        {
          user_id: user.id, // ඉතාමත් වැදගත්: යූසර්ව වෙන් කර හඳුනා ගැනීමට
          business_name: formData.business_name,
          category: formData.category,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          description: formData.description,
        }
      ])

    if (error) {
      alert('දෝෂයක් සිදු විය: ' + error.message)
      setLoading(false)
    } else {
      alert('දැන්වීම සාර්ථකව පළ කරන ලදී!')
      router.push('/dashboard/my-ads') // දැන්වීම් පෙන්වන පිටුවට යැවීම
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">අලුත් දැන්වීමක් දමන්න (Post Ad)</h1>
          <p className="text-sm text-gray-500">ඔබගේ සේවාව හෝ මෑන්පවර් දැන්වීම මෙහි සටහන් කරන්න.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">දැන්වීමේ නම / ව්‍යාපාරයේ නම</label>
            <input 
              type="text" 
              name="business_name" 
              required
              value={formData.business_name} 
              onChange={handleChange}
              placeholder="උදා: Electrical & Wiring Services / Mason Works"
              className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">အမျိုးအစား (Category)</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Service">General Service</option>
                <option value="Manpower">Manpower / Job</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ලිපිනය / ප්‍රදේශය (Address)</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                placeholder="උදා: Dambulla"
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">දුරකථන අංකය</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                placeholder="0771234567"
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp අංකය</label>
              <input 
                type="text" 
                name="whatsapp" 
                value={formData.whatsapp} 
                onChange={handleChange}
                placeholder="0771234567"
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">විස්තරය (Description)</label>
            <textarea 
              name="description" 
              rows={4}
              value={formData.description} 
              onChange={handleChange}
              placeholder="ඔබ සපයන සේවාව පිළිබඳව විස්තරයක් මෙහි ලියන්න..."
              className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            <span>දැන්වීම ප්‍රකාශයට පත් කරන්න</span>
          </button>
        </form>
      </div>
    </main>
  )
}