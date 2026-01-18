"use client";
import { useState, useEffect } from "react";
import StoreBottomNav from "@/components/admin/tienda/StoreBottomNav";
import ProductModal from "@/components/admin/tienda/ProductModal";
import CustomAlert from "@/components/ui/CustomAlert"; 
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // 👈 IMPORTAR
import Cookies from "js-cookie";

interface Product {
  id: number;
  nombre: string;
  precio: number;
  tienda: string;
}

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA ALERTAS Y CONFIRMACIONES ---
  const [alert, setAlert] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    show: false, message: '', type: 'success'
  });

  // Estado para el modal de borrar
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; idToDelete: number | null }>({
    isOpen: false, idToDelete: null
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error cargando productos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (data: any) => {
    // La validación ya la hace el Modal y nos avisa si hay error via onShowAlert
    // Si llega aquí, es porque los datos "parecen" válidos, pero hacemos doble check
    const precioFinal = Math.round(parseFloat(data.precio) * 100) / 100;

    const token = Cookies.get("token");
    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct 
        ? `${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/products`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ...data, precio: precioFinal })
        });

        if (res.ok) {
            await fetchProducts(); 
            setIsModalOpen(false);
            setEditingProduct(null);
            showAlert(editingProduct ? "Producto actualizado correctamente" : "Producto creado exitosamente", "success");
        } else {
            const errorData = await res.json();
            showAlert(errorData.message || "Error al guardar", "error");
        }
    } catch (error) {
        showAlert("Error de conexión", "error");
    }
  };

  // 1. SOLICITAR BORRADO (Abre modal)
  const requestDelete = (id: number) => {
    setConfirmModal({ isOpen: true, idToDelete: id });
  };

  // 2. EJECUTAR BORRADO (Al confirmar)
  const confirmDelete = async () => {
    if (!confirmModal.idToDelete) return;

    const token = Cookies.get("token");
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${confirmModal.idToDelete}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
            setProducts(products.filter(p => p.id !== confirmModal.idToDelete));
            showAlert("Producto eliminado de la base de datos", "success");
        } else {
            showAlert("No se pudo eliminar el producto", "error");
        }
    } catch (error) {
        console.error(error);
        showAlert("Error de conexión", "error");
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="pb-32 p-6 md:p-8 max-w-7xl mx-auto w-full"> 
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white tracking-wide">Tienda</h2>
            <p className="text-gray-400 text-sm mt-1">Administra el catálogo de productos</p>
        </div>
        <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-gray-700">
            {products.length} Productos
        </span>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <i className="fas fa-circle-notch fa-spin text-4xl text-[#FF3888] mb-4"></i>
            <p className="text-white">Cargando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <div key={product.id} className="bg-[#1E293B] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-800">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-white leading-snug line-clamp-2">{product.nombre}</h3>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg text-white tracking-wider shrink-0 ml-2 ${
                                product.tienda === 'sens' 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                                : 'bg-gradient-to-r from-[#C4006B] to-[#FF3888]'
                            }`}>
                                {product.tienda}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-gray-400 text-sm font-medium">$</span>
                            <p className="text-white font-bold text-3xl">{Number(product.precio).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-gray-700/50 divide-x divide-gray-700/50 bg-[#17202e]">
                        <button onClick={() => openEdit(product)} className="py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            <i className="fas fa-pencil-alt text-xs"></i> Editar
                        </button>
                        <button 
                            onClick={() => requestDelete(product.id)} // 👈 Usamos requestDelete en vez de borrar directo
                            className="py-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash-alt text-xs"></i> Eliminar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={openCreate} className="fixed bottom-24 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white text-xl md:text-2xl shadow-xl shadow-pink-900/50 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center z-30">
        <i className="fas fa-plus"></i>
      </button>

      {/* MODALES */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave}
        initialData={editingProduct}
        onShowAlert={showAlert} // 👈 Pasamos la función de alerta
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar producto?"
        message="Se borrará permanentemente de la base de datos."
      />

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