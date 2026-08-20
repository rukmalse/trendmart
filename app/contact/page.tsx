'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        setError(true)
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8 text-sm">Have questions or need support? Reach out to our team.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Contact Details */}
        <div className="space-y-6 bg-gray-50 p-8 rounded-2xl border">
          <h2 className="text-xl font-bold text-gray-900">Get in Touch</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
              <span>Kandy, Sri Lanka</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-orange-500 shrink-0" />
              <span>+94 76 066 1264</span> {/* ඔබගේ සැබෑ දුරකථන අංකය මෙහි යොදන්න */}
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-orange-500 shrink-0" />
              <span>cursorclick19@gmail.com</span>
            </div>
          </div>

          <div className="pt-4 border-t text-xs text-gray-500">
            <p className="font-semibold text-gray-700">Cursor-Click IT Solutions (Pvt) Ltd</p>
            <p>Providing technical and digital infrastructure support.</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-2xl border shadow-sm">
          {submitted ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-semibold text-sm">
              Thank you! Your message has been sent successfully. We will get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">
                  Something went wrong. Please try again later.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name</label>
                <input name="name" required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input name="email" required type="email" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
                <textarea name="message" required rows={4} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="How can we help you?"></textarea>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}