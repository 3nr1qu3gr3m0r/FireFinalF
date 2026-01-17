"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname() || "";
  const isActive = (path: string) => pathname === path;

  // Lógica de exclusión global (XV Años)
  if (pathname.includes("/admin/xv-anos")) {
    return null;
  }

  // --- RENDERIZADO CONDICIONAL DE PLANTILLAS ---

  // 1. TIENDA (shopBottomNavTemplate)
  if (pathname.includes('/admin/tienda') || pathname.includes('/admin/registrarventa')) {
    return (
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50">
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/tienda" icon="fa-box-open" label="Productos" active={isActive("/admin/tienda")} />
           <NavButton href="/admin/registrarventa" icon="fa-cash-register" label="Registrar Venta" active={isActive("/admin/registrarventa")} />
        </div>
      </footer>
    );
  }

  // 2. PLANES (plansBottomNavTemplate)
  if (pathname.includes('/admin/paquetes') || pathname.includes('/admin/agregar-paquete')) {
    return (
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50">
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/paquetes" icon="fa-eye" label="Consultar" active={isActive("/admin/paquetes")} />
           <NavButton href="/admin/agregar-paquete" icon="fa-plus-circle" label="Agregar" active={isActive("/admin/agregar-paquete")} />
        </div>
      </footer>
    );
  }

  // 3. INSIGNIAS Y NIVELES (badgesLevelsBottomNavTemplate)
  if (pathname.includes('/admin/insignias') || pathname.includes('/admin/niveles')) {
    return (
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50">
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/insignias" icon="fa-trophy" label="Insignias" active={isActive("/admin/insignias")} />
           <NavButton href="/admin/niveles" icon="fa-layer-group" label="Niveles" active={isActive("/admin/niveles")} />
        </div>
      </footer>
    );
  }

  // 4. MOVIMIENTOS (transactionsBottomNavTemplate)
  if (pathname.includes('/admin/consultas') || pathname.includes('/admin/ingresos-egresos')) {
    return (
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50">
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/consultas" icon="fa-search-dollar" label="Consultar" active={isActive("/admin/consultas")} />
           <NavButton href="/admin/ingresos-egresos" icon="fa-edit" label="Registrar" active={isActive("/admin/ingresos-egresos")} />
        </div>
      </footer>
    );
  }

  // 5. DEFAULT DASHBOARD (dashboardBottomNavTemplate)
  // Se usa para 'inicio', 'reservas', 'comunidad', etc.
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-4 h-16 items-center max-w-4xl mx-auto px-2">
        <NavButton href="/admin/dashboard" icon="fa-home" label="Inicio" active={isActive("/admin/dashboard")} />
        <NavButton href="/admin/reservas" icon="fa-calendar-check" label="Reservas" active={isActive("/admin/reservas")} />
        <NavButton href="/admin/comunidad" icon="fa-users" label="Comunidad" active={isActive("/admin/comunidad")} />
        <NavButton href="/admin/tienda" icon="fa-store" label="Tienda" active={isActive("/admin/tienda")} />
      </div>
    </footer>
  );
}

// Componente auxiliar visual
function NavButton({ href, icon, label, active }: any) {
    return (
        <Link href={href} className={`flex flex-col items-center justify-center h-full transition-all ${active ? 'text-white scale-105' : 'text-white/60 hover:text-white'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${active ? 'text-white drop-shadow-md' : ''}`}></i>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${active ? 'text-white' : ''}`}>{label}</span>
        </Link>
    )
}