'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

function AuthForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get('tab')
  const [mode, setMode] = useState<'login' | 'signup'>(tabParam === 'signup' ? 'signup' : 'login')

  useEffect(() => {
    if (tabParam === 'signup' || tabParam === 'login') {
      setMode(tabParam)
    }
  }, [tabParam])

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.refresh()
        router.push('/')
      }
    } else {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
          updated_at: new Date(),
        })
      }

      setMessage('Registration successful! Please login to your account.')
      setMode('login') 
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        
        <div className="text-center mb-6">
          <Link href="/" className="font-black text-2xl tracking-tight text-gray-900">
            TREND<span className="text-orange-500">MART</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login' ? 'Welcome back! Please enter your details.' : 'Create an account to start posting ads.'}
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'login' 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup' 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kasun Perera"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-950 font-semibold border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0771234567"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-950 font-semibold border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-950 font-semibold border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.S ? e.target.value : e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-950 font-semibold border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-gray-400">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-orange-500 font-bold hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-orange-500 font-bold hover:underline">Login</button></>
            )}
          </p>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>}>
      <AuthForm />
    </Suspense>
  )
}