"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import BottomNav from "@/components/admin/BottomNav";
import Header from "@/components/admin/Header";
import { useSidebar } from "@/context/SidebarContext"; // Importamos el contexto

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBottomNav = !pathname?.includes("/admin/xv-anos");
  
  // 👇 Obtenemos el estado para mover el contenido dinámicamente
  const { isOpen } = useSidebar(); 

  return (
    <div className="flex h-screen w-full bg-[#0A1D37] overflow-hidden">
      
      {/* Sidebar (Ahora se abre y cierra en PC también) */}
      <Sidebar />

      {/* CONTENEDOR DERECHO */}
      <div 
        className={`
            flex-1 flex flex-col h-full relative w-full transition-all duration-300
            ${isOpen ? 'md:ml-64' : 'md:ml-0'} 
            /* 👆 LÓGICA CLAVE: Si está abierto, deja hueco. Si no, ocupa todo */
        `}
      >
        <Header />

        <main className="flex-1 overflow-y-auto p-0 scroll-smooth bg-[#0A1D37]">
           <div className={`w-full ${showBottomNav ? 'pb-24' : 'pb-4'}`}>
              {children}
           </div>
        </main>

      </div>

      {/* Bottom Nav (Ajustamos su posición izquierda dinámicamente también) */}
      {showBottomNav && (
        <div className={`fixed bottom-0 right-0 z-50 transition-all duration-300 left-0 ${isOpen ? 'md:left-64' : 'md:left-0'}`}>
           <BottomNav />
        </div>
      )}

    </div>
  );
}