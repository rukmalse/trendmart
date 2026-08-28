'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlusCircle, Upload, X, Store, Tag } from 'lucide-react'

// Sri Lanka Districts List (සම්පූර්ණ දිස්ත්‍රික්ක 25)
const sriLankaDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

function PostAdForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL එකෙන් store_id එක තිබේදැයි පරීක්ෂා කිරීම (උදා: /post-ad?store_id=xxx)
  const prefilledStoreId = searchParams.get('store_id') || ''

  const [loading, setLoading] = useState(false)
  const [userStores, setUserStores] = useState<any[]>([]) // පරිශීලකයාගේ Stores ලැයිස්තුව
  const [categories, setCategories] = useState<any[]>([]) // 🌟 ඩේටාබේස් එකෙන් එන Categories ලැයිස්තුව සඳහා State එකක්

  // Form States
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('') // මෙහි දැන් store වන්නේ Category එකේ UUID එකයි
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('') // 🌟 නව එකතු කිරීම: වට්ටම් මිල (Discount Price)
  const [condition, setCondition] = useState('used')
  const [district, setDistrict] = useState('Colombo')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState(prefilledStoreId)

  // Multi-Image Upload States (Up to 10 Images)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // 🌟 Page Load වන විට User ගේ Stores සහ Database එකෙන් Categories ඩයිනමික් ලෙස Fetch කර ගැනීම
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Categories from Database
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (catError) {
        console.error('Error fetching categories:', catError.message)
      } else if (catData) {
        // අනුපිටපත් (duplicates) වැළැක්වීම සඳහා
        const uniqueCategories = Array.from(
          new Map(catData.map(item => [item.name?.trim().toLowerCase(), item])).values()
        )
        setCategories(uniqueCategories)
      }

      // 2. Fetch User Stores
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: stores } = await supabase
          .from('stores')
          .select('id, store_name')
          .eq('user_id', user.id)
        
        if (stores) {
          setUserStores(stores)
        }
      }
    }
    fetchData()
  }, [supabase])

  // Images Select කරන අවස්ථාව (Max 10 Validation)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)

      if (imageFiles.length + selectedFiles.length > 10) {
        alert('ඔබට එකතු කළ හැක්කේ උපරිම ඡායාරූප 10ක් පමණි!')
        return
      }

      const updatedFiles = [...imageFiles, ...selectedFiles]
      setImageFiles(updatedFiles)

      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  // Selected Image එකක් අයින් කිරීම
  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])

    const updatedFiles = imageFiles.filter((_, i) => i !== index)
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index)
    setImageFiles(updatedFiles)
    setImagePreviews(updatedPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Current Active Logged-In User පරික්ෂා කිරීම
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      alert('කරුණාකර Ad එකක් පළ කිරීමට ප්‍රථම Log in වන්න!')
      setLoading(false)
      router.push('/login')
      return
    }

    const uploadedImageUrls: string[] = []

    // 2. Images Supabase Storage එකට Upload කිරීම
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `ads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(filePath, file)

        if (uploadError) {
          alert('Image upload failed: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('ad-images')
          .getPublicUrl(filePath)

        uploadedImageUrls.push(publicUrlData.publicUrl)
      }
    }

    // 3. ඩේටාබේස් එකට Ad එක Insert කිරීම (discount_price ද සමඟ)
    const { error } = await supabase
      .from('ads')
      .insert([
        {
          user_id: user.id,
          category_id: categoryId,
          title,
          description,
          price: parseFloat(price),
          discount_price: discountPrice ? parseFloat(discountPrice) : null, // 🌟 මෙතැනින් discount price එක යැවේ (නැත්නම් null වේ)
          condition,
          district,
          city,
          images: uploadedImageUrls,
          store_id: selectedStoreId ? selectedStoreId : null,
          status: 'pending',
        },
      ])

    setLoading(false)

    if (error) {
      alert('Error creating ad: ' + error.message)
    } else {
      alert('ඔබගේ Ad එක සාර්ථකව යොමු කෙරුණි! Admin අනුමත කළ පසු එය පළවනු ඇත.')
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center">
          <PlusCircle className="w-7 h-7 text-orange-500 mr-2" /> Post Your Classified Ad
        </h1>
        <p className="text-sm text-gray-500 mb-8">Fill in the details below to publish your listing on Trend Mart.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Link to Your Store (Optional Dropdown) */}
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-blue-600" /> Link to Your Store (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">ඔබට අවශ්‍ය නම් මෙම Ad එක ඔබගේ ව්‍යාපාරික Store එක යටතේ ප්‍රදර්ශනය කළ හැක.</p>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
              <option value="">-- No Store (Independent Ad) --</option>
              {userStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Image Upload Box */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">Upload Photos (Up to 10)</label>
              <span className="text-xs text-gray-500 font-medium">{imageFiles.length} / 10 Selected</span>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:bg-gray-50 transition min-h-[160px] flex flex-col justify-center items-center">
              {imageFiles.length < 10 && (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full py-4">
                  <Upload className="w-8 h-8 text-orange-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Click to upload images</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB (Select multiple files)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full mt-2">
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      className={`relative group aspect-square rounded-xl overflow-hidden border transition ${
                        index === 0 ? 'border-orange-500 ring-2 ring-orange-400 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-[10px] font-bold text-center py-0.5 shadow">
                          Main Cover
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Toyota Vitz 2018 or iPhone 14 Pro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4 text-orange-500" /> Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white cursor-pointer"
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

          {/* Price & Discount Price Inputs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Regular Price (LKR) *</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                <span>Discount Price (LKR)</span>
                <span className="text-xs text-gray-400 font-normal">Optional</span>
              </label>
              <input
                type="number"
                placeholder="130000 (වට්ටම් මිලක් ඇත්නම්)"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-orange-50/20"
              />
            </div>
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
                {sriLankaDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Nugegoda / Kadawatha"
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
              placeholder="Provide more details about item condition, features, reason to sell..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Uploading & Publishing...' : 'Publish Ad Now'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function PostAdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <PostAdForm />
    </Suspense>
  )
}