"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// 🧹 Eliminamos 'js-cookie' (El Middleware protege la ruta)
import RegistrarVisitanteModal from "@/components/admin/RegistrarVisitanteModal";
import CustomAlert from "@/components/ui/CustomAlert"; 
import { fetchWithAuth } from "@/lib/api"; 

export default function AdminDashboard() {
  const router = useRouter();
  
  const [studentId, setStudentId] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertState, setAlertState] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ isVisible: false, message: "", type: "error" });

  const showAlert = (message: string, type: "success" | "error" | "warning") => {
    setAlertState({ isVisible: true, message, type });
  };

  // 🧹 Eliminamos el useEffect de validación de rol.
  // Si el usuario ve esta pantalla, es porque el Middleware ya lo autorizó.

  // --- LÓGICA DE BÚSQUEDA ---
  const handleSearch = async () => {
    if (!studentId.trim()) return;

    setLoading(true);
    try {
        let targetId = studentId;
        
        // ✅ fetchWithAuth ya maneja el token y devuelve la data
        const data = await fetchWithAuth(`/users/${targetId}`);
        
        if (data && data.id) {
            // 🔒 SEGURIDAD: Mensaje Genérico
            // Si el ID existe pero NO es alumno (ej: es admin), no revelamos qué es.
            if (data.rol !== 'alumno') {
                showAlert("El ID ingresado no pertenece a un alumno válido.", "warning");
                setLoading(false);
                return;
            }
            // Si es alumno, procedemos
            router.push(`/admin/students/${data.id}`);
        } else {
            showAlert("Usuario no encontrado.", "error");
        }
    } catch (error: any) {
        console.error("Error buscando alumno:", error);
        // Mensaje genérico para no dar pistas en caso de error
        showAlert("No se pudo encontrar un alumno con ese ID.", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleKeypadClick = (key: string | number) => {
    if (key === "C") {
        setStudentId("");
    } else if (key === "OK") {
        handleSearch();
    } else {
        setStudentId((prev) => prev + key.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full p-6 animate-fade-in">
        
        <div className="w-full max-w-xs sm:max-w-sm space-y-6">
            
            {/* INPUT BUSCADOR */}
            <div className="space-y-4">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Buscar Alumno (ID)" 
                        className="w-full h-14 pl-4 pr-20 rounded-2xl bg-[#111827] text-white border border-gray-700 focus:border-[#FF3888] outline-none placeholder-gray-500 transition-all shadow-lg text-lg"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button 
                        onClick={() => showAlert("Funcionalidad QR en desarrollo", "warning")} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-14 bg-[#1E293B] border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                    >
                        <i className="fas fa-qrcode"></i>
                    </button>
                </div>

                {/* TECLADO */}
                <div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(key => {
                            let btnClass = "bg-[#1E293B] hover:bg-gray-700 text-white border border-gray-700 shadow-md";
                            
                            if (key === 'OK') btnClass = "bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white border-none shadow-lg shadow-pink-900/40";
                            if (key === 'C') btnClass = "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40";

                            return (
                                <button 
                                    key={key}
                                    onClick={() => handleKeypadClick(key)}
                                    disabled={loading}
                                    className={`rounded-2xl text-xl font-bold py-4 transition-all active:scale-95 flex items-center justify-center ${btnClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading && key === 'OK' ? <i className="fas fa-spinner fa-spin"></i> : key}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* SEPARADOR */}
            <div className="flex items-center justify-center opacity-50">
                <span className="h-px w-full bg-gray-700"></span>
                <span className="mx-4 text-gray-500 text-xs font-bold uppercase">Accesos</span>
                <span className="h-px w-full bg-gray-700"></span>
            </div>

            {/* BOTÓN REGISTRAR VISITANTE */}
            <button 
                onClick={() => setModalOpen(true)}
                className="w-full h-14 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-[0.98]"
            >
                <i className="fas fa-user-clock mr-2"></i> Registrar Visitante
            </button>
        </div>

        {/* MODALES Y ALERTAS */}
        <RegistrarVisitanteModal 
            isOpen={isModalOpen} 
            onClose={() => setModalOpen(false)} 
        />

        <CustomAlert 
            isVisible={alertState.isVisible} 
            message={alertState.message} 
            type={alertState.type} 
            onClose={() => setAlertState(prev => ({ ...prev, isVisible: false }))} 
        />
        
    </div>
  );
}