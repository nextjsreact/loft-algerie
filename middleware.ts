import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Log incoming cookies (development only)
  if (process.env.NODE_ENV === 'development') {
    const cookies = request.cookies.getAll();
    console.log("Middleware: Incoming cookies:", cookies.map(c => c.name));
    
    // Check for cookie size issues
    const totalCookieSize = cookies.reduce((total, cookie) => 
      total + cookie.name.length + (cookie.value?.length || 0), 0
    );
    
    if (totalCookieSize > 4000) { // Warn if approaching limit
      console.warn(`⚠️ Large cookie size detected: ${totalCookieSize} bytes`);
      console.warn('🧹 Clear cookies: Open scripts/clear-cookies.html in browser');
      console.warn('🔄 Or use private browsing: Ctrl+Shift+N');
    }
    
    // Auto-cleanup old Supabase cookies in development
    if (totalCookieSize > 6000) { // Critical size
      console.error('🚨 CRITICAL: Cookie size too large! This may cause 431 errors');
      console.error('🛠️ SOLUTION: Clear all cookies immediately');
      console.error('📁 Use: scripts/clear-cookies.html');
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; expires?: Date; sameSite?: boolean | "lax" | "strict" | "none" }) {
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, options: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; expires?: Date; sameSite?: boolean | "lax" | "strict" | "none" }) {
          supabaseResponse.cookies.set(name, '', options)
        },
      },
    }
  )

  // Refresh session if expired and set cookies
  // IMPORTANT: Do not run any other code between createServerClient and getUser
  // or getSession. A simple mistake could make it very hard to debug issues
  // with users being randomly logged out.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Manually set cookies on the response
  if (session && session.access_token) {
    supabaseResponse.cookies.set({
      name: 'sb-access-token', // Or whatever your Supabase access token cookie is named
      value: session.access_token,
      httpOnly: true,
      secure: true, // Use true in production
      path: '/',
      maxAge: session.expires_in, // Or session.expires_at - Math.floor(Date.now() / 1000)
    });
  }
  if (session && session.refresh_token) {
    supabaseResponse.cookies.set({
      name: 'sb-refresh-token', // Or whatever your Supabase refresh token cookie is named
      value: session.refresh_token,
      httpOnly: true,
      secure: true, // Use true in production
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // Example: 7 days
    });
  }

  // Log cookies after session refresh attempt (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log("Middleware: Supabase response cookies after refresh:", supabaseResponse.cookies.getAll().map(c => c.name));
  }

  // Log errors only if they're not "session missing" errors
  if (sessionError || userError) {
    const isSessionMissing = sessionError?.message?.includes('Auth session missing') || 
                            userError?.message?.includes('Auth session missing');
    
    if (!isSessionMissing) {
      console.error("Middleware session or user error:", sessionError || userError);
    } else if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH) {
      console.log("Middleware: No session (normal for public requests)");
    }
  }

  const { pathname } = request.nextUrl
  const publicRoutes = ["/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Executive route protection
  if (pathname.startsWith('/executive')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'executive') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // IMPORTANT: You must return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
