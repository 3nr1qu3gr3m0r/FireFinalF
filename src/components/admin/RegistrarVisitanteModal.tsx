"use client";
import { useState, useMemo, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api"; 
import CustomAlert from "@/components/ui/CustomAlert"; 

// --- TIPOS ---
type ClassItem = {
  id: number;
  name: string;
  teacher: string;
  time: string;
  price: number;
  level: string;
  days: number;
};

type CartItem = ClassItem & { 
    discount: number; 
    discountType: "%" | "$";
    id_referencia: number;
    tipo: 'clase'; 
    cantidad: number;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
        case 'iniciacion': return { color: 'bg-purple-900 text-purple-200 border-purple-700', label: 'Iniciación' };
        case 'principiante': return { color: 'bg-emerald-900 text-emerald-200 border-emerald-700', label: 'Principiante' };
        case 'intermedio': return { color: 'bg-amber-900 text-amber-200 border-amber-700', label: 'Intermedio' };
        case 'avanzado': return { color: 'bg-red-900 text-red-200 border-red-700', label: 'Avanzado' };
        case 'multinivel': return { color: 'bg-blue-900 text-blue-200 border-blue-700', label: 'Multinivel' };
        default: return { color: 'bg-gray-800 text-gray-400 border-gray-600', label: level || 'General' };
    }
};

