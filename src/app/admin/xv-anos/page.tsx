"use client";
import { useState, useEffect } from "react";
import RegistrarXVModal from "@/components/admin/RegistrarXVModal";
import GestionarXVModal from "@/components/admin/GestionarXVModal";
import { XvContract } from "@/types/xv-anos";

export default function XVAnosPage() {
  const [contracts, setContracts] = useState<XvContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'history'>('active');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<XvContract | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${API_URL}/xv-anos`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      
      const formattedData = data.map((c: any) => ({
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
      }));
      setContracts(formattedData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchContracts(); }, []);

  const handleCreateContract = async (data: { nombre: string; fecha: string; total: number }) => {
    try {
        const res = await fetch(`${API_URL}/xv-anos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName: data.nombre, date: data.fecha, contractTotal: data.total }),
        });
        if (res.ok) { fetchContracts(); setIsNewModalOpen(false); }
      } catch (error) { alert("Error"); }
  };

  const handleUpdateContract = (updated: XvContract) => {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedContract(updated);
  };

  const filteredContracts = contracts.filter(contract => {
    const totalPaid = contract.concepts.reduce((sum, c) => sum + Number(c.paid), 0);
    const isFullyPaid = totalPaid >= contract.contractTotal;
    const eventDate = new Date(contract.eventDate + "T00:00:00");
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
        
        {/* ========================================================== */}
        {/* BARRA DE ACCIONES (Sin Título Duplicado) */}
        {/* ========================================================== */}
        {/* Usamos 'justify-end' para mandar los botones a la derecha */}
        <div className="hidden md:flex flex-row items-center justify-end gap-4 mb-6">
           
           {/* ❌ AQUI ELIMINÉ EL TÍTULO QUE YA SALE ARRIBA */}

           <div className="flex items-center gap-4">
              <div className="bg-[#111827] p-1 rounded-xl flex border border-gray-700">
                  <button onClick={() => setView('active')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'active' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Activos</button>
                  <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Historial</button>
              </div>
              <button onClick={() => setIsNewModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center shadow-lg shadow-blue-900/20">
                  <i className="fas fa-plus mr-2"></i> Nuevo
              </button>
           </div>
        </div>

        {/* CONTROLES MÓVILES (Se mantienen igual) */}
        <div className="md:hidden flex gap-3 mb-2">
            <div className="bg-[#111827] p-1 rounded-xl flex border border-gray-700 flex-1">
                  <button onClick={() => setView('active')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${view === 'active' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500'}`}>Activos</button>
                  <button onClick={() => setView('history')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${view === 'history' ? 'bg-[#1F2937] text-white shadow' : 'text-gray-500'}`}>Historial</button>
            </div>
            <button onClick={() => setIsNewModalOpen(true)} className="bg-blue-600 text-white w-14 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
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
              
              const eventDate = new Date(contract.eventDate + "T00:00:00");
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
                              <h3 className="text-lg font-bold text-white group-hover:text-[#FF3888] transition-colors">{contract.studentName}</h3>
                              <span className={`text-sm flex items-center gap-2 ${isEventPast ? 'text-gray-500 line-through decoration-red-500' : 'text-gray-400'}`}>
                                  <i className="far fa-calendar-alt text-[#C4006B]"></i> {eventDate.toLocaleDateString()}
                              </span>
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isUrgent ? 'bg-red-900/50 text-red-200' : 'bg-gray-700 text-gray-300 group-hover:bg-[#FF3888] group-hover:text-white'}`}>
                              <i className="fas fa-edit"></i>
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
        
        <RegistrarXVModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSave={handleCreateContract} />
        <GestionarXVModal isOpen={!!selectedContract} onClose={() => setSelectedContract(null)} contract={selectedContract} onUpdateContract={handleUpdateContract} />
      </div>
    </div>
  );
}