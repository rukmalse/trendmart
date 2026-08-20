import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ⚠️ export function middleware වෙනුවට export function proxy ලෙස වෙනස් කරන්න:
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Admin/Super-Admin Paths සීමා කිරීම
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/super-admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role

      if (request.nextUrl.pathname.startsWith('/admin') && !(role === 'admin' || role === 'super_admin')) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (request.nextUrl.pathname.startsWith('/super-admin') && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  } catch (error) {
    console.error('Proxy Error:', error)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*'],
}