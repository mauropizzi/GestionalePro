import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = "https://mlkahaedxpwkhheqwsjc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTksImV4cCI6MjA3Njg1NDI1OX0._QR-tTUw-NPhjCv9boDDQAsewgyDzMhwiXNIlxIBCjQ";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Add caching headers for better performance
  if (req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate')
  } else if (req.nextUrl.pathname.startsWith('/public/')) {
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate')
  } else {
    res.headers.set('Cache-Control', 'no-store, must-revalidate')
  }

  // Create Supabase client for session handling
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname === '/login'
  const isPublicPage = req.nextUrl.pathname.startsWith('/public/')

  // Redirect logic is handled in the component, but we can do basic checks here
  // to prevent unnecessary redirects and improve performance

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}