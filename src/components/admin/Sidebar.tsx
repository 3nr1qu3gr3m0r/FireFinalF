"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import Cookies from "js-cookie";

// 1. CONFIGURACIÓN MAESTRA DEL MENÚ
const MENU_ITEMS = [
  { 
    key: 'inicio', 
    label: 'Inicio', 
    href: '/admin/dashboard', 
    icon: 'fas fa-home', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'tienda', 
    label: 'Tienda', 
    href: '/admin/tienda', 
    icon: 'fas fa-store', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'clases', 
    label: 'Clases', 
    href: '/admin/clases', 
    icon: 'fas fa-graduation-cap', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'xv-anos', 
    label: 'XV Años', 
    href: '/admin/xv-anos', 
    icon: 'fas fa-crown', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'usuarios', 
    label: 'Lista de Usuarios', 
    href: '/admin/usuarios', 
    icon: 'fas fa-users', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'cumpleanos', 
    label: 'Cumpleaños', 
    href: '/admin/cumpleanos', 
    icon: 'fas fa-birthday-cake', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'alta-usuario', 
    label: 'Alta de Usuario', 
    href: '/admin/alta-usuario', 
    icon: 'fas fa-user-plus', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'paquetes', 
    label: 'Planes', 
    href: '/admin/paquetes', 
    icon: 'fas fa-box', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'insignias', 
    label: 'Insignias', 
    href: '/admin/insignias', 
    icon: 'fas fa-trophy', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'adeudos', 
    label: 'Adeudos', 
    href: '/admin/adeudos', 
    icon: 'fas fa-file-invoice-dollar', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'movimientos', 
    label: 'Movimientos', 
    href: '/admin/consultas', 
    icon: 'fas fa-wallet', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'estadisticas', 
    label: 'Estadísticas', 
    href: '/admin/estadisticas', 
    icon: 'fas fa-chart-line', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'comunidad', 
    label: 'Comunidad', 
    href: '/admin/comunidad', 
    icon: 'fas fa-users', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
];

export default function Sidebar() {
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const pathname = usePathname() || "";
  const router = useRouter();
  
  const [userRole, setUserRole] = useState<string>('alumno');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.rol || 'alumno');
      } catch (error) {
        console.error("Error leyendo rol del usuario:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.removeItem("usuario");
    router.push("/");
  };  

  const visibleItems = MENU_ITEMS.filter(item => item.allowedRoles.includes(userRole));

  const getActiveKey = () => {
    const found = MENU_ITEMS.find(item => pathname.includes(item.href));
    return found ? found.key : '';
  };
  const activeKey = getActiveKey();

  const getLinkClass = (key: string) => 
    `flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap group mb-1 ${
      activeKey === key 
      ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg shadow-pink-900/40 font-semibold' 
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;

  if (!isClient) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[90] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />

      <aside 
        className={`
            fixed top-0 left-0 h-[100dvh] bg-[#111827] border-r border-gray-800 z-[100] 
            transition-transform duration-300 ease-in-out w-64 flex flex-col
            ${isOpen ? "translate-x-0" : "-translate-x-full"} 
            /* 👇 CAMBIOS CLAVE: 
               - h-[100dvh]: Se adapta a la altura real visible en móviles 
               - z-[100]: Se asegura de estar ENCIMA de la BottomNav (que suele ser z-50)
            */
        `}
      >
        <div className="flex items-center justify-between p-6 mb-2 h-20 shrink-0">
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">
              {userRole === 'admin' ? 'ADMIN' : 'RECEPCIÓN'}
            </h2>
            <button onClick={toggleSidebar} className="text-2xl text-white md:hidden">
                <i className="fas fa-times"></i>
            </button>
        </div>

        {/* Quitamos el exceso de padding inferior aquí para que no empuje cosas raras, 
            ya que el botón está fuera del scroll */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {visibleItems.map((item) => (
              <Link 
                key={item.key} 
                href={item.href} 
                onClick={closeSidebar} 
                className={getLinkClass(item.key)}
              >
                <i className={`${item.icon} w-6`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>

        {/* SECCIÓN FIJA INFERIOR */}
        <div className="p-4 border-t border-gray-800 mt-auto bg-[#111827] shrink-0 safe-area-bottom">
            <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all group font-semibold"
            >
                <i className="fas fa-sign-out-alt w-6"></i>
                <span>Cerrar Sesión</span>
            </button>
        </div>
      </aside>
    </>
  );
}