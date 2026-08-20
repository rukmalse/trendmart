'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Edit3, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const adId = resolvedParams.id

  const supabase = createClient()
  const router = useRouter()

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form States
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('used')
  const [district, setDistrict] = useState('Colombo')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')

  // Image Upload States
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    async function initData() {
      // 1. Fetch Categories
      const { data: catData } = await supabase.from('categories').select('*').order('name')
      if (catData) setCategories(catData)

      // 2. Fetch Ad Details
      const { data: adData, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single()

      if (error || !adData) {
        alert('Ad එක සොයා ගැනීමට නොහැකි විය!')
        router.push('/dashboard')
        return
      }

      // Populate States
      setTitle(adData.title || '')
      setCategoryId(adData.category_id || '')
      setPrice(adData.price ? adData.price.toString() : '')
      setCondition(adData.condition || 'used')
      setDistrict(adData.district || 'Colombo')
      setCity(adData.city || '')
      setDescription(adData.description || '')
      
      if (adData.images && adData.images.length > 0) {
        setExistingImageUrl(adData.images[0])
        setImagePreview(adData.images[0])
      }

      setLoading(false)
    }

    initData()
  }, [adId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let finalImageUrl = existingImageUrl

    // Upload New Image if Selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        alert('Image upload failed: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath)

      finalImageUrl = publicUrlData.publicUrl
    }

    // Update Record
    const { error } = await supabase
      .from('ads')
      .update({
        category_id: categoryId,
        title,
        description,
        price: parseFloat(price),
        condition,
        district,
        city,
        images: finalImageUrl ? [finalImageUrl] : [],
      })
      .eq('id', adId)

    setSaving(false)

    if (error) {
      alert('Error updating ad: ' + error.message)
    } else {
      alert('ඔබගේ Ad එක සාර්ථකව Update කරන ලදී!')
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Loading Ad Data...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center">
          <Edit3 className="w-7 h-7 text-blue-600 mr-2" /> Edit Classified Ad
        </h1>
        <p className="text-sm text-gray-500 mb-8">Update details for your listing.</p>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Image Upload Box */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:bg-gray-50 transition relative flex flex-col items-center justify-center min-h-[160px]">
              {imagePreview ? (
                <div className="relative w-full h-48">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setExistingImageUrl(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow hover:bg-red-600"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                  <Upload className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Click to upload new image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="used">Used</option>
                <option value="new">Brand New</option>
                <option value="reconditioned">Reconditioned</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* District & City */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kandy">Kandy</option>
                <option value="Kurunegala">Kurunegala</option>
                <option value="Galle">Galle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 text-sm"
          >
            {saving ? 'Updating Ad...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  )
}