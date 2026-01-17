"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function Sidebar() {
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const pathname = usePathname() || "";

  // ... (Tus funciones getActiveKey y getLinkClass siguen IGUAL) ...
  const getActiveKey = () => { /* ... */ return ''; };
  const activeKey = getActiveKey();
  const getLinkClass = (key: string) => `flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap group mb-1 ${activeKey === key ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg shadow-pink-900/40 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />

      <aside 
        className={`
            fixed top-0 left-0 h-screen bg-[#111827] border-r border-gray-800 z-50 
            transition-transform duration-300 ease-in-out w-64 flex flex-col
            ${isOpen ? "translate-x-0" : "-translate-x-full"} 
            /* 👇 CAMBIO AQUÍ: Eliminamos 'md:translate-x-0' para que en PC también se pueda esconder */
        `}
      >
        <div className="flex items-center justify-between p-6 mb-2 h-20 shrink-0">
            <h2 className="text-xl font-bold text-white tracking-widest">MENÚ</h2>
            <button onClick={toggleSidebar} className="text-2xl text-white md:hidden">
                <i className="fas fa-times"></i>
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-20">
            <Link href="/admin/dashboard" onClick={closeSidebar} className={getLinkClass('inicio')}>
              <i className="fas fa-home w-6"></i><span>Inicio</span>
            </Link>
            <Link href="/admin/tienda" onClick={closeSidebar} className={getLinkClass('tienda')}>
              <i className="fas fa-store w-6"></i><span>Tienda</span>
            </Link>
            <Link href="/admin/clases" onClick={closeSidebar} className={getLinkClass('clases')}>
              <i className="fas fa-graduation-cap w-6"></i><span>Clases</span>
            </Link>
            <Link href="/admin/xv-anos" onClick={closeSidebar} className={getLinkClass('xv-anos')}>
              <i className="fas fa-crown w-6"></i><span>XV Años</span>
            </Link>
            <Link href="/admin/usuarios" onClick={closeSidebar} className={getLinkClass('lista-usuarios')}>
              <i className="fas fa-users w-6"></i><span>Lista de Usuarios</span>
            </Link>
            <Link href="/admin/cumpleanos" onClick={closeSidebar} className={getLinkClass('cumpleanos')}>
              <i className="fas fa-birthday-cake w-6"></i><span>Cumpleaños</span>
            </Link>
            <Link href="/admin/alta-usuario" onClick={closeSidebar} className={getLinkClass('alta-usuario')}>
              <i className="fas fa-user-plus w-6"></i><span>Alta de Usuario</span>
            </Link>
            <Link href="/admin/paquetes" onClick={closeSidebar} className={getLinkClass('planes')}>
              <i className="fas fa-box w-6"></i><span>Planes</span>
            </Link>
            <Link href="/admin/insignias" onClick={closeSidebar} className={getLinkClass('badges')}>
              <i className="fas fa-trophy w-6"></i><span>Insignias</span>
            </Link>
            <Link href="/admin/adeudos" onClick={closeSidebar} className={getLinkClass('adeudos')}>
              <i className="fas fa-file-invoice-dollar w-6"></i><span>Adeudos</span>
            </Link>
            <Link href="/admin/consultas" onClick={closeSidebar} className={getLinkClass('movimientos')}>
              <i className="fas fa-wallet w-6"></i><span>Movimientos</span>
            </Link>
            <Link href="/admin/estadisticas" onClick={closeSidebar} className={getLinkClass('estadisticas')}>
              <i className="fas fa-chart-line w-6"></i><span>Estadísticas</span>
            </Link>
            <Link href="/admin/comunidad" onClick={closeSidebar} className={getLinkClass('comunidad')}>
              <i className="fas fa-users w-6"></i><span>Comunidad</span>
            </Link>
        </nav>
      </aside>
    </>
  );
}