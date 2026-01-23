import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('token');

  // 👇 DETECCIÓN INTELIGENTE: Si es FormData (archivos), no forzamos JSON
  const isFormData = options.body instanceof FormData;
  
  const headers: any = {
    // Solo agregamos Content-Type json si NO es un archivo
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') window.location.href = '/';
      return null;
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) return null;

    return await response.json();

  } catch (error) {
    console.error(`Error en fetchWithAuth [${endpoint}]:`, error);
    throw error;
  }
}