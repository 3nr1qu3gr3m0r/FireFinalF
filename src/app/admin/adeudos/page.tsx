"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";

// --- ChartJS Imports ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- TIPOS ---
interface Badge {
  id: number;
  nombre: string;
  color: string;
  imagen?: string;
}

interface Level {
  id: number;
  nombre: string;
  color: string;
}

interface User {
  id: number;
  nombre_completo: string;
  foto_perfil?: string;
  insignias?: Badge[];
  nivel?: Level; // Ahora usamos el objeto Level completo
  paquetes?: any[];
  totalDeuda: number;
}

// Colores por defecto para niveles si no vienen de la BD
const LEVEL_COLORS_FALLBACK: Record<string, string> = {
    'iniciacion': '#A855F7',
    'principiante': '#10B981',
    'intermedio': '#F59E0B',
    'avanzado': '#EF4444',
    'multinivel': '#3B82F6',
};

export default function DebtsPage() {
  const router = useRouter();
  
  const [debtors, setDebtors] = useState<User[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [levels, setLevels] = useState<Level[]>([]); // ✅ Nuevo estado para niveles
  const [loading, setLoading] = useState(true);
  
  const [filterBadge, setFilterBadge] = useState<number | 'all'>('all');

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const loadData = async () => {
        try {
            // ✅ Agregamos fetch de /levels
            const [usersData, badgesData, levelsData] = await Promise.all([
                fetchWithAuth('/users'),
                fetchWithAuth('/badges'),
                fetchWithAuth('/levels')
            ]);

            if (Array.isArray(badgesData)) setBadges(badgesData);
            if (Array.isArray(levelsData)) setLevels(levelsData);

            if (Array.isArray(usersData)) {
                const debtorsList = usersData
                    .map((u: any) => {
                        const totalDeuda = u.paquetes?.reduce((acc: number, pkg: any) => {
                            return acc + (Number(pkg.saldo_pendiente) || 0);
                        }, 0) || 0;
                        return { ...u, totalDeuda };
                    })
                    .filter((u: User) => u.totalDeuda > 0);

                setDebtors(debtorsList);
            }
        } catch (error) {
            console.error("Error cargando adeudos", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // --- 2. GRÁFICA POR NIVELES (Lógica Cambiada) ---
  const chartData = useMemo(() => {
      const dataMap: Record<number, number> = {};
      let noLevelDebt = 0;

      debtors.forEach(user => {
          if (user.nivel && user.nivel.id) {
              // Sumamos la deuda al ID del nivel del usuario
              dataMap[user.nivel.id] = (dataMap[user.nivel.id] || 0) + user.totalDeuda;
          } else {
              noLevelDebt += user.totalDeuda;
          }
      });

      const labels: string[] = [];
      const data: number[] = [];
      const colors: string[] = [];

      // Iteramos sobre los niveles disponibles para mantener el orden y color
      levels.forEach(lvl => {
          if (dataMap[lvl.id] > 0) {
              labels.push(lvl.nombre);
              data.push(dataMap[lvl.id]);
              
              // Usar color de BD o fallback
              const color = lvl.color || LEVEL_COLORS_FALLBACK[lvl.nombre.toLowerCase()] || '#6B7280';
              colors.push(color);
          }
      });

      if (noLevelDebt > 0) {
          labels.push('Sin Nivel');
          data.push(noLevelDebt);
          colors.push('#9CA3AF');
      }

      return {
          labels,
          datasets: [{
              data,
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 10
          }]
      };
  }, [debtors, levels]);

  // --- 3. FILTRADO (Se mantiene por Insignias) ---
  const filteredList = useMemo(() => {
      if (filterBadge === 'all') return debtors;
      return debtors.filter(u => u.insignias?.some(b => b.id === filterBadge));
  }, [debtors, filterBadge]);

  const totalFilteredDebt = useMemo(() => {
      return filteredList.reduce((acc, u) => acc + u.totalDeuda, 0);
  }, [filteredList]);

  return (
    <div className="pb-32 p-4 md:p-6 max-w-7xl mx-auto w-full min-h-screen bg-[#111827]">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- IZQUIERDA: GRÁFICA (NIVELES) Y FILTROS (INSIGNIAS) --- */}
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-2xl font-bold text-white">Resumen de Adeudos</h2>
                
                {/* GRÁFICA DE NIVELES */}
                <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col items-center">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-4 w-full text-left">Por Nivel</h3>
                    
                    <div className="w-64 h-64 relative">
                        {debtors.length > 0 ? (
                            <Doughnut 
                                data={chartData} 
                                options={{ cutout: '75%', plugins: { legend: { display: false } } }} 
                            />
                        ) : (
                            <div className="w-full h-full rounded-full border-4 border-gray-700 border-dashed flex items-center justify-center text-gray-500">Sin deudas</div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-gray-400 text-xs uppercase font-bold">Total General</span>
                            <span className="text-white text-xl font-bold">${debtors.reduce((acc, u) => acc + u.totalDeuda, 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Leyenda Gráfica */}
                    <div className="w-full mt-6 space-y-2">
                        {chartData.labels?.map((label, idx) => {
                            const val = chartData.datasets[0].data[idx] as number;
                            const color = chartData.datasets[0].backgroundColor?.[idx] as string;
                            return (
                                <div key={label as string} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                        <span className="text-gray-300">{label}</span>
                                    </div>
                                    <span className="text-white font-mono font-bold">${val.toLocaleString()}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* FILTROS POR INSIGNIA (Para la lista) */}
                <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-700">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-3">Filtrar lista por insignia:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        
                        <button 
                            onClick={() => setFilterBadge('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${filterBadge === 'all' ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                        >
                            Todas
                        </button>

                        {badges.map(b => {
                            const isActive = filterBadge === b.id;
                            const badgeColor = b.color || '#6B7280'; 

                            return (
                                <button 
                                    key={b.id}
                                    onClick={() => setFilterBadge(b.id)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2`}
                                    style={{
                                        backgroundColor: isActive ? `${badgeColor}20` : 'transparent',
                                        borderColor: isActive ? badgeColor : '#374151',
                                        color: isActive ? badgeColor : '#9CA3AF'
                                    }}
                                >
                                    {b.imagen ? (
                                        <img src={b.imagen} alt="" className="w-5 h-5 object-contain" />
                                    ) : (
                                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: badgeColor }}></span>
                                    )}
                                    {b.nombre}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-[#111827] p-4 rounded-xl border border-orange-900/50 text-center">
                    <p className="text-gray-400 text-sm">Deuda Filtrada (Lista)</p>
                    <p className="text-3xl font-extrabold text-orange-500">${totalFilteredDebt.toLocaleString()}</p>
                </div>
            </div>

            {/* --- DERECHA: LISTA --- */}
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-6">Alumnos con Adeudos</h2>
                
                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">Cargando deudas...</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center py-20 bg-[#1F2937]/50 rounded-xl border border-dashed border-gray-700">
                        <i className="fas fa-check-circle text-4xl text-green-500 mb-3 opacity-50"></i>
                        <p className="text-gray-400">¡Excelente! No hay alumnos con deuda en esta categoría.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredList.map(user => {
                            // Color del nivel del usuario para un detalle visual
                            const levelColor = user.nivel?.color || LEVEL_COLORS_FALLBACK[user.nivel?.nombre?.toLowerCase() || ''] || '#6B7280';

                            return (
                                <div 
                                    key={user.id}
                                    onClick={() => router.push(`/admin/students/${user.id}/payments`)} 
                                    className="bg-[#1F2937] rounded-xl p-5 border-l-4 shadow-lg hover:bg-gray-800 transition-all cursor-pointer group flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                                    style={{ borderLeftColor: '#F97316' }} // Borde naranja por ser deuda
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img 
                                                src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.nombre_completo}`} 
                                                className="w-14 h-14 rounded-full object-cover border-2 border-[#111827]" 
                                                alt={user.nombre_completo}
                                            />
                                            {/* Indicador de nivel en la foto */}
                                            {user.nivel && (
                                                <div 
                                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1F2937] flex items-center justify-center text-[8px] font-bold text-white"
                                                    style={{ backgroundColor: levelColor }}
                                                    title={`Nivel: ${user.nivel.nombre}`}
                                                >
                                                    {user.nivel.nombre.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg group-hover:text-orange-400 transition-colors">{user.nombre_completo}</h3>
                                            <div className="flex gap-2 mt-1">
                                                {/* Insignias Mini */}
                                                {user.insignias?.slice(0, 3).map(b => (
                                                    <div key={b.id} title={b.nombre}>
                                                        {b.imagen ? (
                                                            <img src={b.imagen} className="w-5 h-5 object-contain" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: b.color}}></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                        <div className="flex flex-col items-end gap-1 w-full">
                                            {user.paquetes?.filter((p: any) => Number(p.saldo_pendiente) > 0).map((p: any) => (
                                                <div key={p.id} className="flex justify-between w-full sm:w-64 text-sm bg-black/20 px-3 py-1.5 rounded-lg border border-orange-500/20">
                                                    <span className="text-gray-300 truncate mr-2">{p.plan?.nombre}</span>
                                                    <span className="text-orange-400 font-mono font-bold">${Number(p.saldo_pendiente).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-1 text-right">
                                            <span className="text-[10px] text-gray-500 uppercase mr-2 font-bold">Total a Pagar</span>
                                            <span className="text-xl font-bold text-white">${user.totalDeuda.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        <BottomNav />
    </div>
  );
}