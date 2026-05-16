import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (public login page)
     * - root (/) (landing page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need auth checking
  const publicPaths = ['/', '/login'];
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/test-db')) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the JWT token
  const payload = await verifyJWT(token);

  if (!payload) {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Role-Based Access Control (RBAC)
  const { role } = payload;

  if (pathname.startsWith('/employee') && role !== 'employee' && role !== 'admin' && role !== 'manager') {
     // Wait, prompt says: Employee: cannot access manager/admin. Manager: cannot access admin. Admin: can access everything.
     // So manager and admin CAN access employee routes (technically to see employee views).
  }

  if (pathname.startsWith('/manager')) {
    if (role === 'employee') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (role === 'employee') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
    if (role === 'manager') {
      return NextResponse.redirect(new URL('/manager', request.url));
    }
  }

  return NextResponse.next();
}
