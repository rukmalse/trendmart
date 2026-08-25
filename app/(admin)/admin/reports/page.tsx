'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
} from 'recharts'
import { TrendingUp, Users, Package, AlertCircle, RefreshCw, Printer, Send } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [sendingReport, setSendingReport] = useState(false)
  const [stats, setStats] = useState({
    totalAds: 0,
    pendingAds: 0,
    totalUsers: 0,
    todayAds: 0,
    todayUsers: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])

  const fetchReportData = async () => {
    setLoading(true)

    // 1. Fetch Summary Totals
    const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true })
    const { count: pendingAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    // 2. Fetch Today's Counts
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayIso = startOfToday.toISOString()

    const { count: todayAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).gte('created_at', todayIso)
    const { count: todayUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso)

    setStats({
      totalAds: totalAds || 0,
      pendingAds: pendingAds || 0,
      totalUsers: totalUsers || 0,
      todayAds: todayAds || 0,
      todayUsers: todayUsers || 0,
    })

    // 3. Fetch Last 7 Days Data for Charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isoStart: new Date(d.setHours(0, 0, 0, 0)).toISOString(),
        isoEnd: new Date(d.setHours(23, 59, 59, 999)).toISOString(),
      }
    })

    const chartDataPromises = last7Days.map(async (day) => {
      const { count: adsCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', day.isoStart)
        .lte('created_at', day.isoEnd)

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', day.isoStart)
        .lte('created_at', day.isoEnd)

      return {
        date: day.dateStr,
        Ads: adsCount || 0,
        Users: usersCount || 0,
      }
    })

    const resolvedChartData = await Promise.all(chartDataPromises)
    setChartData(resolvedChartData)
    setLoading(false)
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  // Next.js API Route එක හරහා Report එක යැවීම
  const handleSendReport = async () => {
    setSendingReport(true)
    try {
      const response = await fetch('/api/send-daily-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send report')
      }

      alert('Daily report generated and processed successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to send daily report. Please check console.')
    } finally {
      setSendingReport(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time insights and activity metrics for TrendMart platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Send Daily Report Button */}
          <button
            onClick={handleSendReport}
            disabled={sendingReport}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${sendingReport ? 'animate-bounce' : ''}`} />
            {sendingReport ? 'Sending...' : 'Send Daily Report'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's New Ads */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today's New Ads</p>
            <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stats.todayAds}</h3>
            <p className="text-xs text-gray-500 mt-1">Total Ads: {stats.totalAds}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Approvals</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingAds}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Requires review</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Today's New Users */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today's New Users</p>
            <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stats.todayUsers}</h3>
            <p className="text-xs text-gray-500 mt-1">Total Users: {stats.totalUsers}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Platform Status */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Platform Health</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">Active</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">All services online</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ads Trend Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">Ads Posted (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="Ads" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">New User Registrations (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Line type="monotone" dataKey="Users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}