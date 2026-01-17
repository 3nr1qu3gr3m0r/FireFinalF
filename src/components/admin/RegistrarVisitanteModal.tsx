"use client";
import { useState, useMemo, useEffect } from "react";

// --- TIPOS ---
type ClassItem = {
  id: string;
  name: string;
  teacher: string;
  time: string;
  price: number;
};
type CartItem = ClassItem & { discount: number; discountType: "%" | "$" };

// --- DATOS MOCK ---
const MOCK_TODAY_CLASSES: ClassItem[] = [
  { id: 'vc1', name: 'Hip Hop Coreográfico', teacher: 'Ana Pérez', time: 'Hoy 19:00', price: 150 },
  { id: 'vc2', name: 'Jazz Funk', teacher: 'Carlos Ruíz', time: 'Hoy 20:00', price: 150 },
  { id: 'vc3', name: 'Twerk Iniciación', teacher: 'Valeria G.', time: 'Hoy 21:00', price: 170 }
];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrarVisitanteModal({ isOpen, onClose }: ModalProps) {
  // 1. --- TODOS LOS HOOKS PRIMERO (Siempre deben ejecutarse) ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorAge, setVisitorAge] = useState("");
  const [visitorSocial, setVisitorSocial] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");

  // Hook useEffect
  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setVisitorName("");
      setVisitorAge("");
      setVisitorSocial("");
      setPaymentMethod("Efectivo");
    }
  }, [isOpen]);

  // Hook useMemo
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

  // Funciones auxiliares (No son hooks, pero las definimos aquí)
  const toggleCartItem = (cls: ClassItem) => {
    const exists = cart.find(i => i.id === cls.id);
    if (exists) setCart(cart.filter(i => i.id !== cls.id));
    else setCart([...cart, { ...cls, discount: 0, discountType: "%" }]);
  };

  const updateDiscount = (id: string, val: number) => {
    setCart(cart.map(i => i.id === id ? { ...i, discount: val } : i));
  };

  const toggleDiscountType = (id: string) => {
    setCart(cart.map(i => i.id === id ? { ...i, discountType: i.discountType === "%" ? "$" : "%" } : i));
  };

  const handleRegisterVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return alert("Ingresa el nombre del visitante");
    if (cart.length === 0) return alert("Selecciona al menos una clase");
    
    // AQUÍ IRÍA EL FETCH AL BACKEND
    console.log({ visitorName, visitorAge, visitorSocial, cart, totalAmount, paymentMethod });
    
    alert(`✅ Visitante ${visitorName} registrado. Total: $${totalAmount.toFixed(2)} (${paymentMethod})`);
    onClose();
  };

  // 2. --- CONDICIONAL DE RETORNO (Ahora sí podemos salir si está cerrado) ---
  if (!isOpen) return null;

  // 3. --- RENDERIZADO (JSX) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[#111827] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="px-8 py-5 bg-[#1F2937] border-b border-gray-700 flex justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <i className="fas fa-user-plus text-[#FF3888] flex-shrink-0 text-2xl"></i> 
                    <span className="leading-tight">Registrar Visitante</span>
                </h2>
                
                <button 
                    onClick={onClose} 
                    // Agregué un poco más de padding al botón mismo (p-2) para que sea más fácil de tocar
                    className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 rounded-lg hover:bg-white/10 flex-shrink-0"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Body Modal (Form) */}
            <form onSubmit={handleRegisterVisitor} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar bg-[#111827]">
                    
                    {/* Inputs Datos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 font-bold text-gray-400 text-xs uppercase">Nombre</label>
                            <input type="text" required 
                                className="w-full bg-[#1E293B] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-[#FF3888]"
                                value={visitorName} onChange={e => setVisitorName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block mb-2 font-bold text-gray-400 text-xs uppercase">Edad</label>
                            <input type="number" 
                                className="w-full bg-[#1E293B] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-[#FF3888]"
                                value={visitorAge} onChange={e => setVisitorAge(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 font-bold text-gray-400 text-xs uppercase">Red Social</label>
                        <input type="text" placeholder="@usuario" 
                            className="w-full bg-[#1E293B] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-[#FF3888]"
                            value={visitorSocial} onChange={e => setVisitorSocial(e.target.value)} />
                    </div>

                    <hr className="border-gray-800 my-6" />

                    {/* Lista de Clases */}
                    <div>
                        <h3 className="text-sm font-bold text-[#FF3888] uppercase mb-3">Clases de Hoy</h3>
                        <div className="space-y-3">
                            {MOCK_TODAY_CLASSES.map(cls => {
                                const inCart = cart.find(c => c.id === cls.id);
                                return (
                                    <div key={cls.id} className={`p-4 rounded-xl border transition-all ${inCart ? 'bg-[#1E293B] border-[#FF3888]' : 'bg-[#1E293B] border-gray-700'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-bold">{cls.name}</p>
                                                <p className="text-gray-400 text-xs">{cls.teacher} · {cls.time}</p>
                                            </div>
                                            <span className="text-white font-bold">${cls.price}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-2 mt-2">
                                            {/* Control Descuento */}
                                            {inCart ? (
                                                <div className="flex items-center">
                                                    <input type="number" className="w-16 bg-[#0F172A] border border-gray-600 rounded-l-lg p-1 text-white text-sm outline-none text-center" 
                                                        placeholder="0"
                                                        value={inCart.discount || ''} onChange={e => updateDiscount(cls.id, +e.target.value)} />
                                                    <button type="button" onClick={() => toggleDiscountType(cls.id)} className="bg-gray-700 border border-gray-700 border-l-0 rounded-r-lg px-2 py-1 text-white font-bold text-xs">
                                                        {inCart.discountType}
                                                    </button>
                                                </div>
                                            ) : <div></div>}

                                            <button type="button" onClick={() => toggleCartItem(cls)} 
                                                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-transform active:scale-95 ${inCart ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-[#FF3888] text-white hover:bg-[#d61f68]'}`}>
                                                {inCart ? 'Quitar' : 'Agregar'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Resumen Total */}
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-center text-xl font-bold text-white">
                            <span>Total a Pagar:</span>
                            <span className="text-[#FF3888]">${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Método de Pago */}
                    <div>
                        <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Método de Pago</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['Efectivo', 'Transferencia'].map(m => (
                                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                    className={`p-3 rounded-xl font-semibold border flex items-center justify-center gap-2 transition-all text-sm ${
                                        paymentMethod === m 
                                        ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white border-transparent shadow-lg' 
                                        : 'bg-[#1E293B] border-gray-700 text-gray-300 hover:bg-gray-700'
                                    }`}>
                                    <i className={`fas ${m === 'Efectivo' ? 'fa-money-bill-wave' : 'fa-credit-card'}`}></i> {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Modal (Botón Submit) */}
                <div className="p-6 border-t border-gray-700 bg-[#1F2937]">
                    <button type="submit" className="w-full h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:opacity-90 transition-transform active:scale-[0.98] shadow-lg shadow-pink-900/40">
                        Confirmar Registro y Cobro
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}