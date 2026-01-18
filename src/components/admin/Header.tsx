"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  // --- 1. LÓGICA DE USUARIO (Dinámica) ---
  const [user, setUser] = useState({
    nombre: "Usuario",
    rol: "Cargando...",
    foto: null
  });

  useEffect(() => {
    // Recuperamos los datos reales guardados en el Login
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
            nombre: parsed.nombre || "Usuario",
            rol: parsed.rol || "Miembro",
            foto: parsed.foto || null
        });
      } catch (e) {
        console.error("Error leyendo usuario header");
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.removeItem("usuario");
    router.push("/");
  };

  // --- 2. LÓGICA DEL TÍTULO DE PÁGINA (Tuya) ---
  const getPageInfo = () => {
    if (pathname?.includes("/admin/dashboard")) return { title: "Inicio", icon: "fa-home" };
    if (pathname?.includes("/admin/xv-anos")) return { title: "Gestión de XV Años", icon: "fa-crown" };
    if (pathname?.includes("/admin/tienda")) return { title: "Tienda", icon: "fa-store" };
    if (pathname?.includes("/admin/clases")) return { title: "Clases", icon: "fa-graduation-cap" };
    if (pathname?.includes("/admin/usuarios")) return { title: "Lista de Usuarios", icon: "fa-users" };
    // Agrega más rutas según necesites
    return { title: "Panel de Administración", icon: "fa-layer-group" };
  };

  const { title, icon } = getPageInfo();

  return (
    // 👇 MANTUVIMOS TU DEGRADADO Y ESTILOS
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0A1D37] to-[#C4006B] text-white border-b border-gray-700/50 sticky top-0 z-30 shrink-0 shadow-lg">
      
      {/* --- IZQUIERDA: Toggle + Título --- */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="text-2xl text-white focus:outline-none active:scale-95 transition-transform"
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/10 items-center justify-center backdrop-blur-sm">
                <i className={`fas ${icon} text-sm`}></i>
            </div>
            <h1 className="text-xl font-bold tracking-wide drop-shadow-md">
              {title}
            </h1>
        </div>
      </div>

      {/* --- DERECHA: Notificaciones + Perfil Dinámico --- */}
      <div className="flex items-center space-x-5">
        
        {/* Notificaciones */}
        <button className="relative text-xl text-white/80 hover:text-white transition-colors group">
          <i className="fas fa-bell drop-shadow-md"></i>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A1D37]"></span>
        </button>

        {/* Perfil de Usuario (Con Dropdown para salir) */}
        <div className="flex items-center gap-3 group relative cursor-pointer">
            <div className="text-right hidden md:block">
                {/* Nombre real del usuario */}
                <p className="text-xs font-bold group-hover:text-white transition-colors">
                    {user.nombre}
                </p>
                {/* Rol real */}
                <p className="text-[10px] text-white/60 uppercase tracking-wider">
                    {user.rol}
                </p>
            </div>
            
            {/* Foto real o Icono por defecto */}
            <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shadow-md group-hover:border-white transition-all">
                {user.foto ? (
                    <img src={user.foto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    <i className="fas fa-user-circle text-3xl text-white/90"></i>
                )}
            </div>

            {/* Dropdown Flotante para Cerrar Sesión */}
            <div className="absolute top-full right-0 mt-3 w-48 bg-[#1E293B] border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="p-2">
                    <Link href="/admin/perfil" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mb-1">
                        <i className="fas fa-user-cog"></i> Mi Perfil
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
                    >
                        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>

      </div>
    </header>
  );
}