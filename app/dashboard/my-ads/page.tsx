'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, Edit, PlusCircle, Briefcase, Users, AlertCircle, MapPin, Calendar, Eye, ArrowUpCircle, X, Upload, CheckCircle2, Loader2, CreditCard } from 'lucide-react'

export default function MyAdsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  // Bump Modal States
  const [isBumpModalOpen, setIsBumpModalOpen] = useState(false)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submittingBump, setSubmittingBump] = useState(false)
  
  // ස්ථිර බැංකු ගිණුම් විස්තර (මෙතැනට ඔබේ නියම බැංකු විස්තර දාගන්න)
  const bankDetails = {
    bankName: 'Bank of Ceylon',
    accountNo: '1234567890',
    accountName: 'TrendMart IT Solutions',
    branch: 'Dambulla'
  }

  // 1. යූසර් සහ වගු වලින් දැන්වීම් ලබා ගැනීම
  useEffect(() => {
    async function fetchUserAds() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      setUser(user)

      // A. Fetch from service_providers table
      const { data: serviceData } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (serviceData) setServices(serviceData)

      // B. Fetch from jobs table
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (jobData) setJobs(jobData)

      setLoading(false)
    }

    fetchUserAds()
  }, [supabase])

  // Delete Service Ad
  const handleDeleteService = async (id: string) => {
    if (!confirm('මෙම සේවා දැන්වීම මකා දැමීමට අවශ්‍ය බව විශ්වාස ද?')) return

    const { error } = await supabase
      .from('service_providers')
      .delete()
      .eq('id', id)

    if (error) {
      alert('දෝෂයක් සිදු විය: ' + error.message)
    } else {
      setServices(services.filter(item => item.id !== id))
    }
  }

  // Delete Job Ad
  const handleDeleteJob = async (id: string) => {
    if (!confirm('මෙම දැන්වීම මකා දැමීමට අවශ්‍ය බව විශ්වාස ද?')) return

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      alert('දෝෂයක් සිදු විය: ' + error.message)
    } else {
      setJobs(jobs.filter(item => item.id !== id))
    }
  }

  // Open Bump Modal
  const openBumpModal = (id: string, tableName: string) => {
    setSelectedAdId(id)
    setSelectedTable(tableName)
    setFile(null)
    setPreview(null)
    setIsBumpModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  // Handle Submit Bump Slip
  const handleBumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedAdId || !selectedTable) {
      alert('කරුණාකර බැංකු ගෙවීම් රිසිට්පත (Slip) තෝරන්න.')
      return
    }

    setSubmittingBump(true)

    // 1. Upload Slip to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `bump_${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(fileName, file)

    if (uploadError) {
      alert('Slip upload failed: ' + uploadError.message)
      setSubmittingBump(false)
      return
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('payment-slips')
      .getPublicUrl(fileName)

    const slipUrl = publicUrlData.publicUrl

    // 2. Insert record into ad_bumps table
    const { error: dbError } = await supabase.from('ad_bumps').insert({
      ad_id: selectedAdId,
      slip_url: slipUrl,
      amount: 500,
      payment_method: 'Bank Transfer',
      status: 'pending'
    })

    if (dbError) {
      alert('Database error: ' + dbError.message)
      setSubmittingBump(false)
      return
    }

    // 3. Update specific table bump_status to 'pending'
    const { error: updateError } = await supabase
      .from(selectedTable)
      .update({ bump_status: 'pending' })
      .eq('id', selectedAdId)

    if (updateError) {
      alert('Bump status update error: ' + updateError.message)
      setSubmittingBump(false)
      return
    }

    alert('Bump ඉල්ලීම සහ ගෙවීම් රිසිට්පත සාර්ථකව යොමු කරන ලදී!')
    setSubmittingBump(false)
    setIsBumpModalOpen(false)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-2" />
        <h2 className="text-xl font-bold text-gray-800">කරුණාකර පළමුව Login වන්න.</h2>
        <Link href="/login" className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
          Login වන්න
        </Link>
      </div>
    )
  }

  const totalAdsCount = services.length + jobs.length

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Create Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Your Posted Ads ({totalAdsCount})</h1>
            <p className="text-sm text-gray-500">ඔබ විසින් Trend Mart හි පල කරන ලද දැන්වීම් මෙතැනින් කළමනාකරණය කරන්න.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/post-job" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Post Service
            </Link>
            <Link 
              href="/jobs" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Post Job / Manpower
            </Link>
          </div>
        </div>

        {/* 1. Services Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xl px-2">
            <Briefcase className="w-5 h-5 text-orange-500" /> Services ({services.length})
          </div>

          {services.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-sm text-gray-400">
              ඔබ තවම සේවා දැන්වීම් කිසිවක් පළ කර නැත.
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((ad) => (
                <div key={ad.id} className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-200 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Active (Live)
                      </div>
                      {ad.bump_status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          Bump Pending Verification
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-lg">{ad.business_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" /> {ad.address || 'Sri Lanka'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(ad.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0">
                    <button
                      onClick={() => openBumpModal(ad.id, 'service_providers')}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-orange-200"
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Request Bump (Slip)
                    </button>
                    <Link 
                      href={`/services/${ad.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-600" /> View
                    </Link>
                    <Link 
                      href={`/services/edit/${ad.id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-blue-200"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteService(ad.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition border border-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Jobs / Manpower Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xl px-2">
            <Users className="w-5 h-5 text-blue-600" /> Jobs & Manpower ({jobs.length})
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-sm text-gray-400">
              ඔබ තවම ජොබ් හෝ මෑන්පවර් දැන්වීම් කිසිවක් පළ කර නැත.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-200 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Active (Live)
                      </div>
                      {job.bump_status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          Bump Pending Verification
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-lg">{job.title || job.job_title || 'Job Ad'}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> {job.location || job.address || 'Sri Lanka'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(job.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0">
                    <button
                      onClick={() => openBumpModal(job.id, 'jobs')}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-orange-200"
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Request Bump (Slip)
                    </button>
                    <Link 
                      href={`/jobs/${job.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-600" /> View
                    </Link>
                    <Link 
                      href={`/jobs/edit/${job.id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-blue-200"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition border border-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* BUMP UP POPUP MODAL */}
      {isBumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsBumpModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 pr-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpCircle className="w-6 h-6 text-orange-500" />
                <span>Upload Bank Slip for Bump</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">ඔබගේ දැන්වීම මුල් පිටුවට ඉහළට ගෙන ඒම සඳහා Rs. 500/= ගෙවා බැංකු රිසිට්පත (Slip) පහතින් Upload කරන්න.</p>
            </div>

            {/* Bank Details Box - ස්ථිරව දිස්වේ */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs text-blue-950 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>ගෙවීම් කළ යුතු බැංකු ගිණුම් විස්තර</span>
              </div>

              <div className="space-y-1 font-medium text-gray-700 leading-relaxed">
                <p>ගිණුමේ නම: <span className="font-bold text-gray-900">{bankDetails.accountName}</span></p>
                <p>ගිණුම් අංකය: <span className="font-bold text-gray-900 select-all bg-white px-1.5 py-0.5 rounded border border-blue-100">{bankDetails.accountNo}</span></p>
                <p>බැංකුව සහ ශාඛාව: <span className="font-bold text-gray-900">{bankDetails.bankName}, {bankDetails.branch}</span></p>
              </div>

              <div className="pt-2 border-t border-blue-200/80 font-bold text-blue-900 text-sm flex justify-between items-center">
                <span>ගාස්තුව:</span>
                <span className="text-orange-600 font-extrabold text-base">Rs. 500.00</span>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleBumpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Upload Bank Slip</label>
                <label className="border-2 border-dashed border-gray-300 hover:border-orange-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-orange-50/50 transition">
                  {preview ? (
                    <div className="text-center space-y-2">
                      <img src={preview} alt="Slip preview" className="max-h-36 mx-auto rounded-xl shadow border" />
                      <p className="text-xs text-orange-600 font-semibold">වෙනස් කිරීමට නැවත ක්ලික් කරන්න</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="w-8 h-8 text-orange-500 mx-auto animate-bounce" />
                      <p className="text-xs font-semibold text-gray-700">Click to select payment slip image</p>
                      <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBumpModalOpen(false)}
                  className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBump}
                  className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  {submittingBump ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Submit Slip</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  )
}