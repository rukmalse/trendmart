import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const path = request.nextUrl.pathname

  // Super-admin හෝ admin පාරවල් වලට යනවා නම් පමණක් පරීක්ෂා කරන්න
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
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      // 1. User කෙනෙක් log වී ඇත්දැයි බැලීම
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // 2. Database එකෙන් නියමිත role එක ලබාගැනීම
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Profile එක නැතත් හෝ error එකක් ආවත් සැකයට home page එකට යවන්න
      if (profileError || !profile) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      const role = profile.role

      // 3. /super-admin සඳහා දැඩි පාලනයක්
      if (path.startsWith('/super-admin')) {
        if (role !== 'super-admin') {
          // සාමාන්‍ය user කෙනෙක් නම් හෝ වෙනත් කෙනෙක් නම් කෙලින්ම Home page එකට හරවන්න
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      // 4. /admin සඳහා පාලනය
      if (path.startsWith('/admin')) {
        if (role !== 'admin' && role !== 'super-admin') {
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