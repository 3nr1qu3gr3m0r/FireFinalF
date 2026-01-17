import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');

  // 1. Si intenta entrar a /admin y NO tiene token -> Mandar al Login
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Si ya tiene token y está en el Login (/) -> Mandar al Dashboard
  if (request.nextUrl.pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configuración: A qué rutas afecta este middleware
export const config = {
  matcher: ['/', '/admin/:path*'],
};