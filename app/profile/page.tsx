'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Mail, ShieldCheck, LogOut, ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function getUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // profiles වගුවෙන් avatar_url එක ලබා ගැනීම
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }

      setLoading(false)
    }
    getUserAndProfile()
  }, [])

  // Profile Picture එක Upload කිරීම සඳහා Function එක
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user) return

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 1. Supabase Storage වෙත Upload කිරීම (ad-images බකට් එක භාවිතා කරයි)
      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // 2. Public URL එක ලබා ගැනීම
      const { data: publicUrlData } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // 3. Database එකේ profiles වගුව update කිරීම
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(newAvatarUrl)
      alert('Profile picture updated successfully!')
      router.refresh()
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Profile...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-5 sm:p-8 border shadow-sm">
        
        <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-4 sm:mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>

        {/* Profile Header with Avatar Upload (Mobile Optimized) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-6 text-center sm:text-left">
          <div className="relative group">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-2xl border shadow-inner mx-auto sm:mx-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.email?.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Hover/Tap Upload Overlay */}
            <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
              <Upload className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                disabled={uploading} 
                className="hidden" 
              />
            </label>
          </div>

          <div>
            <h1 className="text-xl font-black text-gray-900">User Profile</h1>
            <p className="text-xs text-gray-500 mt-1">
              {uploading ? 'Uploading new picture...' : 'Tap image to change profile picture'}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-b py-6 my-6">
          <div className="flex items-center text-sm overflow-hidden">
            <Mail className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <div className="truncate">
              <p className="text-xs text-gray-400 font-semibold">Email Address</p>
              <p className="font-bold text-gray-800 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <ShieldCheck className="w-5 h-5 text-green-500 mr-3 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-semibold">Account Status</p>
              <p className="font-bold text-green-600">Active / Verified</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl flex items-center justify-center transition text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout from Account
        </button>

      </div>
    </main>
  )
}