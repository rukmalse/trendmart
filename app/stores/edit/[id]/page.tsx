'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Store, Upload, Image as ImageIcon, MapPin, Phone, Loader2, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const sriLankaDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

export default function EditStorePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [storeId, setStoreId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  useEffect(() => {
    fetchStoreData()
  }, [])

  const fetchStoreData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        router.push('/dashboard/store')
        return
      }

      setStoreId(data.id)
      setStoreName(data.store_name || '')
      setSlug(data.slug || '')
      setDescription(data.description || '')
      setPhone(data.phone || '')
      setDistrict(data.district || '')
      setAddress(data.address || '')
      setLogoUrl(data.logo_url || '')
      setCoverUrl(data.cover_url || '')
    } catch (err: any) {
      console.error('Error fetching store details:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingLogo(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `store-logos/${fileName}`

      const { error: uploadError } = await supabase.storage.from('store-images').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('store-images').getPublicUrl(filePath)
      setLogoUrl(data.publicUrl)
    } catch (err: any) {
      alert('Logo upload error: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Upload Cover
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingCover(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `store-covers/${fileName}`

      const { error: uploadError } = await supabase.storage.from('store-images').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('store-images').getPublicUrl(filePath)
      setCoverUrl(data.publicUrl)
    } catch (err: any) {
      alert('Cover upload error: ' + err.message)
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: storeName,
          slug: slug,
          description: description,
          phone: phone,
          district: district,
          address: address,
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .eq('id', storeId)

      if (error) throw error

      router.push('/dashboard/store')
    } catch (err: any) {
      setErrorMessage(err.message || 'ස්ටෝර් එක යාවත්කාලීන කිරීමේදී දෝෂයක් ඇති විය.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-10">
        
        <Link href="/dashboard/store" className="inline-flex items-center text-gray-500 hover:text-gray-800 text-xs font-bold mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Edit Store Details</h1>
            <p className="text-xs text-gray-500 font-medium">ඔබගේ ස්ටෝර් විස්තර වෙනස් කර Update කරන්න</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Store Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Cover Photo (Banner)</label>
            <div className="relative h-40 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                  {uploadingCover ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin" /> : <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />}
                  <span className="text-xs font-semibold text-gray-500">Upload Cover Image</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Store Logo</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    {uploadingLogo ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Contact & District */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">District *</label>
              <select
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="">Select District</option>
                {sriLankaDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Store Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Store Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs sm:text-sm font-medium focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingLogo || uploadingCover}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Store className="w-5 h-5 mr-2" />}
            Save Changes
          </button>
        </form>
      </div>
    </main>
  )
}