import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase URL සහ Key ලබා ගැනීම
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// සේවා කටයුතු සඳහා Service Role Key වඩාත් සුදුසු වේ (එය නොමැති නම් Anon Key භාවිතා වේ)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// සේවාදායක පැත්තේ (Server-side) ක්‍රියාත්මක වීමට Supabase Client එක සෑදීම
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // 1. අවශ්‍ය සංඛ්‍යාලේඛන (Stats) ඩේටා ලබා ගැනීම
    const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true })
    const { count: pendingAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayIso = startOfToday.toISOString()

    const { count: todayAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).gte('created_at', todayIso)
    const { count: todayUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso)

    // 2. මෙහිදී ඔබට Resend හෝ Nodemailer වැනි සේවාවක් භාවිතයෙන් ඊමේල් එකක් යැවීමේ කේතය ලිවිය හැක.
    // දැනට ඩේටා සාර්ථකව ලැබුණු බවට රෙස්පොන්ස් එකක් යවනු ලැබේ:

    console.log("Daily Report Data Generated:", { totalAds, pendingAds, totalUsers, todayAds, todayUsers })

    return NextResponse.json({ 
      success: true, 
      message: 'Daily report processed successfully!',
      data: { totalAds, pendingAds, totalUsers, todayAds, todayUsers }
    })

  } catch (error: any) {
    console.error('Error generating daily report:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}