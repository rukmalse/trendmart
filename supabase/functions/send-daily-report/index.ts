import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async () => {
  // Environment variables inside the handler
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  // ඊමේල් ලිපිනයන් දෙකටම යැවීමට List එකක් ලෙස සකස් කර ඇත
  const ADMIN_EMAILS = ['rukmalsenanayake418@gmail.com'] 

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Fetch Yesterday's Stats
  const yesterday = new Date(Date.now() - 86400000).toISOString()

  const { count: newAds } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday)

  const { count: pendingAds } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday)

  // 2. Email HTML Body
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ea580c;">TrendMart - Daily Summary Report</h2>
      <p>Here is the overview for the last 24 hours:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background: #f3f4f6;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Metric</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Count</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">New Ads Posted</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><b>${newAds || 0}</b></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Pending Approvals</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #d97706;"><b>${pendingAds || 0}</b></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">New Users Joined</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><b>${newUsers || 0}</b></td>
        </tr>
      </table>
      <br/>
      <a href="https://trendmart.lk/admin/reports" style="background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Open Admin Dashboard</a>
    </div>
  `

  // 3. Send via Resend API
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'TrendMart Reports <onboarding@resend.dev>',
      to: ADMIN_EMAILS,
      subject: `📊 TrendMart Daily Report - ${new Date().toLocaleDateString()}`,
      html: htmlBody,
    }),
  })

  const data = await res.json()

  console.log('Resend Response:', data)

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
  })
})