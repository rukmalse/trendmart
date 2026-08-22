import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // 1. අවශ්‍ය සංඛ්‍යාලේඛන (Stats) ඩේටා ලබා ගැනීම
    const { count: newAds } = await supabase.from('ads').select('*', { count: 'exact', head: true })
    const { count: pendingAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    const ADMIN_EMAIL = 'rukmalsenanayake418@gmail.com'
    const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

    // 2. Email HTML Body එක සකස් කිරීම
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ea580c;">TrendMart - Daily Summary Report</h2>
        <p>Here is the overview report requested from Admin Dashboard:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Metric</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Count</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Total Ads</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><b>${newAds || 0}</b></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Pending Approvals</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #d97706;"><b>${pendingAds || 0}</b></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Total Users</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><b>${newUsers || 0}</b></td>
          </tr>
        </table>
        <br/>
        <a href="https://trendmart.lk/admin/reports" style="background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Open Admin Dashboard</a>
      </div>
    `

    // 3. Resend API එක හරහා ඊමේල් එක යැවීම
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TrendMart Reports <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `📊 TrendMart Daily Report - ${new Date().toLocaleDateString()}`,
        html: htmlBody,
      }),
    })

    const resendData = await res.json()

    if (!res.ok) {
      throw new Error(resendData.message || 'Failed to send email via Resend')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Daily report sent successfully via email!',
      data: resendData
    })

  } catch (error: any) {
    console.error('Error generating daily report:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}