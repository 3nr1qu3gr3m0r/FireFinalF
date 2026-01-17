"use client";
import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import BottomNav from "@/components/admin/BottomNav";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

// Componente interno para manejar el botón del menú móvil
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111827] border-b border-gray-800 sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 text-gray-300 hover:text-white active:scale-95 transition-all"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        <span className="text-white font-bold tracking-wide">Panel Admin</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] flex items-center justify-center text-white text-xs font-bold">
        FI
      </div>
    </div>
  );
}

export default function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#0A1D37]">
        
        {/* 1. SIDEBAR (Izquierda - Controlado por el Contexto) */}
        <Sidebar />

        {/* 2. CONTENIDO PRINCIPAL (Derecha) */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          
          {/* Header Móvil (Botón Hamburguesa) */}
          <MobileHeader />

          {/* AQUÍ SE RENDERIZAN TUS PÁGINAS (Dashboard, XV Años, etc.) */}
          <div className="flex-1 overflow-y-auto p-0 pb-20 md:pb-0 scroll-smooth">
             {children} 
          </div>

        </main>

        {/* 3. BOTTOM NAV (Solo Móvil) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
           <BottomNav />
        </div>

      </div>
    </SidebarProvider>
  );
}