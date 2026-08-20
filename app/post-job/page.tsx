'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, ArrowLeft, UserCheck, Navigation, MapPin } from 'lucide-react'

export default function PostJobPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Listing Type State
  const [listingType, setListingType] = useState<'vacancy' | 'worker_profile'>('vacancy')

  // Form States
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [salaryType, setSalaryType] = useState('Per Month')
  const [salaryAmount, setSalaryAmount] = useState('')
  const [district, setDistrict] = useState('Colombo')
  const [city, setCity] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  
  // GPS Location States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<string>('')

  const categories = [
    'Electrician & Electrical',
    'Plumber & Piping',
    'Driver & Transport',
    'Housekeeper & Maid',
    'Construction & Masonry',
    'Carpenter & Woodwork',
    'AC & Appliance Repair',
    'Chef & Kitchen Staff',
    'Office & Administrative',
    'Sales & Marketing',
    'IT & Technical',
    'Security Guard',
    'Other Skilled / Unskilled'
  ]

  // Get Live GPS Location Function
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('ඔබගේ Browser එක මඟින් Geolocation සපයන්නේ නැත.')
      return
    }

    setGettingLocation(true)
    setLocationStatus('GPS තොරතුරු ලබා ගනිමින් පවතී...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setGettingLocation(false)
        setLocationStatus('📍 Live Location සාර්ථකව ලබා ගන්නා ලදී!')
      },
      (error) => {
        setGettingLocation(false)
        setLocationStatus('Location ලබා ගැනීමට නොහැකි විය. කරුණාකර GPS Allow කරන්න.')
        console.error('Error getting location:', error)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      alert('කරුණාකර Job Listing එකක් පළ කිරීමට ප්‍රථම Log in වන්න!')
      setLoading(false)
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('jobs')
      .insert([
        {
          user_id: user.id,
          listing_type: listingType,
          title,
          category,
          job_type: jobType,
          salary_type: salaryType,
          salary_amount: salaryAmount ? parseFloat(salaryAmount) : null,
          district,
          city,
          contact_phone: contactPhone,
          description,
          requirements,
          latitude,
          longitude,
          status: 'active'
        }
      ])

    setLoading(false)

    if (error) {
      alert('Error creating listing: ' + error.message)
    } else {
      alert(
        listingType === 'vacancy' 
          ? 'ඔබගේ Job Vacancy එක සාර්ථකව පළ කරන ලදී!' 
          : 'ඔබගේ Worker Profile එක සාර්ථකව පළ කරන ලදී!'
      )
      router.push('/jobs')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm">
        
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center">
          <Briefcase className="w-7 h-7 text-blue-600 mr-2" /> Post Job / Service Profile
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          රැකියාවක් ලබාදීමට හෝ ඔබේ Manpower/Skilled Service එක ලියාපදිංචි කිරීමට පහත තොරතුරු පුරවන්න.
        </p>

        {/* Listing Type Switcher */}
        <div className="grid grid-cols-2 gap-3 mb-8 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setListingType('vacancy')}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition ${
              listingType === 'vacancy'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Briefcase className="w-4 h-4 mr-2" /> I Want to Hire (Job Vacancy)
          </button>

          <button
            type="button"
            onClick={() => setListingType('worker_profile')}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition ${
              listingType === 'worker_profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" /> I Want Work (Worker Profile)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {listingType === 'vacancy' ? 'Job Title / Role' : 'Your Skilled Service / Designation'}
            </label>
            <input
              type="text"
              required
              placeholder={
                listingType === 'vacancy' 
                  ? 'e.g. Urgent Need: Skilled Electrician' 
                  : 'e.g. Professional Plumber with 5 Years Experience'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Category & Job Type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Daily Wage">Daily Wage</option>
                <option value="Contract">Contract / Project Basis</option>
              </select>
            </div>
          </div>

          {/* Salary Type & Amount */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Basis</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="Per Month">Per Month</option>
                <option value="Per Day">Per Day</option>
                <option value="Per Hour">Per Hour</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (LKR - Optional)</label>
              <input
                type="number"
                placeholder="e.g. 65000 or 3500"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
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
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kandy">Kandy</option>
                <option value="Kurunegala">Kurunegala</option>
                <option value="Galle">Galle</option>
                <option value="Matara">Matara</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City / Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Nugegoda / Maharagama"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* 📍 GPS Location Section (Near Me Feature) */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-blue-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-blue-600" /> GPS Location Pin (Near Me Feature)
                </h4>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  ඔබ ඉන්න තැන ළඟම ඉන්න අය සොයාගැනීමට GPS Pin එක එකතු කරන්න.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center transition shadow-sm disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                {gettingLocation ? 'Locating...' : 'Detect GPS'}
              </button>
            </div>

            {locationStatus && (
              <p className="text-xs font-bold text-blue-800 mt-2 bg-white/60 p-2 rounded-lg">
                {locationStatus}
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone Number</label>
            <input
              type="tel"
              required
              placeholder="0771234567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description / Experience Details</label>
            <textarea
              rows={4}
              required
              placeholder="Describe skills or job responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 text-sm"
          >
            {loading ? 'Publishing Listing...' : 'Publish Job / Worker Listing'}
          </button>
        </form>
      </div>
    </main>
  )
}