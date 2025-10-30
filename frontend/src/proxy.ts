import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const access = req.cookies.get('accessToken');
  const emailVerified = req.cookies.get('emailVerified');

  const isProtected = pathname.startsWith('/dashboard');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isVerifyEmailPage = pathname.startsWith('/verify-email');

  if (isProtected && !access) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in but not verified, force verify page for dashboard routes
  if (isProtected && access && emailVerified?.value !== '1') {
    const url = req.nextUrl.clone();
    url.pathname = '/verify-email';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && access) {
    // If verified, short-circuit to dashboard; otherwise allow login/register so user can switch or logout
    if (emailVerified?.value === '1') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If already verified and on verify page, push to dashboard
  if (isVerifyEmailPage && access && emailVerified?.value === '1') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};


