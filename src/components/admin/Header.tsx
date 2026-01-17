"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const getPageInfo = () => {
    if (pathname?.includes("/admin/dashboard")) return { title: "Inicio", icon: "fa-home" };
    if (pathname?.includes("/admin/xv-anos")) return { title: "Gestión de XV Años", icon: "fa-crown" };
    if (pathname?.includes("/admin/tienda")) return { title: "Tienda", icon: "fa-store" };
    // ... resto de tus rutas ...
    return { title: "Panel de Administración", icon: "fa-layer-group" };
  };

  const { title, icon } = getPageInfo();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0A1D37] to-[#C4006B] text-white border-b border-gray-700/50 sticky top-0 z-30 shrink-0 shadow-lg">
      
      <div className="flex items-center gap-4">
        {/* 👇 CAMBIO AQUÍ: Quitamos 'md:hidden' para que el botón aparezca en PC */}
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

      <div className="flex items-center space-x-5">
        <button className="relative text-xl text-white/80 hover:text-white transition-colors group">
          <i className="fas fa-bell drop-shadow-md"></i>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A1D37]"></span>
        </button>
        <Link href="/admin/perfil" className="flex items-center gap-3 group">
            <div className="text-right hidden md:block">
                <p className="text-xs font-bold group-hover:text-white transition-colors">Admin</p>
                <p className="text-[10px] text-white/60">En línea</p>
            </div>
            <i className="fas fa-user-circle text-3xl text-white/90 group-hover:text-white drop-shadow-md transition-all group-hover:scale-105"></i>
        </Link>
      </div>
    </header>
  );
}