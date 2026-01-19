"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import BottomNav from "@/components/admin/BottomNav";
import PlanModal from "@/components/admin/plans/PlanModal";
import CustomAlert from "@/components/ui/CustomAlert";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface PlanItem {
  id: number;
  nombre: string;
  precio: number;
  vigencia_dias: number;
  cantidad_clases: number;
  clases_incluidas: any[];
}

export default function PaquetesPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: 0 });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' as any });

  const showAlert = (message: string, type = 'success') => {
    setAlert({ show: true, message, type: type as any });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`); // Asegúrate de crear este endpoint
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async (data: any) => {
    const token = Cookies.get("token");
    const method = editingPlan ? "PUT" : "POST";
    const url = editingPlan 
        ? `${process.env.NEXT_PUBLIC_API_URL}/plans/${editingPlan.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/plans`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            fetchPlans();
            setIsModalOpen(false);
            setEditingPlan(null);
            showAlert(editingPlan ? "Plan actualizado" : "Plan creado", "success");
        } else {
            const errorData = await res.json();
            const msg = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message || "Error al guardar";
            showAlert(msg, "error");
        }
    } catch (e) { showAlert("Error de conexión", "error"); }
  };

  const handleDelete = async () => {
    const token = Cookies.get("token");
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${confirmModal.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        setPlans(plans.filter(p => p.id !== confirmModal.id));
        showAlert("Plan eliminado", "success");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="pb-32 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-wide">Planes Registrados</h2>
        <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold border border-gray-700">
           {plans.length} Planes
        </span>
      </div>

      {loading ? (
        <p className="text-white text-center mt-10">Cargando planes...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {plans.map((pkg) => (
                <div key={pkg.id} className="bg-[#1E293B] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-gray-800">
                    <div className="p-5 flex-1">
                        <h3 className="font-bold text-lg text-white leading-tight mb-2">{pkg.nombre}</h3>
                        <p className="text-[#FF3888] font-bold text-2xl mb-4">${Number(pkg.precio).toFixed(2)}</p>
                        
                        <div className="space-y-3 text-sm text-gray-300 border-t border-gray-700/50 pt-3">
                            <p className="flex items-center gap-2">
                                <i className="fas fa-graduation-cap text-[#C4006B]"></i>
                                {pkg.cantidad_clases > 900 ? 'Ilimitadas' : `${pkg.cantidad_clases} Clases`}
                            </p>
                            <p className="flex items-center gap-2">
                                <i className="far fa-calendar-alt text-[#C4006B]"></i>
                                Vigencia de {pkg.vigencia_dias} días
                            </p>
                            {/* Mostrar resumen de clases incluidas (ej: las primeras 2) */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {pkg.clases_incluidas.slice(0, 3).map((c: any) => (
                                    <span key={c.id} className="text-[10px] bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">{c.nombre}</span>
                                ))}
                                {pkg.clases_incluidas.length > 3 && (
                                    <span className="text-[10px] text-gray-500">+{pkg.clases_incluidas.length - 3} más</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-gray-700/50 divide-x divide-gray-700/50 bg-[#17202e]">
                        <button onClick={() => { setEditingPlan(pkg); setIsModalOpen(true); }} className="py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            <i className="fas fa-pencil-alt text-xs"></i> Editar
                        </button>
                        <button onClick={() => setConfirmModal({ isOpen: true, id: pkg.id })} className="py-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            <i className="fas fa-trash-alt text-xs"></i> Eliminar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }} className="fixed bottom-24 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white text-xl md:text-2xl shadow-xl shadow-pink-900/50 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center z-30 group">
        <i className="fas fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
      </button>

      {/* MODALES */}
      <PlanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave} 
        initialData={editingPlan}
        onShowAlert={showAlert}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleDelete}
        title="¿Eliminar plan?"
        message="Esta acción no se puede deshacer."
      />

      <CustomAlert isVisible={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, show: false }))} />
      
      <BottomNav />
    </div>
  );
}