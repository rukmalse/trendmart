'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    category: 'Service',
    address: '',
    phone: '',
    whatsapp: '',
    description: '',
  })

  // 1. අදාළ දැන්වීමේ දත්ත ලබා ගැනීම (Fetch Data)
  useEffect(() => {
    async function fetchService() {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setFormData({
          business_name: data.business_name || '',
          category: data.category || 'Service',
          address: data.address || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          description: data.description || '',
        })
      } else if (error) {
        alert('දත්ත ලබාගැනීමේ දෝෂයක්: ' + error.message)
      }
      setLoading(false)
    }

    fetchService()
  }, [id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 2. දත්ත යාවත්කාලීන කිරීම (Update)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from('service_providers')
      .update({
        business_name: formData.business_name,
        category: formData.category,
        address: formData.address,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        description: formData.description,
      })
      .eq('id', id)

    if (error) {
      alert('യාවත්කාලීන කිරීමේ දෝෂයක්: ' + error.message)
      setUpdating(false)
    } else {
      alert('දැන්වීම සාර්ථකව යාවත්කාලීන කරන ලදී!')
      router.push('/dashboard/my-ads')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">සේවා දැන්වීම සංස්කරණය කරන්න (Edit Service)</h1>
            <p className="text-sm text-gray-500">ඔබගේ දැන්වීමේ විස්තර වෙනස් කර Update කරන්න.</p>
          </div>
          <Link href="/dashboard/my-ads" className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">දැන්වීමේ නම / ව්‍යාපාරයේ නම</label>
            <input 
              type="text" 
              name="business_name" 
              required
              value={formData.business_name} 
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
              >
                <option value="Service">General Service</option>
                <option value="Manpower">Manpower / Job</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ලිපිනය / ප්‍රදේශය</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
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
                className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp අංකය</label>
              <input 
                type="text" 
                name="whatsapp" 
                value={formData.whatsapp} 
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
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
              className="w-full p-3 bg-gray-50 border rounded-xl text-sm focus:outline-orange-500"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={updating}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>වෙනස්කම් සුරකින්න (Update)</span>
          </button>
        </form>
      </div>
    </main>
  )
}