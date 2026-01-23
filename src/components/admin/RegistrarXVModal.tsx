"use client";
import { useState, useEffect } from "react";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomAlert from "@/components/ui/CustomAlert";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; fecha: string; total: number }) => void;
  initialData?: any; // 👇 Nueva prop para editar
}

export default function RegistrarXVModal({ isOpen, onClose, onSave, initialData }: ModalProps) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [total, setTotal] = useState("");
  
  const [alertInfo, setAlertInfo] = useState<{ show: boolean, msg: string, type: 'error' | 'success' | 'warning' }>({ show: false, msg: '', type: 'error' });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
          // 👇 Cargar datos si es edición
          setNombre(initialData.studentName || initialData.quinceanera_nombre || "");
          const rawDate = initialData.eventDate || initialData.fecha_evento;
          setFecha(rawDate ? String(rawDate).split('T')[0] : "");
          setTotal(initialData.contractTotal || "");
      } else {
          // Limpiar si es nuevo
          setNombre("");
          setFecha("");
          setTotal("");
      }
    }
  }, [isOpen, initialData]);

  const showAlert = (msg: string, type: 'error' | 'success' | 'warning' = 'error') => {
      setAlertInfo({ show: true, msg, type });
      setTimeout(() => setAlertInfo(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fecha || !total) return;

    // --- VALIDACIONES ORIGINALES (Respetadas) ---
    const selectedDate = new Date(fecha + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Permitimos editar fechas pasadas si ya estaban guardadas, pero si es nuevo validamos
    if (!initialData && selectedDate < today) {
        showAlert("La fecha del evento no puede ser en el pasado.", "error");
        return;
    }

    const totalNum = parseFloat(total);

    if (totalNum < 0.01) {
        showAlert("El costo es demasiado bajo (mínimo $0.01).", "warning");
        return;
    }

    if (totalNum > 99999999) {
        showAlert("El costo excede el límite permitido.", "warning");
        return;
    }
    
    onSave({ 
        nombre, 
        fecha, 
        total: Math.round(totalNum * 100) / 100 
    });
    
    // onClose se llama en el padre (page.tsx) tras guardar, pero aquí también está bien
    // onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[110]">
          <CustomAlert isVisible={alertInfo.show} message={alertInfo.msg} type={alertInfo.type} onClose={() => setAlertInfo(prev => ({...prev, show: false}))} />
      </div>

      <div className="bg-[#111827] w-full h-[100dvh] sm:h-auto sm:max-w-lg flex flex-col rounded-none sm:rounded-3xl border-0 sm:border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        
        {/* HEADER MODIFICADO PARA REFLEJAR EDICIÓN */}
        <div className="bg-[#1F2937] px-6 py-5 border-b border-gray-700 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF3888]/20 flex items-center justify-center border border-[#FF3888]/30 text-[#FF3888]">
                        <i className={`fas ${initialData ? 'fa-pencil-alt' : 'fa-file-signature'}`}></i>
                    </div>
                    {initialData ? "Editar Contrato" : "Nuevo Contrato"}
                </h2>
                <p className="text-gray-400 text-xs mt-1 ml-12">
                    {initialData ? "Modificar datos del evento" : "Datos iniciales del evento"}
                </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full text-gray-400 hover:text-white active:scale-95 transition-all">
                <i className="fas fa-times text-lg"></i>
            </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120] custom-scrollbar">
            <form id="registro-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre Quinceañera</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF3888] transition-colors pointer-events-none">
                            <i className="fas fa-user"></i>
                        </span>
                        <input 
                            type="text" required 
                            className="w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl pl-11 pr-4 h-14 text-white placeholder-gray-600 focus:border-[#FF3888] focus:bg-[#1F2937] outline-none transition-all"
                            placeholder="Ej. Sofía Martínez" 
                            value={nombre} onChange={e => setNombre(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="space-y-2 relative z-20"> 
                     <CustomDatePicker label="Fecha del Evento" value={fecha} onChange={(date) => setFecha(date)} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Costo Paquete General</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 font-bold text-lg pointer-events-none transition-colors">$</span>
                        <input 
                            type="number" required inputMode="decimal"
                            className="w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl pl-11 pr-4 h-14 text-lg font-bold text-white placeholder-gray-600 focus:border-green-500 focus:bg-[#1F2937] outline-none transition-all"
                            placeholder="0.00" 
                            value={total} onChange={e => setTotal(e.target.value)} 
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 text-right pr-1">* Deuda total inicial</p>
                </div>

                <div className="h-10 sm:h-0"></div>
            </form>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-700 bg-[#1F2937] shrink-0 pb-8 sm:pb-5 z-10 shadow-[-5px_0_20px_rgba(0,0,0,0.5)]">
             <button 
                type="submit" form="registro-form"
                className="w-full h-14 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-lg shadow-pink-900/30 hover:shadow-pink-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <i className={`fas ${initialData ? 'fa-save' : 'fa-check'}`}></i> 
                {initialData ? "Guardar Cambios" : "Crear Contrato"}
            </button>
        </div>

      </div>
    </div>
  );
}