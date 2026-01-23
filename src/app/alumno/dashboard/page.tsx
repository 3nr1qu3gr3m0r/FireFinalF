"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function AlumnoDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Eliminamos el token
    Cookies.remove("token");
    // 2. Redirigimos al Login
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0A1D37] flex flex-col items-center justify-center text-white gap-6">
      <h1 className="text-3xl font-bold">Bienvenido al Panel de Alumno 🔥</h1>
      
      {/* Botón de Cerrar Sesión */}
      <button 
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/30 transition-transform active:scale-95 flex items-center gap-2"
      >
        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
      </button>
    </div>
  );
}