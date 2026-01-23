"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname() || "";
  const [userRole, setUserRole] = useState<string>('alumno');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            setUserRole(parsed.rol || 'alumno');
        } catch (e) { console.error("Error leyendo usuario"); }
    }
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  if (!isMounted) return null;

  const navClasses = "fixed bottom-0 left-0 w-full z-40 bg-gradient-to-l from-[#0A1D37] to-[#C4006B] border-t border-gray-700/50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]";

  // --- 0. SECCIÓN ALUMNO ---
  if (pathname.includes('/admin/students/')) {
    const parts = pathname.split('/');
    const studentId = parts[3]; 
    const baseUrl = `/admin/students/${studentId}`;

    const tabs = [
        { name: 'Perfil', path: baseUrl, icon: 'fa-user' },
        { name: 'Ventas', path: `${baseUrl}/payments`, icon: 'fa-cart-plus' }, 
        { name: 'Reservas', path: `${baseUrl}/bookings`, icon: 'fa-calendar-alt' },
        { name: 'Logros', path: `${baseUrl}/gamification`, icon: 'fa-medal' },
    ];

    return (
        <footer className={navClasses}>
            <div className="flex justify-around items-center h-16 max-w-3xl mx-auto px-2">
                {tabs.map((tab) => {
                    const isTabActive = tab.path === baseUrl ? pathname === baseUrl : pathname.startsWith(tab.path);
                    return (
                        <Link key={tab.path} href={tab.path} className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-90 group ${isTabActive ? 'text-white -translate-y-1' : 'text-white/70 hover:text-white'}`}>
                            <i className={`fas ${tab.icon} text-xl mb-1 transition-colors ${isTabActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}></i>
                            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </footer>
    );
  }

  // --- 1. SECCIÓN TIENDA (SOLO PARA ADMIN) ---
  // Si eres admin y estás en tienda, ves el submenú de tienda.
  // Si eres recepcionista, ESTO SE IGNORA y cae al default del final.
  if (pathname.includes('/admin/tienda') && userRole === 'admin') {
    return (
      <footer className={navClasses}>
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/tienda" icon="fa-box-open" label="Productos" active={pathname === "/admin/tienda"} />
           <NavButton href="/admin/tienda/ventas" icon="fa-cash-register" label="Registrar Venta" active={pathname.includes("/ventas")} />
        </div>
      </footer>
    );
  }

  // --- 2. SECCIÓN PLANES ---
  if (pathname.includes('/admin/paquetes')) {
    return (
      <footer className={navClasses}>
        <div className="flex h-16 items-center justify-center max-w-4xl mx-auto px-2">
           <span className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2 animate-pulse">
              <i className="fas fa-box-open text-lg"></i>Gestión de Planes
           </span>
        </div>
      </footer>
    );
  }

  // --- 3. SECCIÓN INSIGNIAS/NIVELES ---
  if (pathname.includes('/admin/insignias') || pathname.includes('/admin/niveles')) {
    return (
      <footer className={navClasses}>
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/insignias" icon="fa-trophy" label="Insignias" active={isActive("/admin/insignias")} />
           <NavButton href="/admin/niveles" icon="fa-layer-group" label="Niveles" active={isActive("/admin/niveles")} />
        </div>
      </footer>
    );
  }

  // --- 4. SECCIÓN MOVIMIENTOS ---
  if (pathname.includes('/admin/consultas') || pathname.includes('/admin/ingresos-egresos')) {
    return (
      <footer className={navClasses}>
        <div className="grid grid-cols-2 h-16 items-center max-w-4xl mx-auto px-2">
           <NavButton href="/admin/consultas" icon="fa-search-dollar" label="Consultar" active={isActive("/admin/consultas")} />
           <NavButton href="/admin/ingresos-egresos" icon="fa-edit" label="Registrar" active={isActive("/admin/ingresos-egresos")} />
        </div>
      </footer>
    );
  }

  // --- 5. SECCIÓN CLASES ---
  if (pathname.includes('/admin/clases')) {
    return (
      <footer className={navClasses}>
        <div className="flex h-16 items-center justify-center max-w-4xl mx-auto px-2">
           <span className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2 animate-pulse">
              <i className="fas fa-graduation-cap text-lg"></i>Gestión de Clases
           </span>
        </div>
      </footer>
    );
  }

  // --- 6. SECCIÓN XV AÑOS ---
  if (pathname.includes('/admin/xv-anos')) {
    return (
      <footer className={navClasses}>
        <div className="flex h-16 items-center justify-center max-w-4xl mx-auto px-2">
           <span className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2 animate-pulse">
              <i className="fas fa-crown text-lg"></i>Gestión XV Años
           </span>
        </div>
      </footer>
    );
  }

  // --- 7. DASHBOARD DEFAULT (Aquí cae la Recepcionista en Tienda) ---
  const storeLink = userRole === 'recepcionista' ? "/admin/tienda/ventas" : "/admin/tienda";
  const storeIcon = userRole === 'recepcionista' ? "fa-cash-register" : "fa-store";
  const storeLabel = userRole === 'recepcionista' ? "Registrar venta (tienda)" : "Tienda";

  // Lógica para saber si el botón "Tienda/Vender" debe estar activo visualmente
  const isStoreActive = pathname.startsWith("/admin/tienda");

  return (
    <footer className={navClasses}>
      <div className="grid grid-cols-4 h-16 items-center max-w-4xl mx-auto px-2">
        <NavButton href="/admin/dashboard" icon="fa-home" label="Inicio" active={isActive("/admin/dashboard")} />
        <NavButton href="/admin/reservas" icon="fa-calendar-check" label="Reservas" active={isActive("/admin/reservas")} />
        <NavButton href="/admin/comunidad" icon="fa-users" label="Comunidad" active={isActive("/admin/comunidad")} />
        <NavButton href={storeLink} icon={storeIcon} label={storeLabel} active={isStoreActive} />
      </div>
    </footer>
  );
}

function NavButton({ href, icon, label, active }: any) {
    return (
        <Link href={href} className={`flex flex-col items-center justify-center h-full transition-all duration-300 group ${active ? 'scale-110 -translate-y-1' : 'hover:scale-105'}`}>
            <i className={`fas ${icon} text-xl mb-1 transition-colors ${active ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-white/70 group-hover:text-white'}`}></i>
            <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                {label}
            </span>
        </Link>
    )
}