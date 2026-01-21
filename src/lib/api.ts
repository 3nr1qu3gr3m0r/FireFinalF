// frontend/src/lib/api.ts
import Cookies from 'js-cookie'; // 👈 Importamos la librería

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // 👇 CAMBIO CLAVE: Leer el token desde las Cookies, no de localStorage
  const token = Cookies.get('token'); 

  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Si hay token, lo agregamos al Header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el backend dice "No autorizado" (Token vencido o falso)
  if (response.status === 401) {
    Cookies.remove('token'); // Borramos la cookie corrupta
    if (typeof window !== 'undefined') {
        window.location.href = '/'; // Redirigir al Login
    }
  }

  return response;
}