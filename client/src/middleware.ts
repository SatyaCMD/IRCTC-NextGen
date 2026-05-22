import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // If the user visits support.irctcv2.co.in, rewrite the root path to /support
    if (hostname.includes('support.irctcv2.co.in')) {
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/support', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
