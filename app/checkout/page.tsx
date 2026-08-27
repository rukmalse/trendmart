'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CreditCard, Building2, Phone, ShieldCheck, AlertCircle } from 'lucide-react'

export default function UserPaymentPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [gatewayAllowed, setGatewayAllowed] = useState(false)
  const [bankDepositAllowed, setBankDepositAllowed] = useState(true)
  const [contactNumber, setContactNumber] = useState('')
  const [bgImage, setBgImage] = useState('')
  const [siteName, setSiteName] = useState('Trend Mart')
  const [selectedMethod, setSelectedMethod] = useState<string>('')

  // ඩේටාබේස් එකෙන් ඇඩ්මින් සෙටින්ග්ස් ලබා ගැනීම
  useEffect(() => {
    async function fetchUserSettings() {
      setLoading(true)
      const { data } = await supabase
        .from('settings')
        .select('gateway_enabled, bank_deposit_enabled, contact_number, home_bg_url, site_name')
        .eq('id', 1)
        .single()

      if (data) {
        setGatewayAllowed(data.gateway_enabled ?? false)
        setBankDepositAllowed(data.bank_deposit_enabled ?? true)
        setContactNumber(data.contact_number || '')
        setBgImage(data.home_bg_url || '')
        setSiteName(data.site_name || 'Trend Mart')

        if (data.gateway_enabled) {
          setSelectedMethod('gateway')
        } else if (data.bank_deposit_enabled) {
          setSelectedMethod('bank_deposit')
        }
      }
      setLoading(false)
    }

    fetchUserSettings()
  }, [])

  // Proceed බටන් එක ක්ලික් කළ විට අදාළ පිටුවට යැවීම
  const handleProceed = () => {
    if (selectedMethod === 'gateway') {
      // Online Payment Gateway පිටුවට යැවීම
      router.push('/checkout/gateway')
    } 
    else if (selectedMethod === 'bank_deposit') {
      // Bank Deposit / Slip Upload පිටුවට යැවීම
      router.push('/checkout/bank-deposit')
    } else {
      alert('කරුණාකර ගෙවීම් ක්‍රමයක් තෝරන්න.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-600">
        Loading payment options...
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex flex-col justify-between py-10 px-4"
      style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundColor: bgImage ? 'transparent' : '#f9fafb' }}
    >
      <div className="max-w-2xl mx-auto w-full bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-gray-200 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-gray-900">{siteName} - Checkout</h1>
          <p className="text-sm text-gray-500">කරුණාකර ඔබගේ පහසු ගෙවීම් ක්‍රමය තෝරාගන්න.</p>
        </div>

        {/* Payment Methods Selection Box */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" /> ගෙවීම් ක්‍රම (Payment Methods)
          </h2>

          <div className="space-y-3">
            {/* 1. Online Payment Gateway */}
            {gatewayAllowed && (
              <label 
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  selectedMethod === 'gateway' ? 'border-orange-600 bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Online Payment Gateway</h3>
                    <p className="text-xs text-gray-500">Debit / Credit කාඩ්පතක් මඟින් ක්ෂණිකව ගෙවන්න.</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="gateway" 
                  checked={selectedMethod === 'gateway'}
                  onChange={() => setSelectedMethod('gateway')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
              </label>
            )}

            {/* 2. Bank Deposit Option */}
            {bankDepositAllowed && (
              <label 
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  selectedMethod === 'bank_deposit' ? 'border-orange-600 bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Bank Deposit (බැංකු තැන්පතුව)</h3>
                    <p className="text-xs text-gray-500">බැංකුවට මුදල් තැන්පත් කර ස්ලිප් පත (Slip) අප වෙත එවන්න.</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="bank_deposit" 
                  checked={selectedMethod === 'bank_deposit'}
                  onChange={() => setSelectedMethod('bank_deposit')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
              </label>
            )}

            {/* කිසිදු ක්‍රමයක් සක්‍රීය කර නැති නම් */}
            {!gatewayAllowed && !bankDepositAllowed && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h3 className="font-bold text-red-800 text-sm">ගෙවීම් තාවකාලිකව අත්හිටුවා ඇත</h3>
                <p className="text-xs text-red-600">මේ මොහොතේ ඔන්ලයින් ගෙවීම් හෝ බැංකු තැන්පතු ක්‍රම සක්‍රීය කර නැත.</p>
              </div>
            )}
          </div>
        </div>

        {/* Proceed Button */}
        {(gatewayAllowed || bankDepositAllowed) && (
          <button
            onClick={handleProceed}
            disabled={!selectedMethod}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 text-sm"
          >
            ගෙවීම තහවුරු කරන්න (Proceed)
          </button>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-700 bg-white/80 backdrop-blur-sm py-4 rounded-2xl max-w-2xl mx-auto w-full border border-gray-200 shadow-sm flex items-center justify-center gap-2">
        <Phone className="w-4 h-4 text-orange-600" />
        <span>විමසීම් සඳහා: <strong className="text-gray-900">{contactNumber || 'ඇතුළත් කර නැත'}</strong> | © {new Date().getFullYear()} {siteName}</span>
      </footer>
    </div>
  )
}