'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default function EditAdClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  
  // Ad Form Fields
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [phone, setPhone] = useState<string>('')

  useEffect(() => {
    async function fetchAdDetails() {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        alert('Ad not found!')
        router.push('/')
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setPrice(data.price ? String(data.price) : '')
      setCity(data.city || '')
      setPhone(data.phone || '')
      setLoading(false)
    }

    fetchAdDetails()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('ads')
      .update({
        title,
        description,
        price: price ? Number(price) : null,
        city,
        phone,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      alert('Error updating ad: ' + error.message)
    } else {
      alert('Ad updated successfully!')
      router.push(`/ads/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading ad details...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href={`/ads/${id}`} className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Ad
          </Link>
          <h1 className="text-lg font-black text-gray-900">Edit Advertisement</h1>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ad Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Price (LKR)</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                rows={5} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>

          </form>
        </div>

      </div>
    </main>
  )
}