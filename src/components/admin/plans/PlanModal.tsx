"use client";
import { useState, useEffect, useRef } from "react";
// 👇 Importamos fetchWithAuth
import { fetchWithAuth } from "@/lib/api";

interface ClassItem {
  id: number;
  nombre: string;
  nivel: string;
  maestro: string;       
  hora: string;          
  fecha_inicio: string;  
  dias_repeticion: number; 
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any | null;
  onShowAlert: (msg: string, type: 'success'|'error'|'warning') => void;
}

const LEVEL_COLORS: any = {
  iniciacion: '#8B5CF6',
  principiante: '#10B981',
  multinivel: '#3B82F6',
  intermedio: '#F59E0B',
  avanzado: '#F97316',
  especial: '#EF4444',
};

const LEVEL_LABELS: any = {
  iniciacion: 'Iniciación',
  principiante: 'Principiante',
  multinivel: 'Multinivel',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  especial: 'Especial',
};

export default function PlanModal({ isOpen, onClose, onSubmit, initialData, onShowAlert }: PlanModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    cantidad_clases: "",
    vigencia_dias: "30",
  });
  
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<ClassItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar clases usando fetchWithAuth
  useEffect(() => {
    const fetchClasses = async () => {
        try {
            // 👇 CORRECCIÓN: Usamos fetchWithAuth
            const data = await fetchWithAuth('/classes');
            if (Array.isArray(data)) {
                setAllClasses(data);
            }
        } catch (e) { 
            console.error("Error cargando clases", e); 
        }
    };
    if (isOpen) fetchClasses();
  }, [isOpen]);

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        precio: initialData.precio,
        cantidad_clases: initialData.cantidad_clases,
        vigencia_dias: initialData.vigencia_dias,
      });
      // Mapeamos clases_incluidas o clases (según venga del backend)
      if (initialData.clases_incluidas) setSelectedClasses(initialData.clases_incluidas);
      else if (initialData.clases) setSelectedClasses(initialData.clases);
    } else {
      setFormData({ nombre: "", precio: "", cantidad_clases: "", vigencia_dias: "30" });
      setSelectedClasses([]);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClasses = allClasses.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedClasses.some(sel => sel.id === c.id)
  );

  const preventNonIntegers = (e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',' || e.key === 'e') {
        e.preventDefault();
    }
  };

  const formatSchedule = (cls: ClassItem) => {
    if (!cls.hora || !cls.fecha_inicio) return "";
    
    const [h, m] = cls.hora.split(':');
    const timeStr = new Date(0, 0, 0, +h, +m).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

    const date = new Date(cls.fecha_inicio + 'T00:00:00');
    
    if (cls.dias_repeticion > 0) {
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${timeStr}`;
    } else {
        const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        return `${dateStr} - ${timeStr}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDACIONES INTACTAS ---
    if (!formData.nombre.trim()) return onShowAlert("El nombre del plan es obligatorio", "warning");
    if (Number(formData.precio) <= 0) return onShowAlert("El precio debe ser mayor a 0", "warning");
    
    if (!Number.isInteger(Number(formData.cantidad_clases)) || Number(formData.cantidad_clases) <= 0) {
        return onShowAlert("La cantidad de clases debe ser un número entero mayor a 0", "warning");
    }
    if (!Number.isInteger(Number(formData.vigencia_dias)) || Number(formData.vigencia_dias) <= 0) {
        return onShowAlert("La vigencia debe ser un número entero de días", "warning");
    }

    if (selectedClasses.length === 0) return onShowAlert("Debes incluir al menos una clase", "warning");

    setLoading(true);
    const payload = {
        ...formData,
        precio: Number(formData.precio),
        cantidad_clases: parseInt(formData.cantidad_clases),
        vigencia_dias: parseInt(formData.vigencia_dias),
        clasesIds: selectedClasses.map(c => c.id) 
    };

    // Llamamos al onSubmit del padre (que ahora usa fetchWithAuth)
    await onSubmit(payload);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#1E293B] rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
                {initialData ? "Modificar Plan" : "Nuevo Plan"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-5">
            <form id="plan-form" onSubmit={handleSubmit} noValidate>
                
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Nombre del Plan</label>
                    <input type="text" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600 focus:bg-[#0f1623] transition-colors"
                        placeholder="Ej: Plan Básico Mensual"
                        value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Precio ($)</label>
                        <input type="number" step="0.01" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600"
                            placeholder="0.00"
                            value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Clases que cubre</label>
                        <input type="number" step="1" onKeyDown={preventNonIntegers} className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600"
                            placeholder="Ej: 8"
                            value={formData.cantidad_clases} onChange={e => setFormData({...formData, cantidad_clases: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Vigencia (días)</label>
                    <input type="number" step="1" onKeyDown={preventNonIntegers} className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600"
                        value={formData.vigencia_dias} onChange={e => setFormData({...formData, vigencia_dias: e.target.value})} />
                </div>

                {/* SELECTOR DE CLASES */}
                <div ref={dropdownRef} className="relative group">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Clases Incluidas</label>
                    
                    <div className="bg-[#111827] border border-gray-700 rounded-xl p-2 min-h-[52px] focus-within:border-[#FF3888] transition-colors flex flex-wrap gap-2 items-center"
                         onClick={() => {
                            if (!showDropdown) setShowDropdown(true);
                            const input = document.getElementById('search-classes-input');
                            if (input) input.focus();
                         }}
                    >
                        {selectedClasses.map(cls => (
                            <div key={cls.id} className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm animate-in zoom-in duration-200 border border-white/10"
                                style={{ backgroundColor: `${LEVEL_COLORS[cls.nivel]}40` }}
                            >
                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: LEVEL_COLORS[cls.nivel] }}></div>
                                <span>{cls.nombre}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedClasses(selectedClasses.filter(c => c.id !== cls.id)); }} 
                                    className="hover:text-[#FF3888] hover:bg-white/10 rounded-full w-5 h-5 flex items-center justify-center transition-colors text-base ml-1">
                                    &times;
                                </button>
                            </div>
                        ))}

                        <input 
                            id="search-classes-input"
                            type="text" 
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 min-w-[150px] h-8 px-1"
                            placeholder={selectedClasses.length === 0 ? "Buscar clases..." : ""}
                            value={searchTerm}
                            onFocus={() => setShowDropdown(true)}
                            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                        />
                    </div>

                    {showDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1E293B] border border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 custom-scrollbar ring-1 ring-black/50">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map(cls => (
                                    <div key={cls.id} onClick={() => { setSelectedClasses([...selectedClasses, cls]); setSearchTerm(""); setShowDropdown(false); }}
                                        className="px-4 py-3 hover:bg-[#111827] cursor-pointer border-b border-gray-800 last:border-0 flex justify-between items-start group/item transition-all"
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-1 h-10 rounded-full mt-1" style={{ backgroundColor: LEVEL_COLORS[cls.nivel] }}></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 group-hover/item:text-white transition-colors leading-tight">
                                                    {cls.nombre}
                                                </p>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 group-hover/item:text-gray-300">
                                                        <i className="fas fa-chalkboard-teacher text-[10px] w-3"></i> 
                                                        <span>{cls.maestro}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-[#C4006B] font-medium">
                                                        <i className="far fa-clock text-[10px] w-3"></i> 
                                                        <span>{formatSchedule(cls)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                                {LEVEL_LABELS[cls.nivel]}
                                            </span>
                                            <i className="fas fa-plus text-gray-600 group-hover/item:text-[#FF3888] transition-colors"></i>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-sm text-gray-500 text-center flex flex-col items-center">
                                    <i className="far fa-sad-tear text-2xl mb-2 opacity-50"></i>
                                    No se encontraron clases
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </form>
        </div>

        <div className="p-6 border-t border-gray-700 bg-[#1E293B] rounded-b-2xl sticky bottom-0 z-30">
            <button type="submit" form="plan-form" disabled={loading} className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]">
                {loading ? "Guardando..." : "Guardar Plan"}
            </button>
        </div>

      </div>
    </div>
  );
}