'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Tag, Trash2, Eye, RefreshCw, Edit, Zap, User, Mail, Phone, MapPin, Heart, Save, Loader2, Camera, Store, Upload, CheckCircle, Megaphone, PlusCircle } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null)
  const [bumpingId, setBumpingId] = useState<string | null>(null)

  // Slip Upload Modal States
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [selectedAdForSlip, setSelectedAdForSlip] = useState<string | null>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [uploadingSlip, setUploadingSlip] = useState(false)

  // Profile Editable Fields & Avatar
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Saved Ads (Wishlist)
  const [savedAds, setSavedAds] = useState<any[]>([])
  const [adsLoading, setAdsLoading] = useState(true)

  const loadUserDataAndAds = async () => {
    setLoading(true)

    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setCity(profile.city || '')
      setAvatarUrl(profile.avatar_url || '')
    }

    const { data: catData } = await supabase.from('categories').select('id, name')
    if (catData) {
      const catMap: Record<string, string> = {}
      catData.forEach(c => { catMap[c.id] = c.name })
      setCategoriesMap(catMap)
    }

    const { data: userAds, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (!adsError) {
      setAds(userAds || [])
    }

    const { data: userStores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (!storesError) {
      setStores(userStores || [])
    }

    try {
      const favorites = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
      if (favorites.length > 0) {
        const { data: savedData } = await supabase
          .from('ads')
          .select('*')
          .in('id', favorites)
        setSavedAds(savedData || [])
      } else {
        setSavedAds([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAdsLoading(false)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUserDataAndAds()
  }, [])

  const handleRemoveSavedAd = (adId: string) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('trendmart_favorites') || '[]')
      const updatedFavorites = favorites.filter((id: string) => id !== adId)
      localStorage.setItem('trendmart_favorites', JSON.stringify(updatedFavorites))
      setSavedAds(prev => prev.filter(ad => ad.id !== adId))
    } catch (e) {
      console.error(e)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user) return

      setUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq('id', user.id)

      alert('Profile picture updated successfully! 📸')
    } catch (error: any) {
      alert('Error uploading image: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUpdatingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        city: city,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      })
      .eq('id', user.id)

    if (error) {
      alert(`Error updating profile: ${error.message}`)
    } else {
      alert('Profile updated successfully! 🎉')
    }
    setUpdatingProfile(false)
  }

  const handleDeleteAd = async (adId: string) => {
    const confirmDelete = window.confirm('ඔබට විශ්වාසද මෙම Ad එක ඉවත් කිරීමට අවශ්‍ය බව?')
    if (!confirmDelete) return

    setDeletingId(adId)
    const { error } = await supabase.from('ads').delete().eq('id', adId)

    if (error) {
      alert('Ad එක delete කිරීමට නොහැකි විය: ' + error.message)
    } else {
      setAds(prevAds => prevAds.filter(ad => ad.id !== adId))
      alert('Ad එක සාර්ථකව ඉවත් කළා!')
    }
    setDeletingId(null)
  }

  const handleDeleteStore = async (storeId: string) => {
    const confirmDelete = window.confirm('ඔබට විශ්වාසද මෙම Store එක ඉවත් කිරීමට අවශ්‍ය බව?')
    if (!confirmDelete) return

    setDeletingStoreId(storeId)
    const { error } = await supabase.from('stores').delete().eq('id', storeId)

    if (error) {
      alert('Store එක delete කිරීමට නොහැකි විය: ' + error.message)
    } else {
      setStores(prevStores => prevStores.filter(store => store.id !== storeId))
      alert('Store එක සාර්ථකව ඉවත් කළා!')
    }
    setDeletingStoreId(null)
  }

  const handleRequestApproval = async (adId: string) => {
    const confirmApproval = window.confirm('ඔබට මෙම Ad එක නැවත Publish කිරීම සඳහා Admin අනුමැතියට යැවීමට අවශ්‍යද?')
    if (!confirmApproval) return

    setBumpingId(adId)
    const { error } = await supabase.from('ads').update({ status: 'pending' }).eq('id', adId)

    if (error) {
      alert('ඉල්ලීම යැවීමට නොහැකි විය: ' + error.message)
    } else {
      alert('ඔබගේ Ad එක Admin අනුමැතිය සඳහා යවන ලදී.')
      loadUserDataAndAds()
    }
    setBumpingId(null)
  }

  const handleBumpAd = async (adId: string) => {
    setSelectedAdForSlip(adId)
    setShowSlipModal(true)
  }

  const handleSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slipFile || !selectedAdForSlip) {
      alert('لطفاً حتماً Slip එකේ Image එකක් select කරන්න!')
      return
    }

    try {
      setUploadingSlip(true)
      const fileExt = slipFile.name.split('.').pop()
      const fileName = `slip-${selectedAdForSlip}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, slipFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('ads')
        .update({ 
          payment_slip_url: publicUrl,
          bump_status: 'pending',
          updated_at: new Date()
        })
        .eq('id', selectedAdForSlip)

      if (updateError) throw updateError

      const { error: bumpError } = await supabase
        .from('ad_bumps')
        .insert([
          {
            ad_id: selectedAdForSlip,
            user_id: user?.id,
            payment_method: 'bank_deposit',
            slip_url: publicUrl,
            status: 'pending',
            amount: 500
          }
        ])

      if (bumpError) {
        console.error('Ad bump table insert warning:', bumpError.message)
      }

      alert('Bank Slip එක සහ Bump ඉල්ලීම සාර්ථකව Admin වෙත යවන ලදී!')
      setShowSlipModal(false)
      setSlipFile(null)
      setSelectedAdForSlip(null)
      loadUserDataAndAds()
    } catch (error: any) {
      alert('Upload කිරීමට නොහැකි විය: ' + error.message)
    } finally {
      setUploadingSlip(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading Dashboard...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-2 transition">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              Customer <span className="text-blue-600">Dashboard</span>
            </h1>
            {user && (
              <p className="text-xs text-gray-500 font-medium mt-1">
                Logged in as: <span className="font-bold text-gray-700">{user.email}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={loadUserDataAndAds} className="p-2.5 bg-white border hover:bg-gray-50 text-gray-600 rounded-xl shadow-sm transition" title="Refresh Data">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/stores/create" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs sm:text-sm transition gap-1.5">
              <Store className="w-4 h-4" /> Create Store
            </Link>
            <Link href="/post-ad" className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow text-sm transition">
              <Plus className="w-4 h-4 mr-1.5" /> Post New Ad
            </Link>
          </div>
        </div>

        {/* Banner Ad Request Quick Action Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3.5 rounded-2xl flex-shrink-0">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Promote Your Business with Top Banners</h3>
              <p className="text-xs text-orange-100 mt-0.5">මුල් පිටුවේ කැරුසල් බැනර් දැන්වීමක් පළ කර ඔබේ ව්‍යාපාරය ඉහළටම ගෙන යන්න.</p>
            </div>
          </div>
          <Link
            href="/request-banner"
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-4 h-4" /> Request Banner Ad
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Edit Profile */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 h-fit md:col-span-1">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Profile Details</h2>
                <p className="text-xs text-gray-400">Update personal info & photo</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 bg-gray-100 flex items-center justify-center shadow-inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 border shadow-sm">
                <Camera className="w-3.5 h-3.5" /> Change Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email (Fixed)</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-gray-500 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 rounded-xl focus-within:border-blue-500">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full bg-transparent py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 rounded-xl focus-within:border-blue-500">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dambulla" className="w-full bg-transparent py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={updatingProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm">
                {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </form>
          </div>

          {/* Right Column: Stores, Ads & Saved Ads */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm md:col-span-2 space-y-10">
            
            {/* Your Stores Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" /> Your Stores ({stores.length})
                </h2>
                <Link href="/stores/create" className="text-xs text-blue-600 hover:text-blue-700 font-bold transition flex items-center gap-1">
                  + Create New Store
                </Link>
              </div>

              {stores.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl py-8 px-4 text-center">
                  <div className="w-10 h-10 bg-blue-50 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Store className="w-5 h-5" />
                  </div>
                  <p className="text-gray-500 font-semibold text-xs mb-2">ඔබ තවමත් කිසිදු Store එකක් සාදා නැත.</p>
                  <Link href="/stores/create" className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-3 py-1.5 rounded-lg inline-block transition">
                    + Create Your Store
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div key={store.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded-2xl gap-4 hover:border-gray-300 transition bg-blue-50/20">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border flex items-center justify-center">
                          {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-gray-400" />}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">Store</span>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">{store.name}</h3>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{store.description || 'No description provided.'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">📍 {store.city || 'Location not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        <Link href={`/stores/${store.slug || store.id}`} className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border rounded-xl text-xs font-bold flex items-center transition gap-1" target="_blank">
                          <Eye className="w-3.5 h-3.5" /> Visit
                        </Link>
                        <Link href={`/stores/edit/${store.id}`} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold flex items-center transition gap-1">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button onClick={() => handleDeleteStore(store.id)} disabled={deletingStoreId === store.id} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center transition border border-red-100 disabled:opacity-50" title="Delete Store">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Posted Ads Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Your Posted Ads ({ads.length})</h2>

              {ads.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl py-12 px-4 text-center">
                  <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Tag className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 font-semibold text-sm mb-2">ඔබ තවමත් කිසිදු Ad එකක් පළ කර නැත.</p>
                  <Link href="/post-ad" className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-4 py-2 rounded-lg inline-block transition mt-2">
                    + පළමු Ad එක Post කරන්න
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded-2xl gap-4 hover:border-gray-300 transition">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border flex items-center justify-center">
                          {ad.images && ad.images.length > 0 ? <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">No Image</span>}
                          <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm uppercase">
                            {categoriesMap[ad.category_id] || 'General'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ad.status === 'active' ? 'bg-green-100 text-green-700' : ad.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ad.status === 'active' ? 'Active (Live)' : ad.status === 'pending' ? 'Pending Admin Approval' : 'Deactivated'}
                            </span>
                            {ad.bump_status === 'pending' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                Pending Bump Approval
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">{ad.title}</h3>
                          <p className="text-orange-600 font-black text-sm">LKR {Number(ad.price).toLocaleString()}</p>
                          <p className="text-xs text-gray-400 mt-0.5">📍 {ad.city}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        <button
                          onClick={() => handleBumpAd(ad.id)}
                          disabled={ad.bump_status === 'pending'}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition border border-purple-200 flex items-center gap-1 disabled:opacity-50"
                          title="Request Bump Ad with Slip"
                        >
                          <Zap className="w-3.5 h-3.5" /> 
                          {ad.bump_status === 'pending' ? 'Pending Bump' : 'Request Bump (Slip)'}
                        </button>

                        <Link href={`/ads/${ad.id}`} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center transition" title="View Ad">
                          <Eye className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">View</span>
                        </Link>

                        <Link href={`/edit-ad/${ad.id}`} className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold flex items-center transition border border-blue-100" title="Edit Ad">
                          <Edit className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
                        </Link>

                        {ad.status !== 'active' && (
                          <button onClick={() => handleRequestApproval(ad.id)} disabled={ad.status === 'pending'} className="px-3 py-2 rounded-xl text-xs font-bold transition border bg-green-50 text-green-700 hover:bg-green-100 border-green-200 disabled:opacity-50">
                            {ad.status === 'pending' ? 'Approval Pending' : 'Request to Publish'}
                          </button>
                        )}

                        <button onClick={() => handleDeleteAd(ad.id)} disabled={deletingId === ad.id} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center transition border border-red-100 disabled:opacity-50" title="Delete Ad">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Ads Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Saved Ads / Wishlist ({savedAds.length})
                </h2>
              </div>

              {adsLoading ? (
                <div className="text-center py-6 text-xs text-gray-400">Loading saved ads...</div>
              ) : savedAds.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl py-10 px-4 text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 font-semibold text-sm mb-1">ඔබ තවමත් කිසිදු Ad එකක් Save කර නැත.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedAds.map((ad) => (
                    <div key={ad.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded-2xl gap-4 hover:border-gray-300 transition bg-gray-50/50">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border flex items-center justify-center">
                          {ad.images && ad.images.length > 0 ? <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">No Image</span>}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">{ad.title}</h3>
                          <p className="text-orange-600 font-black text-sm">LKR {Number(ad.price).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        <Link href={`/ads/${ad.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center transition gap-1">
                          <Eye className="w-4 h-4" /> View Ad
                        </Link>
                        <button onClick={() => handleRemoveSavedAd(ad.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center transition border border-red-100" title="Remove from Saved">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Slip Upload Modal Popup */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-gray-900 text-lg">Upload Bank Slip for Bump</h3>
              <button onClick={() => setShowSlipModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSlipSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="slip-file-input"
                />
                <label htmlFor="slip-file-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-xs font-bold text-gray-700">
                    {slipFile ? slipFile.name : 'Click to select payment slip image'}
                  </p>
                  <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingSlip}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  {uploadingSlip ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Submit Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}