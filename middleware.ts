import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/bills',
  '/vehicles',
  '/tasks',
  '/shopping',
  '/settings',
  '/onboarding',
]

const PUBLIC_ONLY_PATHS = ['/login']

const ALWAYS_ALLOWED = ['/auth/callback', '/invite']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - this must be called before any auth checks
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Allow auth callback and invite paths unconditionally
  const isAlwaysAllowed = ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))
  if (isAlwaysAllowed) {
    return supabaseResponse
  }

  // Redirect authenticated users away from login
  const isPublicOnly = PUBLIC_ONLY_PATHS.some((p) => pathname.startsWith(p))
  if (user && isPublicOnly) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect unauthenticated users away from protected paths
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
