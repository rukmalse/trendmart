'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, Lock } from 'lucide-react'

export default function GatewayPaymentPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('6999') // උදාහරණ මුදලක් (අවශ්‍ය පරිදි ඩේටාබේස් එකෙන් හෝ Cart එකෙන් ලබාගත හැක)
  const [siteName, setSiteName] = useState('Trend Mart')

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('site_name')
        .eq('id', 1)
        .single()

      if (data) {
        setSiteName(data.site_name || 'Trend Mart')
      }
    }
    fetchSettings()
  }, [])

  // ගෙවීම් ක්‍රියාවලිය ආරම්භ කිරීම (Payment Gateway API Integration)
  const handlePayment = async () => {
    setLoading(true)
    try {
      // මෙතැනට PayHere / Stripe වැනි Payment Gateway එකේ API Request හෝ Redirect කෝඩ් එක ලියන්න හැක.
      // උදාහරණයක් ලෙස PayHere Checkout වෙත යැවීම:
      
      setTimeout(() => {
        alert('Connecting securely to Payment Gateway...')
        // ගෙවීම සාර්ථක වූ පසු යැවෙන URL එකකට යොමු කළ හැක
        // router.push('/checkout/success')
        setLoading(false)
      }, 1500)

    } catch (error: any) {
      alert('ගෙවීමේ දෝෂයක් මතු විය: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-10 px-4">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> ආපසු යන්න (Back)
        </button>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-gray-900">Online Payment</h1>
            <p className="text-xs text-gray-500">{siteName} හරහා ආරක්ෂිතව කාඩ්පතින් ගෙවීම සිදු කරන්න.</p>
          </div>

          {/* Amount Box */}
          <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 text-center space-y-1">
            <span className="text-xs text-gray-500 font-bold">ගෙවිය යුතු මුළු මුදල (Total Amount)</span>
            <div className="text-2xl font-black text-orange-600">LKR {amount}</div>
          </div>

          {/* Secure Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5 text-green-600" />
            <span>256-Bit SSL Secured & Encrypted Payment</span>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'සම්බන්ධ වෙමින් පවතී...' : `ගෙවන්න (Pay LKR ${amount})`}
          </button>

        </div>
      </div>
    </div>
  )
}