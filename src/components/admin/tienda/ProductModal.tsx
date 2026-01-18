"use client";
import { useState, useEffect } from "react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any | null;
  // 👇 Nueva prop para mandar alertas al padre
  onShowAlert: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export default function ProductModal({ isOpen, onClose, onSubmit, initialData, onShowAlert }: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    tienda: "academia"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        precio: initialData.precio, // Asumiendo que viene como string o number
        tienda: initialData.tienda
      });
    } else {
      setFormData({ nombre: "", precio: "", tienda: "academia" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDACIÓN MANUAL (Reemplaza la del navegador)
    if (!formData.nombre.trim()) {
        onShowAlert("El nombre del producto es obligatorio.", "warning");
        return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
        onShowAlert("El precio debe ser mayor a 0.", "warning");
        return;
    }

    setLoading(true);
    // Convertimos y enviamos
    await onSubmit({
        ...formData,
        precio: parseFloat(formData.precio)
    });
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-[#1E293B] rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* 👇 'noValidate' apaga los globos de HTML del navegador */}
        <form onSubmit={handleSubmit} noValidate>
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white tracking-wide">
                {initialData ? "Modificar Producto" : "Agregar Producto"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Nombre del Producto</label>
              <input 
                type="text" 
                // Quitamos 'required' aquí porque ya validamos manualmente, o lo dejamos pero 'noValidate' del form lo ignora visualmente
                className="w-full h-12 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none transition-all placeholder-gray-600"
                placeholder="Ej: Top Deportivo"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Precio ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full h-12 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none transition-all placeholder-gray-600"
                placeholder="0.00"
                value={formData.precio}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                        setFormData({...formData, precio: val});
                    }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Tienda</label>
              <select 
                className="w-full h-12 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none transition-all appearance-none cursor-pointer"
                value={formData.tienda}
                onChange={(e) => setFormData({...formData, tienda: e.target.value})}
              >
                <option value="academia">Academia</option>
                <option value="sens">SENS</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 bg-[#111827]/50 rounded-b-2xl">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:shadow-lg hover:shadow-pink-900/40 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <i className="fas fa-circle-notch fa-spin"></i> Guardando...
                    </span>
                ) : (
                    "Guardar Producto"
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}