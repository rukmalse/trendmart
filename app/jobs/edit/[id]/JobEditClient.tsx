'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react'

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default function JobEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  
  // Job Form Fields (მოცემულია Discount Price සමඟ)
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [salary, setSalary] = useState<string>('')
  const [discountPrice, setDiscountPrice] = useState<string>('')
  const [location, setLocation] = useState<string>('')

  useEffect(() => {
    async function fetchJobDetails() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        alert('Job not found!')
        router.push('/')
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setSalary(data.salary ? String(data.salary) : '')
      setDiscountPrice(data.discount_price ? String(data.discount_price) : '')
      setLocation(data.location || '')
      setLoading(false)
    }

    fetchJobDetails()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('jobs')
      .update({
        title,
        description,
        salary: salary ? Number(salary) : null,
        discount_price: discountPrice ? Number(discountPrice) : null,
        location,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      alert('Error updating job: ' + error.message)
    } else {
      alert('Job updated successfully!')
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading job details...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <h1 className="text-lg font-black text-gray-900">Edit Job</h1>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Job Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Salary / Regular Price (LKR)</label>
                <input 
                  type="number" 
                  value={salary} 
                  onChange={(e) => setSalary(e.target.value)} 
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-600 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Discount Price (LKR)
                </label>
                <input 
                  type="number" 
                  value={discountPrice} 
                  onChange={(e) => setDiscountPrice(e.target.value)} 
                  placeholder="Optional discounted price"
                  className="w-full px-4 py-3 rounded-2xl border border-orange-200 bg-orange-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
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