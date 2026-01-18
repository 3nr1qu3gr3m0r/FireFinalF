"use client";
import { useState, useEffect } from "react";
import ImageUploader from "@/components/ui/ImageUploader";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomTimePicker from "@/components/ui/CustomTimePicker";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any | null;
  onShowAlert: (msg: string, type: 'success'|'error'|'warning') => void;
}

export default function ClassModal({ isOpen, onClose, onSubmit, initialData, onShowAlert }: ClassModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    maestro: "",
    precio: "",
    fecha_inicio: "",
    hora: "",
    nivel: "multinivel",
    dias_repeticion: 7,
    imagen: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        descripcion: initialData.descripcion,
        maestro: initialData.maestro,
        precio: initialData.precio,
        fecha_inicio: initialData.fecha_inicio,
        hora: initialData.hora,
        nivel: initialData.nivel,
        dias_repeticion: initialData.dias_repeticion,
        imagen: initialData.imagen || ""
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ 
          nombre: "", descripcion: "", maestro: "", precio: "",
          fecha_inicio: today, hora: "18:00", 
          nivel: "multinivel", dias_repeticion: 7, imagen: "" 
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return onShowAlert("El nombre es obligatorio.", "warning");
    if (!formData.maestro.trim()) return onShowAlert("Debes asignar un maestro.", "warning");
    
    const precioNum = parseFloat(formData.precio);
    if (!formData.precio || isNaN(precioNum) || precioNum <= 0) return onShowAlert("El precio debe ser mayor a $0.", "warning");
    if (!formData.fecha_inicio) return onShowAlert("Selecciona una fecha de inicio.", "warning");
    if (!formData.hora) return onShowAlert("Selecciona una hora.", "warning");

    setLoading(true);
    await onSubmit({
        ...formData,
        precio: Math.round(precioNum * 100) / 100,
        dias_repeticion: Number(formData.dias_repeticion)
    });
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#1E293B] rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-[#1E293B] rounded-t-2xl z-20">
            <h2 className="text-xl font-bold text-white">
                {initialData ? "Modificar Clase" : "Agregar Clase"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
            </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 relative">
            <form onSubmit={handleSubmit} noValidate>
              
              <div className="p-6 space-y-4">
                <ImageUploader 
                    currentImage={formData.imagen} 
                    onImageUploaded={(url) => setFormData(prev => ({ ...prev, imagen: url }))} 
                />

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Nombre de la Clase</label>
                  <input type="text" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600 transition-colors focus:bg-[#1f2937]"
                    placeholder="Ej: Hip Hop Coreográfico"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Maestro</label>
                        <input type="text" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600 transition-colors focus:bg-[#1f2937]"
                            placeholder="Ej: Ana Pérez"
                            value={formData.maestro} onChange={e => setFormData({...formData, maestro: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Precio ($)</label>
                        <input 
                            type="number" step="0.01" 
                            className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none placeholder-gray-600 transition-colors focus:bg-[#1f2937]"
                            placeholder="0.00"
                            value={formData.precio} 
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) >= 0) setFormData({...formData, precio: val})
                            }} 
                        />
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Descripción Breve</label>
                  <textarea rows={2} className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-[#FF3888] outline-none resize-none placeholder-gray-600 transition-colors focus:bg-[#1f2937]"
                    placeholder="¿De qué trata la clase?"
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 👇 Aquí usamos direction="up" para que abran hacia arriba */}
                    <div className="relative z-10">
                        <CustomDatePicker 
                            label="Fecha Inicio"
                            value={formData.fecha_inicio}
                            onChange={(date) => setFormData({...formData, fecha_inicio: date})}
                            direction="up" 
                        />
                    </div>
                    <div className="relative z-20">
                        <CustomTimePicker 
                            label="Hora"
                            value={formData.hora}
                            onChange={(time) => setFormData({...formData, hora: time})}
                            direction="up"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-0">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Nivel</label>
                        <select className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none cursor-pointer"
                            value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})}>
                            <option value="iniciacion">Iniciación</option>
                            <option value="principiante">Principiante</option>
                            <option value="multinivel">Multinivel</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                            <option value="especial">Compañía/Especial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Repetir (días)</label>
                        <input type="number" min="0" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none"
                            value={formData.dias_repeticion} onChange={e => setFormData({...formData, dias_repeticion: Number(e.target.value)})} />
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-right">0 = Una vez, 7 = Semanal, 14 = Quincenal</p>

              </div>

              {/* Footer Sticky */}
              <div className="p-6 border-t border-gray-700 bg-[#1E293B] rounded-b-2xl sticky bottom-0 z-30">
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]">
                   {loading ? "Guardando..." : "Guardar Clase"}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}