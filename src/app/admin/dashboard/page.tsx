"use client";
import { useState } from "react";
import RegistrarVisitanteModal from "@/components/admin/RegistrarVisitanteModal";

export default function AdminDashboard() {
  // --- ESTADOS ---
  const [studentId, setStudentId] = useState("");
  const [isModalOpen, setModalOpen] = useState(false); // Solo controlamos abrir/cerrar

  // --- LÓGICA DEL TECLADO ---
  const handleKeypadClick = (key: string | number) => {
    if (key === "C") setStudentId("");
    else if (key === "OK") {
       if(['101','102','103'].includes(studentId)) alert(`✅ Alumno ${studentId} encontrado. Redirigiendo...`);
       else alert("❌ ID no encontrado. Intenta 101, 102 o 103.");
    } 
    else setStudentId((prev) => prev + key.toString());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full p-4">
        
        <div className="w-full max-w-xs sm:max-w-sm space-y-8">
            
            {/* 1. INPUT BUSCADOR */}
            <div className="space-y-4">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Buscar Alumno (ID)" 
                        className="w-full h-14 pl-4 pr-20 rounded-2xl bg-[#111827] text-white border border-gray-700 focus:border-[#FF3888] outline-none placeholder-gray-500 transition-all shadow-lg"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-14 bg-[#1E293B] border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
                        <i className="fas fa-qrcode"></i>
                    </button>
                </div>

                {/* 2. TECLADO NUMÉRICO */}
                <div>
                    <p className="text-center mb-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Ingreso Rápido</p>
                    <div className="grid grid-cols-3 gap-3">
                        {[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(key => {
                            // Estilos base
                            let btnClass = "bg-[#1E293B] hover:bg-gray-700 text-white border border-gray-700 shadow-md";
                            
                            // Estilos especiales
                            if (key === 'OK') btnClass = "bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white border-none shadow-lg shadow-pink-900/40";
                            if (key === 'C') btnClass = "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40";

                            return (
                                <button 
                                    key={key}
                                    onClick={() => handleKeypadClick(key)}
                                    className={`rounded-2xl text-xl font-bold py-4 transition-all active:scale-95 flex items-center justify-center ${btnClass}`}
                                >
                                    {key}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 3. SEPARADOR */}
            <div className="flex items-center justify-center opacity-50">
                <span className="h-px w-full bg-gray-700"></span>
                <span className="mx-4 text-gray-500 text-xs font-bold uppercase">Accesos</span>
                <span className="h-px w-full bg-gray-700"></span>
            </div>

            {/* 4. BOTÓN REGISTRAR VISITANTE */}
            <button 
                onClick={() => setModalOpen(true)}
                className="w-full h-14 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-[0.98]"
            >
                <i className="fas fa-user-clock mr-2"></i> Registrar Visitante
            </button>
        </div>

        {/* --- COMPONENTE DEL MODAL (Limpio y separado) --- */}
        <RegistrarVisitanteModal 
            isOpen={isModalOpen} 
            onClose={() => setModalOpen(false)} 
        />
        
    </div>
  );
}