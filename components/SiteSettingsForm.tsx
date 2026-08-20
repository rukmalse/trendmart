'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Image as ImageIcon } from 'lucide-react'

export default function SiteSettingsForm({ initialSettings }: { initialSettings: any }) {
  const supabase = createClient()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`

      // Supabase Storage වෙත Upload කිරීම
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Public URL ලබා ගැනීම[cite: 1]
      const { data: publicUrlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      const logoUrl = publicUrlData.publicUrl

      // State එක update කිරීම
      setSettings((prev: any) => ({ ...prev, site_logo: logoUrl }))
      alert('Logo uploaded successfully! Click "Save Site Settings" to apply changes.')
    } catch (error: any) {
      console.error('Error uploading logo:', error.message)
      alert('Failed to upload logo.')
    } finally {
      setUploading(false)
    }
  }

  // සියලුම Settings Save කිරීම
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('site_settings')
          .upsert({ key, value }, { onConflict: 'key' })
      }
      alert('Site Settings successfully updated!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-8 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        ⚙️ Global Site Settings & Branding
      </h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase">Site Logo</label>
          <div className="flex items-center gap-4">
            {settings.site_logo ? (
              <div className="w-24 h-24 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative">
                <img src={settings.site_logo} alt="Site Logo" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-24 h-24 border rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
                <ImageIcon className="w-6 h-6" />
                <span>No Logo</span>
              </div>
            )}
            
            <div className="flex-1">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400 mt-1">PNG, JPG or SVG (Recommended size: max 500x200px)</p>
              {uploading && <p className="text-xs text-blue-600 font-semibold mt-1">Uploading logo...</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Site Title</label>
          <input 
            type="text"
            value={settings.site_title || ''}
            onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="TrendMart"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Phone</label>
          <input 
            type="text"
            value={settings.contact_phone || ''}
            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+94 ..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Top Announcement Bar Text</label>
          <input 
            type="text"
            value={settings.announcement_bar || ''}
            onChange={(e) => setSettings({ ...settings, announcement_bar: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Announcement text..."
          />
        </div>

        <button 
          type="submit" 
          disabled={saving || uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-md"
        >
          {saving ? 'Saving Changes...' : 'Save Site Settings'}
        </button>
      </form>
    </div>
  )
}