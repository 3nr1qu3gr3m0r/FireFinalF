'use client';

import { useEffect, useState, use } from 'react';
import { fetchWithAuth } from '@/lib/api';
import Cookies from 'js-cookie'; 
import EditStudentModal from '@/components/admin/EditStudentModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Helper para obtener rol (Decodificación manual segura)
const getCurrentUserRole = () => {
  const token = Cookies.get('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return (payload.rol || payload.role || '').toLowerCase();
  } catch (e) {
    return null;
  }
};

const getDiasRestantes = (fechaExpiracion: string) => {
  if (!fechaExpiracion) return 0;
  const ahora = new Date();
  const expira = new Date(fechaExpiracion);
  ahora.setHours(0, 0, 0, 0);
  expira.setHours(0, 0, 0, 0);
  const diferencia = expira.getTime() - ahora.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
};

const LEVEL_COLORS: Record<string, string> = {
    'iniciacion': '#A855F7',
    'principiante': '#10B981',
    'intermedio': '#F59E0B',
    'avanzado': '#EF4444',
    'multinivel': '#3B82F6',
};

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [details, setDetails] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Estados para modales de confirmación
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]); // Para almacenar ventas del staff

  const loadData = async () => {
    try {
        // 1. Cargar Datos del Usuario
        const userData = await fetchWithAuth(`/users/${id}`);
        
        if (userData && userData.paquetes) {
             userData.paquetes.sort((a: any, b: any) => {
                 if (a.activo === b.activo) {
                     return new Date(a.fecha_expiracion).getTime() - new Date(b.fecha_expiracion).getTime();
                 }
                 return a.activo ? -1 : 1;
             });
        }
        setDetails(userData);

        // 2. Si es Staff, cargar sus ventas recientes (del día)
        if (userData.rol === 'recepcionista' || userData.rol === 'admin') {
            const allSales = await fetchWithAuth('/sales'); 
            if (Array.isArray(allSales)) {
                // Filtramos ventas hechas por este usuario HOY
                // Usamos toLocaleDateString('en-CA') para formato YYYY-MM-DD local consistente
                const today = new Date().toLocaleDateString('en-CA'); 
                
                const userSales = allSales.filter((s: any) => {
                    if (!s.vendedor || s.vendedor.id !== userData.id) return false;
                    const saleDate = new Date(s.fecha_venta).toLocaleDateString('en-CA');
                    return saleDate === today;
                });
                
                // Ordenar por fecha descendente (más recientes primero)
                userSales.sort((a: any, b: any) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime());
                
                setRecentSales(userSales);
            }
        }

    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
  };

  const confirmCancelPackage = async () => {
      if (!packageToDelete) return;
      try {
          await fetchWithAuth(`/sales/packages/${packageToDelete}`, { method: 'DELETE' });
          loadData(); 
      } catch (err: any) {
          console.error(err);
          alert('Error al cancelar: ' + (err.message || 'Error desconocido'));
      } finally {
        setPackageToDelete(null);
      }
  };

  const confirmDeleteSale = async () => {
      if (!saleToDelete) return;
      try {
          // Asumiendo que tu backend tiene DELETE /sales/:id
          await fetchWithAuth(`/sales/${saleToDelete}`, { method: 'DELETE' });
          loadData(); // Recargar para actualizar lista
      } catch (err: any) {
          console.error(err);
          alert('Error al eliminar venta: ' + (err.message || 'Error desconocido'));
      } finally {
        setSaleToDelete(null);
      }
  };

  // Helper para mostrar nombres de ítems
  const getSaleItemsNames = (items: any[]) => {
      if (!items || items.length === 0) return "Venta sin ítems";
      return items.map(i => {
          if (i.producto) return i.producto.nombre;
          if (i.clase) return `Clase: ${i.clase.nombre}`;
          if (i.plan) {
              // Si es tipo 'deuda', es un abono
              if (i.tipo === 'deuda') return `Abono a: ${i.plan.nombre}`;
              return `Plan: ${i.plan.nombre}`;
          }
          return "Ítem desconocido";
      }).join(', ');
  };

  useEffect(() => {
    loadData();
    const role = getCurrentUserRole();
    setIsAdmin(role === 'admin');
  }, [id]);

  if (!details) return <div className="text-center text-gray-500 mt-10 animate-pulse">Cargando perfil...</div>;

  const isStudentProfile = details.rol === 'alumno';
  const levelColor = details.nivel?.color || LEVEL_COLORS[details.nivel?.nombre?.toLowerCase()] || '#6B7280';

  return (
    <div className="bg-[#111827] min-h-screen p-4 pb-28">
        
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        
            {/* 1. TARJETA DE IDENTIDAD */}
            <div className="bg-[#1F2937] rounded-2xl p-6 relative shadow-lg border border-gray-700">
                <button 
                    onClick={() => setIsEditOpen(true)}
                    className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                >
                    <i className="fas fa-edit"></i> Editar
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#C4006B] to-[#FF3888] mb-4 shadow-[0_0_15px_rgba(196,0,107,0.4)]">
                        <img 
                            src={details.foto_perfil || `https://ui-avatars.com/api/?name=${details.nombre_completo}`} 
                            className="w-full h-full object-cover rounded-full bg-gray-900" 
                            alt="Perfil"
                        />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white">{details.nombre_completo}</h2>
                    <p className="text-gray-400 text-sm mb-4">ID: {details.id} • <span className="uppercase text-xs font-bold text-gray-500">{details.rol}</span></p>
                    
                    {/* INFO ALUMNO */}
                    {isStudentProfile && (
                        <div className="flex gap-2 mb-6">
                            <span 
                                className="text-white px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-sm"
                                style={{ 
                                    backgroundColor: `${levelColor}20`, 
                                    borderColor: levelColor,
                                    color: levelColor
                                }}
                            >
                                <i className="fas fa-layer-group"></i> {details.nivel?.nombre || 'Sin Nivel'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${details.activo ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                                <i className={`fas ${details.activo ? 'fa-check-circle' : 'fa-times-circle'}`}></i> {details.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    )}

                    {/* INFO STAFF: Dirección */}
                    {!isStudentProfile && details.direccion && (
                        <div className="mb-6 flex items-center gap-2 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-600">
                            <i className="fas fa-map-marker-alt text-red-400"></i>
                            <span className="text-sm">{details.direccion}</span>
                        </div>
                    )}

                    {/* INSIGNIAS (Solo Alumno) */}
                    {isStudentProfile && details.insignias && details.insignias.length > 0 && (
                        <div className="w-full border-t border-gray-700 pt-4">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Insignias</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {details.insignias.map((badge: any) => (
                                    <div key={badge.id} className="relative group flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                             style={{ borderColor: badge.color || '#4B5563' }}>
                                            {badge.imagen ? (
                                                <img 
                                                    src={badge.imagen} 
                                                    alt={badge.nombre} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <span className="text-xl">🏆</span> 
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. BLOQUE CONDICIONAL: PAQUETES (Alumno) o VENTAS (Staff) */}
            
            {/* CASO ALUMNO: Paquetes */}
            {isStudentProfile && (
                <div className="space-y-4">
                    <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-600 pb-2 flex items-center">
                            <i className="fas fa-ticket-alt text-yellow-500 mr-2"></i> Mis Paquetes
                        </h3>
                        
                        {details.paquetes?.filter((p: any) => p.activo).length > 0 ? (
                            <div className="space-y-4">
                                {details.paquetes.filter((p: any) => p.activo).map((paquete: any) => {
                                    const diasRestantes = getDiasRestantes(paquete.fecha_expiracion);
                                    const tieneDeuda = (paquete.saldo_pendiente && Number(paquete.saldo_pendiente) > 0); 
                                    
                                    return (
                                        <div key={paquete.id} className={`relative p-4 rounded-lg border-l-4 overflow-hidden group hover:bg-gray-700/50 transition-colors
                                            ${tieneDeuda ? 'bg-red-900/10 border-red-500' : 'bg-gradient-to-r from-gray-800 to-gray-750 border-green-500'}
                                        `}>
                                            {isAdmin && (
                                                <div className="absolute top-2 right-2 z-20">
                                                    <button onClick={() => setPackageToDelete(paquete.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-500/10">
                                                        <i className="fas fa-trash-alt text-sm"></i>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start z-10 relative pr-6">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-white text-lg leading-tight">
                                                        {paquete.plan?.nombre || paquete.producto?.nombre || 'Paquete Personalizado'}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-400">Vence: {new Date(paquete.fecha_expiracion).toLocaleDateString()}</span>
                                                        <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${diasRestantes < 0 ? 'bg-red-900/50 text-red-400 border-red-800' : diasRestantes <= 5 ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800' : 'bg-blue-900/30 text-blue-400 border-blue-800'}`}>
                                                            {diasRestantes < 0 ? 'Vencido' : `${diasRestantes} días vigentes`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`block text-2xl font-bold ${paquete.clases_restantes <= 2 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                                                        {paquete.clases_restantes}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Clases</span>
                                                </div>
                                            </div>
                                            {tieneDeuda && (
                                                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded p-2 flex items-center gap-2 text-red-300 text-xs font-bold">
                                                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                                                    <span>Pago pendiente: ${Number(paquete.saldo_pendiente).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 bg-[#111827]/50 rounded-xl border border-dashed border-gray-700">
                                <i className="fas fa-ghost text-3xl mb-3 opacity-30"></i>
                                <p className="text-sm">No tienes paquetes activos.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CASO STAFF: Ventas del Día */}
            {!isStudentProfile && (
                <div className="space-y-4">
                    <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-600 pb-2 flex items-center justify-between">
                            <span className="flex items-center"><i className="fas fa-cash-register text-green-400 mr-2"></i> Ventas de Hoy</span>
                            <span className="text-sm bg-green-900/30 text-green-400 px-3 py-1 rounded-full font-bold border border-green-800">
                                Total: ${recentSales.reduce((sum, s) => sum + Number(s.total), 0).toFixed(2)}
                            </span>
                        </h3>
                        
                        {recentSales.length > 0 ? (
                            <div className="space-y-3">
                                {recentSales.map((sale: any) => (
                                    <div key={sale.id} className="bg-[#111827] p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-gray-500 transition-colors">
                                        <div className="flex-1 pr-4">
                                            {/* 👇 NOMBRE DEL ÍTEM (CORREGIDO) */}
                                            <p className="text-white font-bold text-sm truncate">
                                                {getSaleItemsNames(sale.items)}
                                            </p>
                                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                                <span>{new Date(sale.fecha_venta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span>•</span>
                                                <span className="uppercase text-gray-400 font-bold">{sale.metodo_pago}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                Cliente: {sale.nombre_cliente_externo || sale.comprador?.nombre_completo || 'Público General'}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <span className="text-green-400 font-bold font-mono text-lg">${Number(sale.total).toFixed(2)}</span>
                                            
                                            {/* Botón Eliminar Venta (Solo Admin) */}
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => setSaleToDelete(sale.id)}
                                                    className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
                                                    title="Eliminar Venta"
                                                >
                                                    <i className="fas fa-trash-alt text-lg"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                                <i className="fas fa-receipt text-4xl mb-3 opacity-30"></i>
                                <p>No hay ventas registradas hoy.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. CONTACTO Y EMERGENCIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-700">
                   <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 tracking-wider">Contacto</h3>
                   <ul className="space-y-4 text-sm">
                       <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-pink-500 shrink-0"><i className="fas fa-envelope"></i></div>
                           <div>
                               <p className="text-gray-400 text-xs">Correo</p>
                               <p className="text-white font-medium break-all">{details.correo}</p>
                           </div>
                       </li>
                       <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-green-500 shrink-0"><i className="fab fa-whatsapp"></i></div>
                           <div>
                               <p className="text-gray-400 text-xs">Teléfono</p>
                               <p className="text-white font-medium">{details.whatsapp || '---'}</p>
                           </div>
                       </li>
                       <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-purple-500 shrink-0"><i className="fab fa-instagram"></i></div>
                           <div>
                               <p className="text-gray-400 text-xs">Instagram</p>
                               <p className="text-white font-medium">{details.instagram || '---'}</p>
                           </div>
                       </li>
                   </ul>
                </div>

                <div className="space-y-4">
                    <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/40">
                        <h3 className="text-red-400 text-xs font-bold uppercase mb-4 tracking-wider"><i className="fas fa-ambulance mr-1"></i> Emergencia</h3>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Nombre:</span>
                            <span className="text-white font-bold text-sm text-right">{details.emergencia_nombre || '---'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Teléfono:</span>
                            <span className="text-white font-bold text-sm text-right">{details.emergencia_telefono || '---'}</span>
                        </div>
                    </div>

                    <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-700">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2 tracking-wider">Info Médica</h3>
                        <p className="text-sm text-gray-300 italic bg-gray-800 p-3 rounded-lg border border-gray-700 min-h-[60px]">
                            {details.informacion_medica || 'Sin observaciones registradas.'}
                        </p>
                    </div>
                </div>
            </div>

            <EditStudentModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                studentData={details}
                onUpdate={loadData}
            />

            {/* Modal Confirmación Borrar PAQUETE */}
            <ConfirmationModal 
                isOpen={!!packageToDelete}
                onClose={() => setPackageToDelete(null)}
                onConfirm={confirmCancelPackage}
                title="¿Cancelar Paquete?"
                message="El paquete se desactivará inmediatamente. ¿Deseas continuar?"
            />

            {/* Modal Confirmación Borrar VENTA */}
            <ConfirmationModal 
                isOpen={!!saleToDelete}
                onClose={() => setSaleToDelete(null)}
                onConfirm={confirmDeleteSale}
                title="¿Eliminar Venta?"
                message="Esta acción es irreversible y afectará los reportes de caja. ¿Estás seguro?"
            />
        </div>
    </div>
  );
}