export default function RegistrarVisitanteModal({ isOpen, onClose }: ModalProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [visitorName, setVisitorName] = useState("");
  const [visitorWhatsapp, setVisitorWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Estado Alertas
  const [alertState, setAlertState] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ isVisible: false, message: "", type: "error" });

  const showAlert = (message: string, type: "success" | "error" | "warning") => {
    setAlertState({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setVisitorName("");
      setVisitorWhatsapp("");
      setPaymentMethod("Efectivo");
      setLoadingClasses(true);
      
      // ✅ CORRECCIÓN: fetchWithAuth devuelve data directa, no un Response para hacer .json()
      fetchWithAuth('/classes') 
        .then(data => {
            if (!Array.isArray(data)) return;
            
            // 👇 LÓGICA DE INTERVALOS
            const availableClasses = data.filter((c: any) => {
                if (!c.fecha_inicio || c.dias_repeticion === undefined) return false;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const [year, month, day] = c.fecha_inicio.toString().split('-').map(Number);
                const startDate = new Date(year, month - 1, day);
                startDate.setHours(0, 0, 0, 0);

                if (today.getTime() < startDate.getTime()) return false;

                const diffTime = today.getTime() - startDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const interval = Number(c.dias_repeticion);

                if (interval === 0) return diffDays === 0;
                return diffDays % interval === 0;
            }).map((c: any) => ({
                id: c.id,
                name: c.nombre,
                teacher: c.maestro || 'Instructor',
                time: c.hora ? c.hora.substring(0, 5) : '00:00', 
                price: Number(c.precio) || 0,
                level: c.nivel,
                days: c.dias_repeticion
            }));
                
            setClasses(availableClasses);
        })
        .catch(err => {
            console.error(err);
            // Si falla silenciosamente o muestra alerta opcional
        })
        .finally(() => setLoadingClasses(false));
    }
  }, [isOpen]);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value) && value.length <= 10) { 
          setVisitorWhatsapp(value);
      }
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => {
      let final = item.price;
      if (item.discount > 0) {
        final = item.discountType === "%" 
          ? item.price * (1 - item.discount / 100) 
          : item.price - item.discount;
      }
      return total + Math.max(0, final);
    }, 0);
  }, [cart]);

  const toggleCartItem = (cls: ClassItem) => {
    const exists = cart.find(i => i.id === cls.id);
    if (exists) {
        setCart(cart.filter(i => i.id !== cls.id));
    } else {
        setCart([...cart, { ...cls, discount: 0, discountType: "%", id_referencia: cls.id, tipo: 'clase', cantidad: 1 }]);
    }
  };

  const validateAndSetDiscount = (id: number, rawValue: string, price: number, type: "%" | "$") => {
    if (rawValue === "") {
        setCart(cart.map(i => i.id === id ? { ...i, discount: 0 } : i));
        return;
    }

    let val = parseFloat(rawValue);

    if (val < 0) val = 0;
    val = Math.floor(val * 100) / 100;

    let warning = "";
    if (type === "%") {
        if (val > 100) {
            val = 100;
            warning = "El descuento máximo es 100%";
        }
    } else { 
        if (val > price) {
            val = price;
            warning = "El descuento no puede superar el precio";
        }
    }

    if (warning) showAlert(warning, "warning");
    setCart(cart.map(i => i.id === id ? { ...i, discount: val } : i));
  };

  const toggleDiscountType = (id: number, currentPrice: number) => {
    setCart(cart.map(i => {
        if (i.id === id) {
            const newType = i.discountType === "%" ? "$" : "%";
            return { ...i, discountType: newType, discount: 0 }; 
        }
        return i;
    }));
  };

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitorName.trim()) {
        showAlert("Ingresa el nombre del visitante.", "warning");
        return;
    }

    if (visitorWhatsapp.length > 0 && visitorWhatsapp.length !== 10) {
        showAlert("Si ingresas WhatsApp, debe tener 10 dígitos.", "warning");
        return;
    }

    if (cart.length === 0) {
        showAlert("Selecciona al menos una clase.", "warning");
        return;
    }

    setLoading(true);

    try {
        const saleData = {
            comprador_id: null,
            nombre_externo: visitorName,
            metodo_pago: paymentMethod,
            referencia_externa: visitorWhatsapp ? `WhatsApp: ${visitorWhatsapp}` : "Sin contacto", 
            tipo_venta: 'clase',
            items: cart.map(item => ({
                tipo: 'clase',
                id_referencia: item.id,
                cantidad: 1,
                precio_final: item.discountType === "%" 
                    ? item.price * (1 - item.discount / 100) 
                    : item.price - item.discount
            }))
        };

        // ✅ CORRECCIÓN: fetchWithAuth devuelve la respuesta parseada o lanza error
        const res = await fetchWithAuth('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });

        // Si fetchWithAuth no lanza error, significa que fue exitoso
        showAlert(`✅ Venta registrada (Total: $${totalAmount.toFixed(2)})`, "success");
        setTimeout(() => {
            onClose();
        }, 2000);

    } catch (error: any) {
        console.error(error);
        showAlert(`❌ Error: ${error.message || 'No se pudo registrar'}`, "error");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        
        <CustomAlert 
            isVisible={alertState.isVisible} 
            message={alertState.message} 
            type={alertState.type} 
            onClose={() => setAlertState(prev => ({ ...prev, isVisible: false }))} 
        />

        <div className="bg-[#111827] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative">
            
            <div className="px-8 py-5 bg-[#1F2937] border-b border-gray-700 flex justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <i className="fas fa-user-plus text-[#FF3888] flex-shrink-0 text-2xl"></i> 
                    <span className="leading-tight">Registrar Visitante</span>
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 rounded-lg hover:bg-white/10 flex-shrink-0">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            <form onSubmit={handleRegisterVisitor} className="flex flex-col flex-1 overflow-hidden" noValidate>
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar bg-[#111827]">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 font-bold text-gray-400 text-xs uppercase">Nombre Completo</label>
                            <input type="text" 
                                className="w-full bg-[#1E293B] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-[#FF3888]"
                                value={visitorName} onChange={e => setVisitorName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block mb-2 font-bold text-gray-400 text-xs uppercase">WhatsApp (Opcional)</label>
                            <div className="relative">
                                <i className="fab fa-whatsapp absolute left-3 top-1/2 -translate-y-1/2 text-green-500"></i>
                                <input type="text" 
                                    className="w-full bg-[#1E293B] border border-gray-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-[#FF3888]"
                                    placeholder="10 dígitos"
                                    value={visitorWhatsapp} onChange={handleWhatsappChange} 
                                    maxLength={10} 
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-800 my-4" />

                    <div>
                        <h3 className="text-sm font-bold text-[#FF3888] uppercase mb-3 flex justify-between">
                            <span>Clases de Hoy</span>
                            <span className="text-xs text-gray-500 font-normal normal-case">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </h3>
                        
                        {loadingClasses ? (
                            <p className="text-gray-500 text-center py-4">Cargando...</p>
                        ) : classes.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm">No hay clases hoy.</div>
                        ) : (
                            <div className="space-y-3">
                                {classes.map(cls => {
                                    const inCart = cart.find(c => c.id === cls.id);
                                    const badge = getLevelBadge(cls.level);

                                    return (
                                        <div key={cls.id} className={`p-4 rounded-xl border transition-all ${inCart ? 'bg-[#1E293B] border-[#FF3888]' : 'bg-[#1E293B] border-gray-700 hover:border-gray-600'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <p className="text-white font-bold text-lg leading-tight">{cls.name}</p>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge.color}`}>{badge.label}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm">{cls.teacher} · {cls.time}</p>
                                                </div>
                                                <span className="text-white font-bold text-lg bg-black/20 px-3 py-1 rounded-lg">${cls.price}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-700/50">
                                                {inCart ? (
                                                    <div className="flex items-center bg-[#0F172A] rounded-lg border border-gray-600 p-1">
                                                        <span className="text-gray-400 text-xs pl-2 mr-1">Desc:</span>
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            min="0"
                                                            className="w-16 bg-transparent text-white text-sm outline-none text-center" 
                                                            placeholder="0"
                                                            value={inCart.discount === 0 ? '' : inCart.discount} 
                                                            onChange={e => validateAndSetDiscount(cls.id, e.target.value, cls.price, inCart.discountType)} 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => toggleDiscountType(cls.id, cls.price)} 
                                                            className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-0.5 text-xs font-bold text-white transition-colors ml-1 w-8"
                                                        >
                                                            {inCart.discountType}
                                                        </button>
                                                    </div>
                                                ) : <div></div>}

                                                <button type="button" onClick={() => toggleCartItem(cls)} 
                                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 ${inCart ? 'bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40' : 'bg-[#FF3888] text-white hover:bg-[#d61f68]'}`}>
                                                    {inCart ? 'Quitar' : 'Agregar'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800 mt-4 flex justify-between items-center">
                        <span className="text-xl font-bold text-white">Total:</span>
                        <span className="text-2xl font-bold text-[#FF3888]">${totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="mt-4">
                        <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Método de Pago</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['Efectivo', 'Transferencia'].map(m => (
                                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                    className={`p-3 rounded-xl font-semibold border text-sm transition-all ${paymentMethod === m ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white border-transparent' : 'bg-[#1E293B] border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 bg-[#1F2937]">
                    <button type="submit" disabled={loading} className="w-full h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:opacity-90 shadow-lg shadow-pink-900/40">
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar Registro y Cobro'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}