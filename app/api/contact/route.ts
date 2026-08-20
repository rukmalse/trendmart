import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Resend API Key එක ඔබේ .env.local එකෙන් ලබා ගනී
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    // ඊමේල් යැවීම (rukmalsenanayake418@gmail.com සහ cursor-click19@gmail.com වෙත)
    const data = await resend.emails.send({
      from: 'Trend Mart Contact <onboarding@resend.dev>', // Resend verified domain එකක් හෝ default එක
      to: ['rukmalsenanayake418@gmail.com'],
      subject: `New Contact Message from ${name} - Trend Mart`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #f97316;">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f3f4f6; padding: 10px; border-radius: 5px;">${message}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}