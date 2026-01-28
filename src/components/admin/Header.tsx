"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { MENU_ITEMS } from "@/config/admin/menuItems";
import { fetchWithAuth } from "@/lib/api"; 

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState({ nombre: "Usuario", rol: "Cargando...", foto: null });

  // Estado para modo estudiante
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const isStudentMode = pathname?.includes('/admin/students/');

  // Cargar usuario logueado
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ nombre: parsed.nombre || "Usuario", rol: parsed.rol || "Miembro", foto: parsed.foto || null });
      } catch (e) { console.error(e); }
    }
  }, []);

  // Cargar info del estudiante si estamos en modo estudiante
  useEffect(() => {
    if (isStudentMode) {
        // Asegurarse de que pathname no sea null
        if (!pathname) return;
        
        const parts = pathname.split('/');
        // La estructura es /admin/students/[id]/... el ID suele ser el índice 3
        const studentId = parts[3];
        
        if (studentId && !isNaN(Number(studentId))) {
            // 👇 CORRECCIÓN AQUÍ: fetchWithAuth ya devuelve el JSON directo
            fetchWithAuth(`/users/${studentId}`)
                .then(data => {
                    if (data && !data.error) {
                        setStudentInfo(data);
                    }
                })
                .catch(err => console.error("Error cargando header alumno", err));
        }
    } else {
        setStudentInfo(null);
    }
  }, [pathname, isStudentMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.removeItem("usuario");
    router.push("/");
  };

  const getPageInfo = () => {
    const currentItem = MENU_ITEMS.find(item => pathname?.includes(item.href));
    if (currentItem) {
        return { 
            title: currentItem.pageTitle || currentItem.label, 
            icon: currentItem.icon 
        };
    }
    return { title: "Panel de Administración", icon: "fa-layer-group" };
  };

  const { title, icon } = getPageInfo();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0A1D37] to-[#C4006B] text-white border-b border-gray-700/50 sticky top-0 z-30 shrink-0 shadow-lg">
      
      <div className="flex items-center gap-4">
        {/* LÓGICA DE BOTÓN: Si es estudiante = ATRÁS, si no = SIDEBAR */}
        {isStudentMode ? (
             <button 
             onClick={() => router.push('/admin/dashboard')} 
             className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition"
           >
             <i className="fas fa-arrow-left"></i>
           </button>
        ) : (
            <button 
            onClick={toggleSidebar} 
            className="text-2xl text-white focus:outline-none active:scale-95 transition-transform"
            >
            <i className="fas fa-bars"></i>
            </button>
        )}
        
        {/* LÓGICA DE TÍTULO: Si es estudiante = Info Alumno, si no = Título Pagina */}
        {isStudentMode && studentInfo ? (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                 <div className="relative">
                    <img 
                        src={studentInfo.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} 
                        className="w-10 h-10 rounded-full border-2 border-pink-400 object-cover bg-white"
                        alt="Alumno"
                    />
                    {studentInfo.nivel && (
                         <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                    )}
                 </div>
                 <div>
                     <h1 className="text-lg font-bold leading-none">Admin. Alumno</h1>
                     <p className="text-pink-300 text-xs font-medium mt-0.5">{studentInfo.nombre_completo}</p>
                 </div>
             </div>
        ) : (
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/10 items-center justify-center backdrop-blur-sm">
                    <i className={`fas ${icon} text-sm`}></i>
                </div>
                <h1 className="text-xl font-bold tracking-wide drop-shadow-md">{title}</h1>
            </div>
        )}
      </div>

      <div className="flex items-center space-x-5">
        <button className="relative text-xl text-white/80 hover:text-white transition-colors group">
          <i className="fas fa-bell drop-shadow-md"></i>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A1D37]"></span>
        </button>

        {/* PERFIL USUARIO LOGUEADO (Siempre visible) */}
        <div className="relative" ref={profileRef}>
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className="text-right hidden md:block">
                    <p className="text-xs font-bold group-hover:text-white transition-colors">{user.nombre}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">{user.rol}</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shadow-md">
                    {user.foto ? <img src={user.foto} alt="Perfil" className="w-full h-full object-cover" /> : <i className="fas fa-user-circle text-3xl text-white/90"></i>}
                </div>
            </div>
            {isProfileOpen && (
                <div className="absolute top-full right-0 mt-3 w-48 bg-[#1E293B] border border-gray-700 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2">
                        <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mb-1">
                            <i className="fas fa-user-cog"></i> Mi Perfil
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors">
                            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}