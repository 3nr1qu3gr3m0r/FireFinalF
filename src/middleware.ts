import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. RUTAS EXCLUSIVAS DE ADMIN (Bloquean a Recepcionistas)
const ADMIN_ONLY_ROUTES = [
  '/admin/tienda', 
  '/admin/paquetes',
  '/admin/niveles',
  '/admin/insignias',
  '/admin/xv-anos',
];

// 2. EXCEPCIONES: Rutas que SÍ pueden ver los Recepcionistas
const RECEPTIONIST_EXCEPTIONS = [
  '/admin/tienda/ventas', 
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // --- ZONA ADMINISTRATIVA (/admin) ---
  if (pathname.startsWith('/admin')) {
    
    // A. Sin token -> Al Login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // B. Decodificar Token (Manual, sin librerías externas)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      const userRole = (payload.rol || payload.role || '').toLowerCase(); // Normalizamos

      // C. REGLA DE ORO 1: Los ALUMNOS nunca entran a /admin
      if (userRole === 'alumno') {
        return NextResponse.redirect(new URL('/alumno/dashboard', request.url));
      }

      // D. VALIDACIÓN DE RECEPCIONISTA (NO ADMIN)
      if (userRole !== 'admin') {
         
         // 🔒 REGLA ESPECÍFICA: Gamificación es SOLO para admin
         // Bloqueamos cualquier ruta que termine en /gamification dentro de /admin
         if (pathname.includes('/gamification')) {
             return NextResponse.redirect(new URL('/admin/dashboard', request.url));
         }

         // REGLAS GENERALES
         const isRestricted = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
         const isException = RECEPTIONIST_EXCEPTIONS.some(route => pathname.startsWith(route));

         // Si es zona restringida Y NO es una excepción -> FUERA
         if (isRestricted && !isException) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
         }
      }

    } catch (error) {
      // Token corrupto -> Al Login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // --- ZONA LOGIN (Evitar entrar si ya hay sesión) ---
  if (pathname === '/' && token) {
     return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};