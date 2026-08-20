'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Upload, Save, Palette, Phone } from 'lucide-react'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [siteName, setSiteName] = useState('Trend Mart')
  const [primaryColor, setPrimaryColor] = useState('#f97316')
  const [contactNumber, setContactNumber] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setSiteName(data.site_name || 'Trend Mart')
        setPrimaryColor(data.primary_color || '#f97316')
        setContactNumber(data.contact_number || '')
        setLogoPreview(data.logo_url || '')
      }
      setFetching(false)
    }
    fetchSettings()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let logoUrl = logoPreview

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `settings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, logoFile)

      if (uploadError) {
        alert('Logo upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath)

      logoUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase
      .from('settings')
      .update({
        site_name: siteName,
        primary_color: primaryColor,
        contact_number: contactNumber,
        updated_at: new Date(),
      })
      .eq('id', 1)

    setLoading(false)

    if (error) {
      alert('Error updating settings: ' + error.message)
    } else {
      alert('වෙබ් අඩවියේ සැකසුම් සාර්ථකව යාවත්කාලීන කරන ලදී!')
      router.refresh()
    }
  }

  if (fetching) {
    return <div className="text-center py-20 font-bold text-lg">Loading settings...</div>
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border shadow-lg space-y-6">
        
        {/* Title Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1 flex items-center">
            <Settings className="w-7 h-7 text-orange-500 mr-2" /> Admin Customization Panel
          </h1>
          <p className="text-sm text-gray-500">Manage your site branding, logo, and phone contact info.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* 1. DIRECT VISIBLE CONTACT NUMBER BOX (Highlighted in Red/Orange border to spot instantly) */}
          <div className="bg-orange-50 p-5 rounded-2xl border-2 border-orange-400 space-y-2">
            <label className="text-sm font-bold text-orange-900 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-orange-600" /> 
              ENTER CONTACT NUMBER (මෙන්න අංකය දමන කොටුව)
            </label>
            <p className="text-xs text-orange-700">මෙම අංකය වෙබ් අඩවියේ Footer කොටසෙහි ස්වයංක්‍රීයව පෙන්වනු ඇත.</p>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="උදා: 0760661264"
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 focus:border-orange-600 focus:outline-none text-base font-bold bg-white text-gray-900"
            />
          </div>

          {/* Site Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Site Name</label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm text-gray-900 bg-white"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website Logo</label>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="w-20 h-20 border rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center p-1">
                  <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 border rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  No Logo
                </div>
              )}
              
              <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 flex items-center shadow-sm transition">
                <Upload className="w-4 h-4 mr-2 text-orange-500" />
                Upload New Logo
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Palette className="w-4 h-4 mr-1.5 text-orange-500" /> Theme Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border cursor-pointer p-1 bg-white"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 px-4 py-2.5 rounded-xl border text-sm uppercase font-mono text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 text-base flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving Changes...' : 'Save Site Settings'}
          </button>
        </form>
      </div>
    </main>
  )
}