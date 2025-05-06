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

    const path = req.nextUrl.pathname;

    if (
        path.startsWith('/api/') ||
        path === '/household' ||
        path === '/login' ||
        path === '/logout' ||
        path === '/signup'
    ) {
        return NextResponse.next();
    }

    // If no token (not logged in), redirect to login
    if (!token) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    // If user is logged in but doesn't have a household ID, redirect to /household
    if (!token.householdId) {
        console.log('User has no household, redirecting to household selection');
        const householdUrl = new URL('/household', req.url);
        return NextResponse.redirect(householdUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup|api).*)'],
};
