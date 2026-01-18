"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { SidebarProvider } from "@/context/SidebarContext";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Verificar si hay token
    const token = document.cookie.includes("token="); // O tu lógica de cookies
    
    // 2. Recuperar usuario del localStorage
    const storedUser = localStorage.getItem("usuario");
    
    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      
      // 🚨 AQUÍ ESTÁ LA CLAVE: Permitimos 'admin' Y 'recepcionista'
      if (['admin', 'recepcionista'].includes(user.rol)) {
        setIsAuthorized(true);
      } else {
        // Si es alumno o cualquier otro rol raro, va para afuera
        router.push("/alumno/dashboard");
      }
    } catch (error) {
      console.error("Error validando sesión:", error);
      router.push("/");
    }
  }, [router, pathname]);

  if (!isAuthorized) {
    return null; // O un spinner de carga
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#111827] overflow-hidden">
        {/* Sidebar Inteligente (ya lo configuramos antes) */}
        <Sidebar />
        
        <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
          {/* Header Dinámico (lo configuramos abajo) */}
          <Header />
          
          <main className="flex-1 overflow-y-auto bg-[#0B111D] p-4 md:p-8 relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}