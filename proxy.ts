import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      const role = profile.role

      // මෙහිදී admin හෝ super_admin හෝ admin ලෙස කුමන එක තිබුණත් ඇතුළු වීමට ඉඩ සලසයි
      if (path.startsWith('/super_admin')) {
        if (role !== 'admin' && role !== 'super_admin' && role !== 'super-admin') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      if (path.startsWith('/admin')) {
        if (role !== 'admin' && role !== 'super_admin' && role !== 'super-admin') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

    } catch (error) {
      console.error('Proxy Authorization Error:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*'],
}