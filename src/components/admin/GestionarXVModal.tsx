"use client";
import { useState, useMemo, useEffect } from "react";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import { XvContract } from "@/types/xv-anos";
import CustomAlert from "@/components/ui/CustomAlert";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: XvContract | null;
  onUpdateContract: (updatedContract: XvContract) => void;
}

export default function GestionarXVModal({ isOpen, onClose, contract, onUpdateContract }: ModalProps) {
  const [activeTab, setActiveTab] = useState<'concepts' | 'payments'>('concepts');
  const [newConcept, setNewConcept] = useState({ name: '', real: '', client: '' });
  const [newPayment, setNewPayment] = useState({ amount: '', date: '', conceptId: 'general' });
  const [loading, setLoading] = useState(false);
  
  // Estado para la alerta personalizada
  const [alertInfo, setAlertInfo] = useState<{ show: boolean, msg: string, type: 'error' | 'success' | 'warning' }>({ show: false, msg: '', type: 'error' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (isOpen) {
        setNewPayment(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }
  }, [isOpen]);

  // Función para activar el CustomAlert
  const showAlert = (msg: string, type: 'error' | 'success' | 'warning' = 'error') => {
      setAlertInfo({ show: true, msg, type });
      setTimeout(() => setAlertInfo(prev => ({ ...prev, show: false })), 4000);
  };

  const currentConcepts = contract?.concepts || [];
  const currentPayments = contract?.payments || [];
  const contractTotal = Number(contract?.contractTotal) || 0;

  // Cálculos Memoizados
  const sumRealCost = useMemo(() => currentConcepts.reduce((s, c) => s + Number(c.realCost), 0), [currentConcepts]);
  const sumClientCost = useMemo(() => currentConcepts.reduce((s, c) => s + Number(c.clientCost), 0), [currentConcepts]);
  const totalPaid = useMemo(() => currentConcepts.reduce((s, c) => s + Number(c.paid), 0), [currentConcepts]);
  
  const remainingBalance = Math.round((contractTotal - totalPaid) * 100) / 100;
  const paymentProgress = contractTotal > 0 ? (totalPaid / contractTotal) * 100 : 0;

  // --- 🛡️ FUNCIÓN DE VALIDACIÓN DE DINERO ESTRICTA ---
  const isValidMoneyFormat = (val: string) => {
      const num = Number(val);
      // 1. Debe ser número
      if (val === '' || isNaN(num)) return false;
      // 2. Si tiene decimales, máximo 2
      if (val.includes('.')) {
          const decimals = val.split('.')[1];
          if (decimals.length > 2) return false;
      }
      // 3. Bloquear valores microscópicos (ej: 0.0001)
      // Permitimos 0 exacto (para casos de regalo), pero si es mayor a 0, debe ser al menos 0.01
      if (num !== 0 && num < 0.01) return false;
      
      return true;
  };

  // --- LÓGICA CONCEPTO ---
  const handleAddConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    // 1. Validar campos vacíos
    if (!newConcept.name.trim()) return showAlert("Escribe un nombre para el concepto.");
    if (newConcept.client === '' || newConcept.real === '') return showAlert("Ingresa los montos (pueden ser 0).");

    // 2. Validación Estricta de Formato
    if (!isValidMoneyFormat(newConcept.client)) return showAlert("Monto de Venta inválido (máx 2 decimales, no valores microscópicos).");
    if (!isValidMoneyFormat(newConcept.real)) return showAlert("Monto de Gasto inválido (máx 2 decimales, no valores microscópicos).");
    
    // 3. Convertir
    const newClientPrice = Number(newConcept.client);
    const newRealPrice = Number(newConcept.real);
    
    // 4. Validaciones de Negocio
    if (newClientPrice < 0 || newRealPrice < 0) return showAlert("Los montos no pueden ser negativos.");
    if (newClientPrice === 0 && newRealPrice === 0) return showAlert("El concepto no puede valer $0 en gasto y $0 en venta.");
    
    const availableBudget = Math.round((contractTotal - sumClientCost) * 100) / 100;
    if (newClientPrice > availableBudget) return showAlert(`No puedes agregar $${newClientPrice}. Solo quedan $${availableBudget} disponibles en el contrato.`);
    
    if (newRealPrice > 99999999 || newClientPrice > 99999999) return showAlert("Monto excede el límite permitido.");

    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/xv-anos/${contract.id}/concepts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newConcept.name, realCost: newRealPrice, clientCost: newClientPrice })
        });
        if (!res.ok) { const err = await res.json(); return showAlert(err.message); }

        const updatedContractRes = await fetch(`${API_URL}/xv-anos/${contract.id}`);
        const updatedContract = await updatedContractRes.json();
        // Asegurar tipos numéricos
        updatedContract.concepts = updatedContract.concepts.map((c: any) => ({...c, realCost: Number(c.realCost), clientCost: Number(c.clientCost), paid: Number(c.paid)}));
        onUpdateContract(updatedContract);
        setNewConcept({ name: '', real: '', client: '' });
        showAlert("Concepto agregado correctamente", "success");
    } catch (error) { showAlert("Error de conexión"); } finally { setLoading(false); }
  };

  // --- LÓGICA PAGO ---
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    // 1. Validar campos vacíos
    if (!newPayment.amount) return showAlert("Ingresa el monto del abono.");

    // 2. Validación Estricta de Formato
    if (!isValidMoneyFormat(newPayment.amount)) {
        return showAlert("Formato inválido. Máximo 2 decimales (ej: 150.50).");
    }
    
    // 3. Convertir
    const amount = Number(newPayment.amount);

    // 4. Validaciones de Negocio
    if (amount < 0.01) return showAlert("El abono debe ser de al menos $0.01.");
    if (amount > 99999999) return showAlert("Monto inválido.");

    const paymentDate = new Date(newPayment.date + "T00:00:00");
    const contractDate = contract.createdAt ? new Date(contract.createdAt) : new Date("2000-01-01");
    contractDate.setHours(0,0,0,0);
    if (paymentDate < contractDate) return showAlert("La fecha del abono no puede ser anterior a la creación del contrato.");

    if (amount > remainingBalance) return showAlert(`El abono ($${amount}) excede la deuda total ($${remainingBalance}).`);

    if (newPayment.conceptId !== 'general') {
        const targetId = Number(newPayment.conceptId);
        const targetConcept = currentConcepts.find(c => c.id === targetId);
        if (targetConcept) {
            const debt = Math.round((Number(targetConcept.clientCost) - Number(targetConcept.paid)) * 100) / 100;
            if (amount > debt) return showAlert(`El concepto "${targetConcept.name}" solo debe $${debt}.`);
        }
    }

    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/xv-anos/${contract.id}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, date: newPayment.date, conceptId: newPayment.conceptId })
        });
        if (!res.ok) { const err = await res.json(); return showAlert(err.message); }

        const updatedContract = await res.json();
        updatedContract.contractTotal = Number(updatedContract.contractTotal);
        updatedContract.concepts = updatedContract.concepts.map((c: any) => ({...c, realCost: Number(c.realCost), clientCost: Number(c.clientCost), paid: Number(c.paid)}));
        updatedContract.payments = updatedContract.payments.map((p: any) => ({...p, amount: Number(p.amount)}));
        onUpdateContract(updatedContract);
        setNewPayment({ ...newPayment, amount: '' });
        showAlert("Pago registrado correctamente", "success");
    } catch (error) { showAlert("Error de conexión"); } finally { setLoading(false); }
  };

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* 🔔 Renderizado de la Alerta Personalizada */}
      <CustomAlert isVisible={alertInfo.show} message={alertInfo.msg} type={alertInfo.type} onClose={() => setAlertInfo(prev => ({...prev, show: false}))} />

      <div className="bg-[#111827] w-full h-[100dvh] sm:h-[90vh] sm:max-w-4xl flex flex-col rounded-none sm:rounded-3xl border-0 sm:border border-gray-700 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="bg-[#1F2937] px-5 py-4 border-b border-gray-700 shrink-0 shadow-lg z-20">
            <div className="flex justify-between items-center mb-4">
                <div className="truncate pr-4">
                    <h2 className="text-xl font-bold text-white truncate flex items-center gap-3">
                         {contract.studentName}
                         {remainingBalance <= 0 
                            ? <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-600 uppercase tracking-widest font-bold">Pagado</span>
                            : <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-600 uppercase tracking-widest font-bold">Activo</span>
                         }
                    </h2>
                </div>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full text-gray-400 hover:text-white shrink-0 active:scale-95 transition-transform"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('concepts')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${activeTab === 'concepts' ? 'border-[#FF3888] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><i className="fas fa-list-ul"></i> Conceptos</button>
                <button onClick={() => setActiveTab('payments')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'border-[#FF3888] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><i className="fas fa-money-bill-wave"></i> Pagos</button>
            </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-hidden relative bg-[#0B1120] flex flex-col">
            
            {activeTab === 'concepts' && (
                <>
                    {/* FORMULARIO AGREGAR CONCEPTO */}
                    <div className="p-5 bg-[#1F2937]/30 border-b border-gray-800 shrink-0">
                        {/* 👇 AGREGADO: noValidate para evitar burbujas del navegador */}
                        <form onSubmit={handleAddConcept} className="flex flex-col sm:flex-row gap-3" noValidate>
                            <div className="flex-[2] relative group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 block sm:hidden">Concepto</label>
                                <input type="text" placeholder="Nuevo Concepto" className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 h-12 text-sm text-white focus:border-[#FF3888] outline-none transition-all" value={newConcept.name} onChange={e => setNewConcept({...newConcept, name: e.target.value})} />
                            </div>
                            <div className="flex gap-3 flex-1">
                                <div className="w-1/2 relative group">
                                     <label className="text-[10px] font-bold text-red-400 uppercase mb-1 ml-1 block sm:hidden">Gasto</label>
                                     <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">$</span><input type="number" step="0.01" min="0" placeholder="Gasto" className="w-full bg-[#111827] border border-red-900/30 rounded-xl pl-6 pr-2 h-12 text-sm text-white focus:border-red-500 outline-none transition-all" value={newConcept.real} onChange={e => setNewConcept({...newConcept, real: e.target.value})} /></div>
                                </div>
                                <div className="w-1/2 relative group">
                                     <label className="text-[10px] font-bold text-green-400 uppercase mb-1 ml-1 block sm:hidden">Venta</label>
                                     <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">$</span><input type="number" step="0.01" min="0" placeholder="Venta" className="w-full bg-[#111827] border border-green-900/30 rounded-xl pl-6 pr-2 h-12 text-sm text-white focus:border-green-500 outline-none transition-all" value={newConcept.client} onChange={e => setNewConcept({...newConcept, client: e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end"><button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white h-12 w-full sm:w-14 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-lg">{loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}</button></div>
                        </form>
                    </div>

                    {/* LISTA CONCEPTOS */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {currentConcepts.length === 0 && <div className="text-center py-10 opacity-50"><i className="fas fa-tags text-3xl mb-2"></i><p className="text-xs">Sin conceptos</p></div>}
                        {currentConcepts.map(c => {
                            const profit = Math.round((Number(c.clientCost) - Number(c.realCost)) * 100) / 100;
                            const percent = c.clientCost > 0 ? (c.paid / c.clientCost) * 100 : 0;
                            return (
                                <div key={c.id} className="bg-[#1E293B] p-4 rounded-xl border border-gray-700/60 shadow-md">
                                    <div className="flex justify-between mb-3 items-center">
                                        <div className="flex items-center gap-2"><span className="text-white font-bold text-sm">{c.name}</span>{c.paid >= c.clientCost && <i className="fas fa-check-circle text-green-500 text-xs"></i>}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${profit >= 0 ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-red-900/20 text-red-400 border-red-800'}`}>${profit} Ganancia</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-500 ${c.paid >= c.clientCost ? 'bg-green-500' : 'bg-[#FF3888]'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div></div>
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium"><span>Gasto: <span className="text-red-300">${Number(c.realCost).toLocaleString()}</span></span><span>Venta: <span className="text-green-300">${Number(c.clientCost).toLocaleString()}</span></span></div>
                                </div>
                            );
                        })}
                        <div className="h-6"></div>
                    </div>
                </>
            )}

            {activeTab === 'payments' && (
                <>
                    {/* FORMULARIO AGREGAR PAGO */}
                    <div className="p-5 bg-[#1F2937]/40 border-b border-gray-800 shrink-0 z-20">
                        {/* 👇 AGREGADO: noValidate */}
                        <form onSubmit={handleAddPayment} className="flex flex-col gap-4" noValidate>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 space-y-1"><CustomDatePicker label="Fecha" value={newPayment.date} onChange={(date) => setNewPayment({...newPayment, date: date})} /></div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Monto</label>
                                    <div className="relative group"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-blue-400 transition-colors">$</span><input type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00" className="w-full bg-[#111827] border border-gray-700 rounded-xl pl-7 pr-4 h-12 text-sm text-white focus:border-blue-500 outline-none transition-all" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-end">
                                <div className="relative flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Destino</label>
                                    <select className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 h-12 text-sm text-white focus:border-blue-500 outline-none appearance-none transition-all" value={newPayment.conceptId} onChange={e => setNewPayment({...newPayment, conceptId: e.target.value})}><option value="general">★ GENERAL (Recomendado)</option><optgroup label="Específico">{currentConcepts.filter(c => c.paid < c.clientCost).map(c => (<option key={c.id} value={c.id}>{c.name} (Resta: ${c.clientCost - c.paid})</option>))}</optgroup></select><i className="fas fa-chevron-down absolute right-4 top-9 text-xs text-gray-500 pointer-events-none"></i>
                                </div>
                                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white w-28 h-12 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">{loading ? "..." : "Abonar"}</button>
                            </div>
                        </form>
                    </div>

                    {/* LISTA PAGOS */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                        {currentPayments.length === 0 && <div className="text-center py-10 opacity-50"><i className="fas fa-receipt text-3xl mb-2"></i><p className="text-xs">Sin pagos registrados</p></div>}
                        {[...currentPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                             <div key={p.id} className="flex justify-between items-center bg-[#1E293B] px-4 py-3 rounded-xl border border-gray-700/60 shadow-sm hover:bg-[#253248] transition-colors">
                                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-900/20 text-green-400 flex items-center justify-center border border-green-900/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]"><i className="fas fa-dollar-sign text-sm"></i></div><div><span className="block text-white font-bold text-lg tracking-wide">${Number(p.amount).toLocaleString()}</span><span className="text-[10px] text-gray-400 block">{new Date(p.date).toLocaleDateString()}</span></div></div><span className="text-[9px] font-bold bg-[#111827] px-2 py-1 rounded text-gray-300 border border-gray-600 uppercase tracking-wide">{p.conceptName}</span>
                            </div>
                        ))}
                         <div className="h-6"></div>
                    </div>
                </>
            )}
        </div>

        {/* FOOTER STATS */}
        <div className="bg-[#111827] border-t border-gray-700 p-4 shrink-0 pb-8 sm:pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-30">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#1F2937] p-2 rounded-lg border border-gray-700"><span className="text-[9px] text-gray-500 uppercase block font-bold mb-1">Venta</span><span className="text-sm font-bold text-white">${sumClientCost.toLocaleString()}</span></div>
                <div className="bg-[#1F2937] p-2 rounded-lg border border-gray-700"><span className="text-[9px] text-gray-500 uppercase block font-bold mb-1">Cobrado</span><span className="text-sm font-bold text-green-400">${totalPaid.toLocaleString()}</span></div>
                <div className="bg-[#1F2937] p-2 rounded-lg border border-gray-700"><span className="text-[9px] text-gray-500 uppercase block font-bold mb-1">Deuda</span><span className="text-sm font-bold text-red-400">${remainingBalance.toLocaleString()}</span></div>
            </div>
            <div className="mt-3 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-[0_0_10px_rgba(255,56,136,0.5)]" style={{ width: `${Math.min(paymentProgress, 100)}%` }}></div></div>
        </div>

      </div>
    </div>
  );
}