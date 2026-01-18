"use client";
import { useState, useEffect } from "react";
import StoreBottomNav from "@/components/admin/tienda/StoreBottomNav";
import CustomAlert from "@/components/ui/CustomAlert";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

// Interfaces
interface Product {
  id: number;
  nombre: string;
  precio: number;
  tienda: 'academia' | 'sens';
}

interface CartItem extends Product {
  quantity: number;
}

export default function RegistrarVentaPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'academia' | 'sens'>('all');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' as 'success'|'error'|'warning' });
  const showAlert = (msg: string, type: 'success'|'error'|'warning' = 'success') => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  // Cargar productos
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Feedback visual opcional
    // showAlert(`${product.nombre} agregado`, 'success'); 
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (Number(item.precio) * item.quantity), 0);

  // --- FINALIZAR VENTA ---
  const handleFinalize = async () => {
    if (cart.length === 0) return showAlert("El carrito está vacío", "warning");

    setLoading(true);
    const token = Cookies.get("token"); // Necesitamos el token para saber QUIÉN vende
    
    // Recuperamos usuario del localStorage para obtener su ID (opción rápida si no hay Guard estricto)
    // O mejor, confiamos en que el backend decodifique el token.
    // Vamos a enviar la estructura que espera el DTO
    
    const payload = {
        items: cart.map(item => ({ producto_id: item.id, cantidad: item.quantity })),
        metodo_pago: paymentMethod
    };

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Backend debe usar JwtAuthGuard
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showAlert(`Venta registrada por $${total.toFixed(2)}`, 'success');
            setCart([]); // Limpiar carrito
        } else {
            const error = await res.json();
            showAlert(error.message || "Error al registrar venta", "error");
        }
    } catch (err) {
        showAlert("Error de conexión", "error");
    } finally {
        setLoading(false);
    }
  };

  // Filtrado visual
  const filteredProducts = filter === 'all' ? products : products.filter(p => p.tienda === filter);

  return (
    <div className="pb-40 p-4 md:p-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <h2 className="text-3xl font-bold text-white mb-6 tracking-wide">Registrar Venta</h2>

      {/* FILTROS */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {[
            { key: 'all', label: 'Todos', color: 'bg-gray-700' },
            { key: 'academia', label: 'Academia', color: 'bg-[#C4006B]' },
            { key: 'sens', label: 'SENS', color: 'bg-purple-600' }
        ].map((f) => (
            <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    filter === f.key 
                    ? (f.key === 'all' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : `${f.color} text-white shadow-lg`)
                    : 'bg-[#1E293B] text-gray-400 hover:bg-[#2D3F59]'
                }`}
            >
                {f.label}
            </button>
        ))}
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredProducts.map(product => (
            <div key={product.id} className="bg-[#1E293B] rounded-xl overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all border border-gray-800">
                <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-md leading-tight">{product.nombre}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md text-white ml-2 ${
                            product.tienda === 'sens' ? 'bg-purple-600' : 'bg-[#C4006B]'
                        }`}>
                            {product.tienda}
                        </span>
                    </div>
                    <p className="text-[#FF3888] font-bold text-xl">${Number(product.precio).toFixed(2)}</p>
                </div>
                <button 
                    onClick={() => addToCart(product)}
                    className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-[#C4006B] hover:to-[#FF3888] text-gray-300 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <i className="fas fa-plus"></i> Agregar
                </button>
            </div>
        ))}
      </div>

      {/* RESUMEN DE VENTA (Sticky Bottom o Sección fija) */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-shopping-cart text-[#FF3888]"></i> Resumen
        </h3>
        
        {/* Lista Items */}
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4 italic">El carrito está vacío.</p>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-[#1E293B] p-3 rounded-xl border border-gray-700">
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm">{item.nombre}</p>
                            <p className="text-[#FF3888] text-xs font-bold">${Number(item.precio).toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-[#111827] rounded-lg px-2 py-1 mx-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center font-bold">-</button>
                            <span className="text-white text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center font-bold">+</button>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-white font-bold text-sm">${(Number(item.precio) * item.quantity).toFixed(2)}</span>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-300 text-xs">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Totales y Pago */}
        <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center text-2xl font-bold text-white mb-6">
                <span>Total</span>
                <span className="text-[#FF3888]">${total.toFixed(2)}</span>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-400 mb-3">Método de Pago</label>
                <div className="flex gap-3">
                    {['Efectivo', 'Transferencia'].map(method => (
                        <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                                paymentMethod === method
                                ? 'bg-[#FF3888]/20 border-[#FF3888] text-[#FF3888]'
                                : 'bg-[#1E293B] border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleFinalize}
                disabled={loading || cart.length === 0}
                className="w-full h-14 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:shadow-lg hover:shadow-pink-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Finalizar Venta'}
            </button>
        </div>
      </div>

      <CustomAlert 
        isVisible={alert.show} 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert(prev => ({ ...prev, show: false }))} 
      />
      
      <StoreBottomNav />
    </div>
  );
}