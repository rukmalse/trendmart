'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, Edit, PlusCircle, Briefcase, Users, AlertCircle, MapPin, Calendar, Eye } from 'lucide-react'

export default function MyAdsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  // 1. යූසර් සහ වගු දෙකෙන්ම දැන්වීම් ලබා ගැනීම සහ Debugging Logs
  useEffect(() => {
    async function fetchUserAds() {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log("--- DEBUG INFO ---")
      console.log("Auth User:", user)
      console.log("Auth Error:", userError)

      if (!user) {
        console.log("No user found, stopping fetch.")
        setLoading(false)
        return
      }
      setUser(user)

      // A. Fetch from service_providers table
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log("Service Providers Data:", serviceData)
      console.log("Service Providers Error:", serviceError)
      if (serviceData) setServices(serviceData)

      // B. Fetch from jobs table (manpower / jobs)
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log("Jobs Data:", jobData)
      console.log("Jobs Error:", jobError)
      if (jobData) setJobs(jobData)

      setLoading(false)
    }

    fetchUserAds()
  }, [supabase])

  // 2. Service Ad එකක් මකා දැමීම (Delete)
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

  // 3. Job/Manpower Ad එකක් මකා දැමීම (Delete)
  const handleDeleteJob = async (id: string) => {
    if (!confirm('මෙම ජොබ්/මෑන්පවර් දැන්වීම මකා දැමීමට අවශ්‍ය බව විශ්වාස ද?')) return

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
            <p className="text-sm text-gray-500">ඔබ විසින් Trend Mart හි පල කරන ලද Service සහ Manpower/Jobs දැන්වීම් මෙතැනින් කළමනාකරණය කරන්න.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/services/create" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Post Service
            </Link>
            <Link 
              href="/jobs/create" 
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
                  
                  {/* Left: Info */}
                  <div className="space-y-1.5">
                    <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Active (Live)
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

                  {/* Right: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0">
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
              ඔබ තවම මෑන්පවර් හෝ ජොබ් දැන්වීම් කිසිවක් පළ කර නැත.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-200 transition">
                  
                  {/* Left: Info */}
                  <div className="space-y-1.5">
                    <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Active (Live)
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

                  {/* Right: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0">
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
    </main>
  )
}