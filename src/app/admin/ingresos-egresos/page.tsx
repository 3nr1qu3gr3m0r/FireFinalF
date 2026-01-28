"use client";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";

export default function RegisterMovementPage() {
  const [activeType, setActiveType] = useState<'ingreso' | 'egreso'>('egreso'); // 'gasto' en tu maqueta es 'egreso'
  const [expenseType, setExpenseType] = useState<'otro' | 'maestro'>('otro');
  
  const [formData, setFormData] = useState({
    teacherName: '',
    description: '',
    amount: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' as any });

  const showAlert = (msg: string, type = 'success') => {
      setAlert({ show: true, msg, type: type as any });
      setTimeout(() => setAlert(prev => ({...prev, show: false})), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validaciones
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
          showAlert("El monto debe ser mayor a 0", "warning");
          return;
      }

      let finalDescription = formData.description;
      if (activeType === 'egreso' && expenseType === 'maestro') {
          if (!formData.teacherName.trim()) {
              showAlert("Escribe el nombre del maestro", "warning");
              return;
          }
          finalDescription = `Pago a Maestro: ${formData.teacherName}`;
      } else {
          if (!formData.description.trim()) {
              showAlert("Escribe una descripción", "warning");
              return;
          }
      }

      setLoading(true);
      try {
          await fetchWithAuth('/movements', {
              method: 'POST',
              body: JSON.stringify({
                  tipo: activeType, // 'ingreso' o 'egreso'
                  monto: parseFloat(formData.amount),
                  descripcion: finalDescription
              })
          });

          showAlert(`✅ ${activeType === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado correctamente`, "success");
          
          // Reset del formulario
          setFormData({ teacherName: '', description: '', amount: '' });
          setExpenseType('otro');

      } catch (error: any) {
          console.error(error);
          showAlert(error.message || "Error al registrar", "error");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="pb-32 min-h-screen bg-[#111827] flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-md">
            <div className="bg-[#1F2937] p-8 rounded-2xl border border-gray-700 shadow-2xl">
                <h2 className="text-2xl font-bold text-white text-center mb-6">Registrar Movimiento</h2>

                {/* Selector Tipo */}
                <div className="bg-[#111827] p-1 rounded-lg flex mb-6">
                    <button 
                        type="button"
                        onClick={() => setActiveType('egreso')}
                        className={`flex-1 py-3 rounded-md text-sm font-bold transition-all ${activeType === 'egreso' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Gasto
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveType('ingreso')}
                        className={`flex-1 py-3 rounded-md text-sm font-bold transition-all ${activeType === 'ingreso' ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Ingreso Extra
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Campos de Gasto */}
                    {activeType === 'egreso' && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tipo de Gasto</label>
                            <select 
                                value={expenseType}
                                onChange={(e) => setExpenseType(e.target.value as any)}
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-3 text-white focus:border-[#FF3888] outline-none transition-colors appearance-none cursor-pointer"
                            >
                                <option value="otro">Otro Concepto</option>
                                <option value="maestro">Pago a Maestro</option>
                            </select>
                        </div>
                    )}

                    {/* Nombre Maestro (Solo si es pago a maestro) */}
                    {activeType === 'egreso' && expenseType === 'maestro' ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nombre del Maestro</label>
                            <input 
                                type="text"
                                value={formData.teacherName}
                                onChange={(e) => setFormData({...formData, teacherName: e.target.value})}
                                placeholder="Nombre completo"
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Descripción</label>
                            <input 
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={activeType === 'ingreso' ? "Ej: Venta de agua, Renta de salón..." : "Ej: Pago de luz, Artículos de limpieza..."}
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                            />
                        </div>
                    )}

                    {/* Monto */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Monto</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
                            <input 
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                placeholder="0.00"
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-3 pl-8 text-white focus:border-[#FF3888] outline-none transition-colors font-mono font-bold text-lg"
                            />
                        </div>
                    </div>

                    {/* Botón Submit */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2
                            ${activeType === 'egreso' 
                                ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:shadow-pink-500/40' 
                                : 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-green-500/40'
                            }
                        `}
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : `Registrar ${activeType === 'egreso' ? 'Gasto' : 'Ingreso'}`}
                    </button>

                </form>
            </div>
        </div>

        <CustomAlert isVisible={alert.show} message={alert.msg} type={alert.type} onClose={() => setAlert(prev => ({...prev, show: false}))} />
        <BottomNav />
    </div>
  );
}