"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";
import RandomWinnerModal from "@/components/admin/RandomWinnerModal"; 
import RegisterStudentModal from "@/components/admin/RegisterStudentModal";

// --- TIPOS ---
interface Badge {
  id: number;
  nombre: string;
  imagen: string;
  color: string;
}

interface Level {
  id: number;
  nombre: string;
  color: string;
}

interface User {
  id: number;
  nombre_completo: string;
  rol: 'admin' | 'recepcionista' | 'alumno';
  foto_perfil?: string;
  fecha_nacimiento?: string;
  instagram?: string;
  nivel?: Level;
  insignias?: Badge[];
  paquetes?: any[];
  activo: boolean; 
  stats?: {
      monthlySalesCount: number;
      monthlyTotal: number;
  };
}

const LEVEL_COLORS_FALLBACK: Record<string, string> = {
    'iniciacion': '#A855F7',
    'principiante': '#10B981',
    'intermedio': '#F59E0B',
    'avanzado': '#EF4444',
    'multinivel': '#3B82F6',
};

export default function CommunityPage() {
  const router = useRouter();
  
  // Estados de Datos
  const [users, setUsers] = useState<User[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [userTypeFilter, setUserTypeFilter] = useState<'alumno' | 'recepcionista'>('alumno');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [badgeFilter, setBadgeFilter] = useState<number | 'all'>('all');

  // Estado de UI / Sesión
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  
  // Estados para Modales
  const [isRaffleOpen, setIsRaffleOpen] = useState(false); 
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // ✅ Estado para el modal de registro

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' as any });

  const showAlert = (msg: string, type = 'success') => {
      setAlert({ show: true, msg, type: type as any });
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  // ✅ CORRECCIÓN: Definimos loadData AQUÍ (fuera del useEffect) para poder reutilizarla
  const loadData = async () => {
    setLoading(true);
    try {
        const [usersData, levelsData, badgesData] = await Promise.all([
            fetchWithAuth('/users'),
            fetchWithAuth('/levels'),
            fetchWithAuth('/badges')
        ]);

        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(levelsData)) setLevels(levelsData);
        if (Array.isArray(badgesData)) setBadges(badgesData);

    } catch (error) {
        console.error(error);
        showAlert("Error al cargar la comunidad", "error");
    } finally {
        setLoading(false);
    }
  };

  // 1. CARGA INICIAL (Auth y Datos)
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
        router.push('/');
        return;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setCurrentUserRole((payload.rol || payload.role || '').toLowerCase());
    } catch (e) {
        router.push('/');
        return;
    }

    loadData(); // Llamamos a la función definida arriba
  }, [router]);

  const filteredUsers = useMemo(() => {
      return users.filter(user => {
          if (user.rol !== userTypeFilter) return false;

          if (userTypeFilter === 'alumno') {
              if (levelFilter !== 'all' && user.nivel?.id !== levelFilter) return false;
              if (badgeFilter !== 'all' && !user.insignias?.some(b => b.id === badgeFilter)) return false;
          }
          return true;
      });
  }, [users, userTypeFilter, levelFilter, badgeFilter]);

  const handleCardClick = (userId: number) => {
    const user = users.find(u => u.id === userId);
    const typeParam = user ? `?type=${user.rol}` : '';
    router.push(`/admin/students/${userId}${typeParam}`);
  };

  const calculateAge = (dateString?: string) => {
      if (!dateString) return '??';
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  const isBirthdayMonth = (dateString?: string) => {
      if (!dateString) return false;
      return new Date(dateString).getMonth() === new Date().getMonth();
  };

  const showTypeSelector = currentUserRole === 'admin';

  return (
    <div className="pb-32 p-4 md:p-6 max-w-7xl mx-auto w-full min-h-screen bg-[#111827]">
        
        {/* Cabecera con Título y Botones */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Comunidad</h2>
            
            <div className="flex gap-3">
                {/* BOTÓN SORTEO */}
                <button 
                    onClick={() => setIsRaffleOpen(true)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                    title="Realizar Sorteo Aleatorio"
                >
                    <i className="fas fa-gift text-lg"></i>
                </button>

                {/* ✅ BOTÓN NUEVO USUARIO (Faltaba este botón para abrir el modal) */}
                <button 
                    onClick={() => setIsRegisterOpen(true)}
                    className="bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                    title="Registrar Nuevo Usuario"
                >
                    <i className="fas fa-plus text-lg"></i>
                </button>
            </div>
        </div>

        {/* --- SECCIÓN DE FILTROS --- */}
        <div className="bg-[#1F2937] p-4 rounded-xl mb-6 flex flex-col gap-4">
            
            {/* 1. Selector Tipo Usuario (Solo Admin) */}
            {showTypeSelector && (
                <div className="flex justify-center md:justify-start">
                    <div className="bg-[#111827] p-1 rounded-lg flex w-full md:w-auto">
                        <button 
                            onClick={() => setUserTypeFilter('alumno')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-bold transition-all ${userTypeFilter === 'alumno' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Alumnos
                        </button>
                        <button 
                            onClick={() => setUserTypeFilter('recepcionista')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-bold transition-all ${userTypeFilter === 'recepcionista' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Staff
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Filtros de Alumno (Nivel e Insignia) */}
            {userTypeFilter === 'alumno' && (
                <div className="flex flex-col gap-4">
                    
                    {/* Filtro Niveles */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <span className="text-gray-400 text-xs font-bold uppercase whitespace-nowrap">Nivel:</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLevelFilter('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${levelFilter === 'all' ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                            >
                                Todos
                            </button>
                            {levels.map(lvl => (
                                <button 
                                    key={lvl.id}
                                    onClick={() => setLevelFilter(lvl.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap`}
                                    style={{ 
                                        backgroundColor: levelFilter === lvl.id ? (lvl.color || '#3B82F6') : 'transparent',
                                        borderColor: lvl.color || '#3B82F6',
                                        color: levelFilter === lvl.id ? '#FFF' : (lvl.color || '#3B82F6')
                                    }}
                                >
                                    {lvl.nombre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtro Insignias */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide border-t border-gray-700 pt-3">
                        <span className="text-gray-400 text-xs font-bold uppercase whitespace-nowrap">Insignia:</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setBadgeFilter('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${badgeFilter === 'all' ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                            >
                                Todas
                            </button>
                            {badges.map(b => (
                                <button 
                                    key={b.id}
                                    onClick={() => setBadgeFilter(b.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2`}
                                    style={{ 
                                        backgroundColor: badgeFilter === b.id ? (b.color || '#6B7280') : 'transparent',
                                        borderColor: b.color || '#6B7280',
                                        color: badgeFilter === b.id ? '#FFF' : (b.color || '#6B7280')
                                    }}
                                >
                                    {b.imagen && <img src={b.imagen} alt="" className="w-3 h-3 object-contain" />}
                                    {b.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- GRID DE USUARIOS --- */}
        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">Cargando comunidad...</div>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-[#1F2937]/50 rounded-xl border border-dashed border-gray-700">
                No se encontraron usuarios con estos filtros.
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredUsers.map(user => {
                    const userLevelColor = user.nivel?.color || LEVEL_COLORS_FALLBACK[user.nivel?.nombre?.toLowerCase() || ''] || '#6B7280';

                    return (
                        <div 
                            key={user.id} 
                            onClick={() => handleCardClick(user.id)}
                            className="bg-[#1F2937] rounded-xl p-6 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-transform cursor-pointer border border-gray-800 hover:border-gray-600 shadow-lg"
                        >
                            {/* Menú de Acciones (Solo Admin) */}
                            {currentUserRole === 'admin' && (
                                <div className="absolute top-2 right-2 z-10">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActivePopoverId(activePopoverId === user.id ? null : user.id); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                    {activePopoverId === user.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                            <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${user.id}`); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                <i className="fas fa-eye"></i> Ver Perfil
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Avatar */}
                            <div className="relative w-20 h-20 mb-3">
                                <img 
                                    src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.nombre_completo}&background=random`} 
                                    alt={user.nombre_completo}
                                    className="w-full h-full rounded-full object-cover border-2 border-[#1F2937] ring-2 ring-[#FF3888]"
                                />
                                {userTypeFilter === 'alumno' && isBirthdayMonth(user.fecha_nacimiento) && (
                                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg animate-bounce" title="¡Cumpleaños este mes!">
                                        <i className="fas fa-birthday-cake"></i>
                                    </div>
                                )}
                            </div>

                            {/* Info Principal */}
                            <h3 className="text-white font-bold text-lg leading-tight mb-1">{user.nombre_completo}</h3>
                            
                            {userTypeFilter === 'alumno' ? (
                                <>
                                    <div className="text-gray-400 text-xs flex items-center gap-2 mb-3">
                                        <span>{calculateAge(user.fecha_nacimiento)} años</span>
                                        {user.instagram && (
                                            <>
                                                <span>•</span>
                                                <a href={`https://instagram.com/${user.instagram.replace('@','')}`} target="_blank" onClick={e => e.stopPropagation()} className="hover:text-[#FF3888] transition-colors flex items-center gap-1">
                                                    <i className="fab fa-instagram"></i> {user.instagram}
                                                </a>
                                            </>
                                        )}
                                    </div>

                                    {/* Nivel Tag */}
                                    <span 
                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border mb-3"
                                        style={{ 
                                            borderColor: userLevelColor, 
                                            color: userLevelColor,
                                            backgroundColor: `${userLevelColor}15`
                                        }}
                                    >
                                        {user.nivel?.nombre || 'Sin Nivel'}
                                    </span>

                                    {/* Insignias */}
                                    {user.insignias && user.insignias.length > 0 ? (
                                        <div className="flex justify-center gap-2 mb-3">
                                            {user.insignias.slice(0, 3).map(badge => (
                                                <div 
                                                    key={badge.id} 
                                                    className="w-7 h-7 rounded-full bg-gray-800 border flex items-center justify-center overflow-hidden shadow-sm" 
                                                    style={{ borderColor: badge.color || '#4B5563' }}
                                                    title={badge.nombre}
                                                >
                                                    {badge.imagen ? (
                                                        <img src={badge.imagen} alt={badge.nombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px]" style={{color: badge.color}}>★</span>
                                                    )}
                                                </div>
                                            ))}
                                            {user.insignias.length > 3 && (
                                                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-white font-bold border border-gray-600">
                                                    +{user.insignias.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-7 mb-3"></div>
                                    )}

                                    {/* Barra de Progreso */}
                                    {user.paquetes?.filter(p => p.activo).map((pkg: any) => {
                                        const total = pkg.clases_totales || 1;
                                        const left = pkg.clases_restantes || 0;
                                        const percent = ((total - left) / total) * 100;
                                        
                                        return (
                                            <div key={pkg.id} className="w-full mt-auto pt-3 border-t border-gray-700">
                                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                    <span>{pkg.plan?.nombre || 'Paquete'}</span>
                                                    <span className={left <= 2 ? 'text-red-400 font-bold' : 'text-green-400'}>{left} clases</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[#C4006B] to-[#FF3888]" style={{ width: `${Math.max(5, percent)}%` }}></div>
                                                </div>
                                            </div>
                                        )
                                    })[0] || (
                                        <div className="w-full mt-auto pt-3 border-t border-gray-700 text-[10px] text-gray-500 italic">
                                            Sin paquete activo
                                        </div>
                                    )}
                                </>
                            ) : (
                                // --- TARJETA DE STAFF ---
                                <div className="mt-2 w-full pt-3 border-t border-gray-700">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-white">
                                                {user.stats?.monthlySalesCount || 0}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase">Ventas Mes</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-400">
                                                ${(user.stats?.monthlyTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase">Total Mes</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {activePopoverId && (
            <div className="fixed inset-0 z-0" onClick={() => setActivePopoverId(null)}></div>
        )}

        {/* 👇 MODAL DEL SORTEO */}
        <RandomWinnerModal 
            isOpen={isRaffleOpen}
            onClose={() => setIsRaffleOpen(false)}
            students={users} 
        />

        {/* 👇 MODAL DE REGISTRO (Con referencia corregida a loadData) */}
        <RegisterStudentModal 
            isOpen={isRegisterOpen} 
            onClose={() => setIsRegisterOpen(false)} 
            onRegisterSuccess={loadData} // ✅ Ahora sí funciona
        />

        <CustomAlert isVisible={alert.show} message={alert.msg} type={alert.type} onClose={() => setAlert(prev => ({...prev, show: false}))} />
        <BottomNav />
    </div>
  );
}