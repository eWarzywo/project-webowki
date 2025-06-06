import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    console.log('Middleware executed for:', req.nextUrl.pathname);

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const path = req.nextUrl.pathname;

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (
        path.startsWith('/api/') ||
        path === '/household' ||
        path === '/login' ||
        path === '/logout' ||
        path === '/signup'
    ) {
        return response;
    }

    if (!token) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    if (!token.householdId) {
        console.log('User has no household, redirecting to household selection');
        const householdUrl = new URL('/household', req.url);
        return NextResponse.redirect(householdUrl);
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup|api).*)'],
};
