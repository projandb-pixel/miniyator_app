import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // مسیرهای عمومی که نیاز به authentication ندارند
  const publicPaths = [
    '/',
    '/splash',
    '/login',
    '/auth/login',
    '/auth/redirect', // صفحه میانی redirect
    '/auth/select-role',
    '/auth/quick-register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/contractor-signup',
    '/auth/supplier-signup',
    '/privacy',
    '/terms',
  ]

  // بررسی اینکه آیا مسیر عمومی است
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // برای مسیرهای استاتیک و Next.js internal
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox-') ||
    pathname.startsWith('/icon-')
  ) {
    return NextResponse.next()
  }

  // اگر مسیر عمومی است، اجازه بده
  if (isPublicPath) {
    return NextResponse.next()
  }

  // بررسی وجود cookie برای userId
  let userId = request.cookies.get('userId')?.value

  // Logging برای دیباگ
  if (pathname === '/auth/login') {
    console.log('Login page access - userId cookie:', userId ? 'exists' : 'missing');
  }

  // اگر userId وجود نداشت، به صفحه لاگین هدایت کن
  if (!userId) {
    const loginUrl = new URL('/auth/login', request.url)
    // ذخیره URL مقصد برای redirect بعد از لاگین
    loginUrl.searchParams.set('redirect', pathname)
    console.log('Redirecting to login, pathname:', pathname, 'userId cookie:', userId ? 'exists' : 'missing');
    return NextResponse.redirect(loginUrl)
  }
  
  console.log('User authenticated, userId:', userId, 'pathname:', pathname);

  // اگر userId وجود داشت، اجازه بده
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}




