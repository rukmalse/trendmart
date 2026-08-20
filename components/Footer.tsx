'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Phone, MapPin, ShieldCheck, FileText, HelpCircle } from 'lucide-react'

export default function Footer() {
  const supabase = createClient()
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Trend Mart',
    primary_color: '#f97316',
    contact_number: '+94 XX XXX XXXX'
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setSiteSettings({
          site_name: data.site_name || 'Trend Mart',
          primary_color: data.primary_color || '#f97316',
          contact_number: data.contact_number || '+94 XX XXX XXXX'
        })
      }
    }
    fetchSettings()
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: About / Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight">
              {siteSettings.site_name}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sri Lanka's Premier Hybrid Classifieds & GPS Directory. Buy, sell, or find trusted services near you effortlessly.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-white transition">Manpower & Jobs</Link>
              </li>
              <li>
                <Link href="/post-ad" className="hover:text-white transition">Post Classified Ad</Link>
              </li>
              <li>
                <Link href="/post-job" className="hover:text-white transition">Post a Job</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal & Policy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="flex items-center gap-1.5 hover:text-white transition">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="flex items-center gap-1.5 hover:text-white transition">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="flex items-center gap-1.5 hover:text-white transition">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: siteSettings.primary_color }} />
                <span>Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: siteSettings.primary_color }} />
                <span>{siteSettings.contact_number}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: siteSettings.primary_color }} />
                <span>support@trendmart.lk</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} {siteSettings.site_name}. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium text-gray-400">
            Powered by <span className="text-white font-bold">Cursor-Click IT Solutions (Pvt) Ltd</span>
          </p>
        </div>

      </div>
    </footer>
  )
}