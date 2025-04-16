import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  console.log('Middleware executed for:', req.nextUrl.pathname);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  console.log('Token details:', token);
  
  // If no token and not on excluded paths, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow access if token exists
  return NextResponse.next();
}

// Apply the middleware to specific routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
};