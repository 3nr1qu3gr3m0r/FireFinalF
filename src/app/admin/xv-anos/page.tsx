"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 
import RegistrarXVModal from "@/components/admin/RegistrarXVModal";
import GestionarXVModal from "@/components/admin/GestionarXVModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // 👇 Nuevo
import { fetchWithAuth } from "@/lib/api"; // 👇 Usamos el cliente seguro
import { XvContract } from "@/types/xv-anos";

export default function XVAnosPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<XvContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'history'>('active');
  
  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<XvContract | null>(null);
  
  // 👇 Estados nuevos para Editar/Eliminar
  const [editingContract, setEditingContract] = useState<XvContract | null>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '' });

  const fetchContracts = async () => {
    try {
      // 👇 Cambio a fetchWithAuth
      const data = await fetchWithAuth('/xv-anos');
      
      // La API ya devuelve JSON, no necesitamos .json() extra si usas el api.ts del proyecto
      const formattedData = Array.isArray(data) ? data.map((c: any) => ({
        ...c,
        contractTotal: Number(c.contractTotal),
        concepts: c.concepts.map((conc: any) => ({
            ...conc,
            realCost: Number(conc.realCost),
            clientCost: Number(conc.clientCost),
            paid: Number(conc.paid)
        })),
        payments: c.payments.map((p: any) => ({
            ...p,
            amount: Number(p.amount)
        }))
      })) : [];
      
      setContracts(formattedData);
    } catch (error: any) { 
      console.error(error); 
      // Redirección de seguridad
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
         router.push('/admin/dashboard'); 
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  // 👇 Maneja CREAR y EDITAR
  const handleSaveContract = async (data: { nombre: string; fecha: string; total: number }) => {
    try {
        const method = editingContract ? "PATCH" : "POST";
        const endpoint = editingContract 
            ? `/xv-anos/${editingContract.id}` 
            : `/xv-anos`;

        await fetchWithAuth(endpoint, {
          method: method,
          body: JSON.stringify({ 
              studentName: data.nombre, 
              date: data.fecha, 
              contractTotal: data.total 
          }),
        });

        fetchContracts(); 
        setIsNewModalOpen(false);
        setEditingContract(null); // Limpiamos edición
      } catch (error) { alert("Error al procesar la solicitud"); }
  };

  // 👇 Maneja ELIMINAR
  const handleDelete = async () => {
    try {
        await fetchWithAuth(`/xv-anos/${deleteModal.id}`, { method: 'DELETE' });
        setContracts(prev => prev.filter(c => c.id !== deleteModal.id));
    } catch (error) {
        alert("No se pudo eliminar el contrato");
    } finally {
        setDeleteModal({ isOpen: false, id: '' });
    }
  };

  const handleUpdateContract = (updated: XvContract) => {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedContract(updated);
  };

  // --- TU FILTRO ORIGINAL (RESPETADO) ---
  const filteredContracts = contracts.filter(contract => {
    const totalPaid = contract.concepts.reduce((sum, c) => sum + Number(c.paid), 0);
    const isFullyPaid = totalPaid >= contract.contractTotal;
    // Fix: Aseguramos que eventDate sea string válido
    const dateStr = contract.eventDate ? String(contract.eventDate) : new Date().toISOString(); 
    const eventDate = new Date(dateStr.includes('T') ? dateStr : dateStr + "T00:00:00");
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const isEventPast = eventDate < today;

    if (view === 'active') return !isFullyPaid || !isEventPast;
    return isFullyPaid && isEventPast;
  });

  if (loading) return <div className="p-8 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#0A1D37]"> 
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* BARRA DE ACCIONES */}
        <div className="hidden md:flex flex-row items-center justify-end gap-4 mb-6">
           <div className="flex items-center gap-4">
              <div className="bg-[#111827] p-1 rounded-xl flex border border-gray-700">
                  <button onClick={() => setView('active')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'active' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Activos</button>
                  <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Historial</button>
              </div>
              <button onClick={() => { setEditingContract(null); setIsNewModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center shadow-lg shadow-blue-900/20">
                  <i className="fas fa-plus mr-2"></i> Nuevo
              </button>
           </div>
        </div>

        {/* CONTROLES MÓVILES */}
        <div className="md:hidden flex gap-3 mb-2">
            <div className="bg-[#111827] p-1 rounded-xl flex border border-gray-700 flex-1">
                  <button onClick={() => setView('active')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${view === 'active' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500'}`}>Activos</button>
                  <button onClick={() => setView('history')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${view === 'history' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500'}`}>Historial</button>
            </div>
            <button onClick={() => { setEditingContract(null); setIsNewModalOpen(true); }} className="bg-blue-600 text-white w-14 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
                  <i className="fas fa-plus text-xl"></i>
            </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0">
          {filteredContracts.map(contract => {
              const totalToPay = contract.contractTotal;
              const totalPaid = contract.concepts.reduce((sum, c) => sum + Number(c.paid), 0);
              const remaining = totalToPay - totalPaid;
              const progress = totalToPay > 0 ? (totalPaid / totalToPay) * 100 : 0;
              
              const dateStr = contract.eventDate ? String(contract.eventDate) : new Date().toISOString();
              const eventDate = new Date(dateStr.includes('T') ? dateStr : dateStr + "T00:00:00");
              const today = new Date();
              today.setHours(0,0,0,0);
              const isEventPast = eventDate < today;
              const isUrgent = isEventPast && remaining > 0;

              return (
                  <div 
                      key={contract.id} 
                      onClick={() => setSelectedContract(contract)}
                      className={`
                          rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden
                          ${isUrgent 
                              ? 'bg-gradient-to-br from-[#450a0a] to-[#1a0505] border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse' 
                              : 'bg-[#1E293B] border border-gray-700 hover:border-[#FF3888] hover:shadow-xl hover:shadow-pink-900/10'
                          }
                      `}
                  >
                      {isUrgent && (
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl z-10 shadow-md flex items-center gap-1">
                               <i className="fas fa-exclamation-circle animate-pulse"></i> ¡COBRO URGENTE!
                          </div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-[#FF3888] transition-colors">{contract.studentName || contract.quinceanera_nombre}</h3>
                              <span className={`text-sm flex items-center gap-2 ${isEventPast ? 'text-gray-500 line-through decoration-red-500' : 'text-gray-400'}`}>
                                  <i className="far fa-calendar-alt text-[#C4006B]"></i> {eventDate.toLocaleDateString()}
                              </span>
                          </div>
                          
                          {/* 👇 NUEVO: Botones de Editar y Eliminar (con stopPropagation) */}
                          <div className="flex gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setEditingContract(contract); setIsNewModalOpen(true); }}
                                className="w-9 h-9 rounded-full bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors shadow-md z-20 relative"
                             >
                                <i className="fas fa-pencil-alt text-xs"></i>
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, id: contract.id }); }}
                                className="w-9 h-9 rounded-full bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors shadow-md z-20 relative"
                             >
                                <i className="fas fa-trash-alt text-xs"></i>
                             </button>
                          </div>
                      </div>

                      <div className="flex justify-between items-end mb-2 text-sm">
                          <span className="text-gray-400">Paquete:</span>
                          <span className="text-white font-bold">${totalToPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end mb-4 text-sm">
                          <span className="text-gray-400">Restante:</span>
                          <span className={`font-bold ${remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>${remaining.toLocaleString()}</span>
                      </div>

                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${remaining <= 0 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-right text-gray-400 font-medium">{progress.toFixed(0)}% Pagado</p>
                  </div>
              );
          })}
        </div>
        
        {/* 👇 Modificamos el Modal para aceptar "initialData" */}
        <RegistrarXVModal 
            isOpen={isNewModalOpen} 
            onClose={() => { setIsNewModalOpen(false); setEditingContract(null); }} 
            onSave={handleSaveContract}
            initialData={editingContract} 
        />
        
        <GestionarXVModal isOpen={!!selectedContract} onClose={() => setSelectedContract(null)} contract={selectedContract} onUpdateContract={handleUpdateContract} />

        <ConfirmationModal 
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, id: '' })}
            onConfirm={handleDelete}
            title="¿Eliminar Contrato?"
            message="Esta acción es irreversible y borrará todos los pagos asociados."
        />
      </div>
    </div>
  );
}