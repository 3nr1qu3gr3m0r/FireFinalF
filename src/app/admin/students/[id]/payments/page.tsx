"use client";
import { useState, useEffect, use, useMemo } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import CustomAlert from "@/components/ui/CustomAlert";

type CartItem = {
  id: number; 
  uniqueId: string;
  name: string;
  type: 'clase' | 'plan' | 'deuda'; 
  price: number; 
  originalPrice: number; 
  qty: number;
  discount: number;
  discountType: '%' | '$';
  isInstallment?: boolean; 
  payWithPlan?: boolean;
  planId?: number; 
};

export default function StudentSalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [student, setStudent] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'clases' | 'planes' | 'adeudos'>('clases');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");

  const [alertState, setAlertState] = useState<{ show: boolean; msg: string; type: "success" | "error" | "warning" }>({ show: false, msg: "", type: "success" });
  const showAlert = (msg: string, type: "success" | "error" | "warning") => setAlertState({ show: true, msg, type });

  // 🔒 SEGURIDAD
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const decoded = JSON.parse(jsonPayload);
            const role = (decoded.role || decoded.rol || "").toLowerCase();
            
            if (role === 'alumno') window.location.href = "/alumno/dashboard";
        } catch (e) { console.error(e); }
    }
  }, []);

  // 🔄 CARGA DE DATOS
  const loadAll = async () => {
    setLoading(true);
    try {
        // 1. Cargar Alumno (incluye reservas y compras gracias al cambio en backend)
        const dataStudent = await fetchWithAuth(`/users/${id}`);
        setStudent(dataStudent);

        const pendingDebts = dataStudent?.paquetes?.filter((p: any) => p.saldo_pendiente && Number(p.saldo_pendiente) > 0) || [];
        setDebts(pendingDebts);

        // 2. Cargar Clases y Filtrar
        const dataClasses = await fetchWithAuth('/classes');
        
        // A. Filtro por Día de la Semana (Tu lógica original)
        let filteredClasses = Array.isArray(dataClasses) 
            ? dataClasses.filter((c: any) => {
                if (!c.fecha_inicio || c.dias_repeticion === undefined) return false;
                const today = new Date(); today.setHours(0,0,0,0);
                const [y, m, d] = c.fecha_inicio.toString().split('-').map(Number);
                const start = new Date(y, m-1, d); start.setHours(0,0,0,0);
                if (today.getTime() < start.getTime()) return false;
                const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
                const interval = Number(c.dias_repeticion);
                return interval === 0 ? diff === 0 : diff % interval === 0;
              })
            : [];

        // B. NUEVO: Filtro "Ya Comprada Hoy"
        // Identificamos IDs de clases que el alumno ya tiene hoy (en reservas o compras recientes)
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const purchasedClassIds = new Set<number>();

        // b1. Revisar Reservas
        dataStudent.reservas?.forEach((r: any) => {
            if (r.fecha_clase === todayStr && r.estado !== 'Cancelada' && r.clase?.id) {
                purchasedClassIds.add(r.clase.id);
            }
        });

        // b2. Revisar Compras del día (Drop-ins)
        dataStudent.compras?.forEach((s: any) => {
            const saleDate = new Date(s.fecha_venta).toISOString().split('T')[0];
            if (saleDate === todayStr) {
                s.items?.forEach((i: any) => {
                    if (i.clase?.id) purchasedClassIds.add(i.clase.id);
                });
            }
        });

        // Aplicamos el filtro final
        filteredClasses = filteredClasses.filter((c: any) => !purchasedClassIds.has(c.id));
        setTodayClasses(filteredClasses);

        // 3. Cargar Planes
        const dataPlans = await fetchWithAuth('/plans');
        setPlans(Array.isArray(dataPlans) ? dataPlans : []);

    } catch (error: any) {
        console.error(error);
        showAlert(error.message || "Error cargando datos", "error");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  // Funciones de Carrito (Sin cambios)
  const addClassToCart = (cls: any) => setCart([...cart, { id: cls.id, uniqueId: `c-${Date.now()}`, name: cls.nombre, type: 'clase', price: Number(cls.precio), originalPrice: Number(cls.precio), qty: 1, discount: 0, discountType: '%' }]);
  
  const useActivePlan = (cls: any, pid: number, pname: string) => setCart([...cart, { id: cls.id, uniqueId: `cp-${Date.now()}`, name: `${cls.nombre} (${pname})`, type: 'clase', price: 0, originalPrice: 0, qty: 1, discount: 0, discountType: '$', payWithPlan: true, planId: pid }]);
  
  const addPlanToCart = (plan: any) => setCart([...cart, { id: plan.id, uniqueId: `p-${Date.now()}`, name: plan.nombre, type: 'plan', price: Number(plan.precio), originalPrice: Number(plan.precio), qty: 1, discount: 0, discountType: '%', isInstallment: false }]);
  
  const addDebtToCart = (debt: any) => {
      if (cart.some(i => i.uniqueId === `d-${debt.id}`)) return;
      setCart([...cart, { id: debt.id, uniqueId: `d-${debt.id}`, name: `Abono: ${debt.plan?.nombre}`, type: 'deuda', price: Number(debt.saldo_pendiente), originalPrice: Number(debt.saldo_pendiente), qty: 1, discount: 0, discountType: '$' }]);
  };
  
  const removeFromCart = (uid: string) => setCart(cart.filter(i => i.uniqueId !== uid));

  // Calculadoras (Sin cambios)
  const getDiscountedTotal = (item: CartItem) => {
      if (item.discountType === '%') {
          return item.originalPrice * (1 - item.discount / 100);
      }
      return Math.max(0, item.originalPrice - item.discount);
  };

  const updateDiscount = (uniqueId: string, val: number, type: '%' | '$') => {
      setCart(cart.map(item => {
          if (item.uniqueId === uniqueId) {
              const newItem = { ...item, discount: val, discountType: type };
              if (!item.isInstallment && item.type !== 'deuda') {
                  if (type === '%') newItem.price = item.originalPrice * (1 - val / 100);
                  else newItem.price = Math.max(0, item.originalPrice - val);
              }
              return newItem;
          }
          return item;
      }));
  };

  const updatePaymentAmount = (uniqueId: string, val: number) => {
      setCart(cart.map(item => {
          if (item.uniqueId === uniqueId) {
              const maxPrice = item.type === 'deuda' ? item.originalPrice : getDiscountedTotal(item);
              return { ...item, price: Math.min(val, maxPrice) };
          }
          return item;
      }));
  };

  const toggleInstallment = (uniqueId: string) => {
      setCart(cart.map(item => {
          if (item.uniqueId === uniqueId && item.type === 'plan') {
              const isNowInstallment = !item.isInstallment;
              const discountedTotal = getDiscountedTotal(item);
              return { 
                  ...item, 
                  isInstallment: isNowInstallment,
                  price: discountedTotal 
              };
          }
          return item;
      }));
  };

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.price, 0), [cart]);

  // Procesar Venta
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
        const salePayload = {
            comprador_id: parseInt(id),
            nombre_externo: student?.nombre_completo,
            metodo_pago: total === 0 ? 'Plan/Cortesía' : paymentMethod,
            referencia_externa: "Venta Admin/Recepción",
            tipo_venta: 'mixta', 
            items: cart.map(item => {
                const discountedTotal = getDiscountedTotal(item);
                return {
                    tipo: item.type, 
                    id_referencia: item.id,
                    cantidad: 1,
                    precio_final: item.price, 
                    precio_acordado: item.type === 'plan' ? discountedTotal : undefined,
                    es_plazo: item.isInstallment || false,
                    usar_paquete_id: item.planId || null 
                };
            })
        };

        await fetchWithAuth('/sales', { 
            method: 'POST', 
            body: JSON.stringify(salePayload) 
        });

        showAlert("✅ Venta registrada correctamente", "success");
        setCart([]);
        loadAll(); 

    } catch (error: any) {
        console.error(error);
        showAlert(`Error: ${error.message || "Error al procesar la venta"}`, "error");
    } finally {
        setProcessing(false);
    }
  };

  const activePackages = student?.paquetes?.filter((p: any) => p.activo && p.clases_restantes > 0) || [];

  return (
    <div className="bg-[#111827] min-h-screen pb-28 p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 animate-fade-in-up">
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO */}
        <div className="flex-1 space-y-6">
             <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-700 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4006B] to-[#FF3888] p-0.5">
                        <img src={student?.foto_perfil || `https://ui-avatars.com/api/?name=${student?.nombre_completo || 'User'}`} className="w-full h-full rounded-full object-cover bg-gray-900" alt="Perfil"/>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-none">{student?.nombre_completo || 'Cargando...'}</h2>
                        <span className="text-gray-400 text-xs">ID: {student?.id}</span>
                    </div>
                </div>
             </div>

             <div className="flex gap-4 border-b border-gray-700 pb-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('clases')} className={`pb-2 px-2 text-sm font-bold uppercase ${activeTab==='clases' ? 'text-[#FF3888] border-b-2 border-[#FF3888]' : 'text-gray-500'}`}>Clases</button>
                <button onClick={() => setActiveTab('planes')} className={`pb-2 px-2 text-sm font-bold uppercase ${activeTab==='planes' ? 'text-[#FF3888] border-b-2 border-[#FF3888]' : 'text-gray-500'}`}>Planes</button>
                <button onClick={() => setActiveTab('adeudos')} className={`pb-2 px-2 text-sm font-bold uppercase ${activeTab==='adeudos' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-500'}`}>Adeudos ({debts.length})</button>
             </div>

             <div className="min-h-[400px]">
                {loading ? <p className="text-center text-gray-500 py-10">Cargando catálogo...</p> : (
                    activeTab === 'clases' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {todayClasses.length === 0 && <p className="text-gray-500 col-span-2 text-center">No hay clases disponibles para hoy (o ya las tomó).</p>}
                            {todayClasses.map(c => (
                                <div key={c.id} className="bg-[#1F2937] p-4 rounded-xl border border-gray-700 flex flex-col justify-between hover:border-gray-500 transition-colors">
                                    <div>
                                        <h3 className="text-white font-bold">{c.nombre}</h3>
                                        <p className="text-gray-400 text-sm">{c.hora} · {c.maestro}</p>
                                        <span className="text-[#FF3888] font-bold">${c.precio}</span>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <button onClick={()=>addClassToCart(c)} className="bg-gray-700 text-white py-2 rounded-lg text-sm hover:bg-gray-600 font-bold">Agregar (Pagar)</button>
                                        
                                        {/* 👇 AQUI ESTÁ EL CAMBIO VISUAL DE CLASES RESTANTES */}
                                        {activePackages.map((p: any) => {
                                         // 1. Verificamos si el plan tiene clases definidas
                                        const allowedClasses = p.plan?.clases || [];
        
                                            // 2. Verificamos si la clase actual (c.id) está en la lista del plan
                                            const isIncluded = allowedClasses.some((ac: any) => ac.id === c.id);

                                            // 3. Si NO está incluida, no mostramos el botón (retornamos null)
                                            if (!isIncluded) return null;

                                            return (
                                                <button key={p.id} onClick={()=>useActivePlan(c, p.id, p.plan?.nombre)} className="bg-green-800 text-green-100 py-2 rounded-lg text-sm hover:bg-green-700 font-bold border border-green-700">
                                                    Usar {p.plan?.nombre} ({p.clases_restantes} disp.)
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'planes' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.map(p => (
                                <button key={p.id} onClick={()=>addPlanToCart(p)} className="bg-[#1F2937] p-5 rounded-xl border border-gray-700 text-left hover:border-[#FF3888] transition-all group">
                                    <h3 className="text-white font-bold text-lg group-hover:text-[#FF3888] transition-colors">{p.nombre}</h3>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="bg-gray-800 text-white px-3 py-1 rounded-lg font-mono text-sm">${p.precio}</span>
                                        <span className="text-gray-500 text-xs">{p.cantidad_clases} clases</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {debts.length === 0 && <p className="text-gray-500 col-span-2 text-center">El alumno está al corriente.</p>}
                            {debts.map(d => (
                                <div key={d.id} className="bg-red-900/10 border border-red-900/50 p-5 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-white font-bold">{d.plan?.nombre || "Paquete Personalizado"}</h3>
                                        <p className="text-red-400 text-sm font-bold mt-1">Deuda: ${d.saldo_pendiente}</p>
                                    </div>
                                    <button onClick={()=>addDebtToCart(d)} className="w-full bg-red-600 text-white py-2 rounded-lg mt-3 hover:bg-red-500 font-bold shadow-lg shadow-red-900/20">Abonar</button>
                                </div>
                            ))}
                        </div>
                    )
                )}
             </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO (Sin cambios visuales mayores) */}
        <div className="w-full lg:w-[400px]">
            <div className="bg-[#1F2937] border border-gray-700 rounded-2xl shadow-2xl sticky top-4 flex flex-col h-[calc(100vh-120px)]">
                <div className="p-5 border-b border-gray-700 bg-[#111827]/50 rounded-t-2xl">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2"><i className="fas fa-shopping-cart text-[#FF3888]"></i> Resumen</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 && <div className="text-center text-gray-500 mt-10">Carrito vacío</div>}
                    {cart.map((item) => {
                        const discountedTotal = getDiscountedTotal(item);
                        const debtAmount = item.type === 'plan' && item.isInstallment ? discountedTotal - item.price : 0;

                        return (
                            <div key={item.uniqueId} className={`rounded-xl p-3 border relative group ${item.type === 'deuda' ? 'bg-red-900/10 border-red-900/30' : 'bg-[#111827] border-gray-700'}`}>
                                <button onClick={() => removeFromCart(item.uniqueId)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400"><i className="fas fa-times"></i></button>
                                
                                <p className="text-white font-bold text-sm pr-6">{item.name}</p>
                                <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">{item.type}</p>

                                {!item.payWithPlan && item.type !== 'deuda' && (
                                    <div className="mt-2 flex items-center gap-2 bg-[#1F2937] p-1.5 rounded-lg border border-gray-600 w-fit">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Desc:</span>
                                        <input type="number" min="0" className="w-12 bg-transparent text-white text-xs text-center outline-none" 
                                            placeholder="0" value={item.discount || ''} onChange={(e) => updateDiscount(item.uniqueId, Number(e.target.value), item.discountType)} />
                                        <button onClick={() => updateDiscount(item.uniqueId, 0, item.discountType === '%' ? '$' : '%')} className="text-[10px] font-bold bg-gray-600 text-white px-2 py-0.5 rounded hover:bg-gray-500">{item.discountType}</button>
                                    </div>
                                )}

                                {item.type === 'plan' && (
                                    <label className="flex items-center gap-2 cursor-pointer mt-3 select-none">
                                        <input type="checkbox" checked={item.isInstallment} onChange={() => toggleInstallment(item.uniqueId)} className="accent-[#FF3888] w-4 h-4" />
                                        <span className="text-gray-300 text-xs font-medium">Pagar a Plazos</span>
                                    </label>
                                )}

                                {item.isInstallment && (
                                    <div className="mt-2 p-2 rounded-lg bg-black/20 border border-[#FF3888]/30">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Total:</span>
                                            <span>${discountedTotal}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#FF3888] font-bold text-xs">Enganche: $</span>
                                            <input type="number" className="w-full bg-transparent text-white font-bold outline-none border-b border-gray-600 focus:border-[#FF3888]"
                                                value={item.price} onChange={(e) => updatePaymentAmount(item.uniqueId, Number(e.target.value))} />
                                        </div>
                                        <div className="text-right text-xs text-red-400 mt-1 font-bold">
                                            Resta: ${debtAmount.toFixed(2)}
                                        </div>
                                    </div>
                                )}

                                {item.type === 'deuda' && (
                                    <div className="mt-2 bg-[#111827] p-2 rounded-lg border border-red-900/30">
                                        <label className="text-[10px] text-red-300 font-bold uppercase block mb-1">Monto a Abonar</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold">$</span>
                                            <input type="number" min="1" max={item.originalPrice} className="w-full bg-transparent text-white font-bold outline-none border-b border-gray-600 focus:border-red-500"
                                                value={item.price} onChange={(e) => updatePaymentAmount(item.uniqueId, Number(e.target.value))} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 text-right">Resta: ${(item.originalPrice - item.price).toFixed(2)}</p>
                                    </div>
                                )}

                                {!item.isInstallment && item.type !== 'deuda' && (
                                    <div className="mt-2 text-right">
                                        {item.discount > 0 && <span className="text-gray-500 text-xs line-through mr-2">${item.originalPrice}</span>}
                                        <span className="text-white font-mono font-bold">${item.price.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-5 border-t border-gray-700 bg-[#111827]/50 rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">Total a Pagar Hoy</span>
                        <span className="text-2xl font-bold text-white">${total.toFixed(2)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {['Efectivo', 'Transferencia'].map(m => (
                            <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}`}>{m}</button>
                        ))}
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0 || processing} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-lg shadow-pink-900/40 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {processing ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar Venta'}
                    </button>
                </div>
            </div>
        </div>
      </div>
      <CustomAlert isVisible={alertState.show} message={alertState.msg} type={alertState.type} onClose={() => setAlertState({ ...alertState, show: false })} />
    </div>
  );
}