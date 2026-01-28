"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";
import CustomDatePicker from "@/components/ui/CustomDatePicker"; // Tu componente
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // Reutilizamos tu modal de borrar

// --- ChartJS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Tipos ---
interface Movement {
    id: number;
    tipo: 'ingreso' | 'egreso';
    monto: number; // Viene como string de la BD a veces
    descripcion: string;
    fecha: string;
    usuario?: { nombre_completo: string };
}

export default function ConsultasPage() {
  // Estado de Fechas (Por defecto 1er día del mes - Hoy)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  
  // Datos
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // UI
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' as any });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 1. Verificar Rol
  useEffect(() => {
      const token = Cookies.get("token");
      if (token) {
          try {
              const base64Url = token.split('.')[1];
              const jsonPayload = decodeURIComponent(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
              const decoded = JSON.parse(jsonPayload);
              setIsAdmin(decoded.rol === 'admin');
          } catch (e) { console.error(e); }
      }
  }, []);

  // 2. Cargar Datos
  const loadData = async () => {
      setLoading(true);
      try {
          // Petición con fechas query params
          const data = await fetchWithAuth(`/movements?start=${startDate}&end=${endDate}`);
          if (Array.isArray(data)) {
              setMovements(data);
          }
      } catch (error) {
          console.error(error);
          setAlert({ show: true, msg: "Error al cargar movimientos", type: 'error' });
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { loadData(); }, [startDate, endDate]); // Recargar al cambiar fechas

  // 3. Borrar Movimiento
  const handleDelete = async () => {
      if (!deleteId) return;
      try {
          await fetchWithAuth(`/movements/${deleteId}`, { method: 'DELETE' });
          setAlert({ show: true, msg: "Movimiento eliminado", type: 'success' });
          loadData(); // Recargar lista
      } catch (error: any) {
          setAlert({ show: true, msg: error.message || "Error al eliminar", type: 'error' });
      } finally {
          setDeleteId(null);
      }
  };

  // 4. Cálculos para UI
  const totals = useMemo(() => {
      let income = 0;
      let expense = 0;
      movements.forEach(m => {
          const val = Number(m.monto);
          if (m.tipo === 'ingreso') income += val;
          else expense += val;
      });
      return { income, expense, balance: income - expense };
  }, [movements]);

  // Datos Gráfica
  const chartData = {
      labels: ['Resumen del Periodo'],
      datasets: [
          {
              label: 'Ingresos',
              data: [totals.income],
              backgroundColor: '#10B981', // Verde
              borderRadius: 5,
          },
          {
              label: 'Egresos',
              data: [totals.expense],
              backgroundColor: '#EF4444', // Rojo
              borderRadius: 5,
          },
      ],
  };

  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { position: 'bottom' as const, labels: { color: '#9CA3AF' } },
          tooltip: {
              callbacks: {
                  label: function(context: any) {
                      return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                  }
              }
          }
      },
      scales: {
          y: { 
              beginAtZero: true, 
              grid: { color: '#374151' },
              ticks: { color: '#9CA3AF' }
          },
          x: { 
              grid: { display: false },
              ticks: { color: '#9CA3AF' }
          }
      }
  };

  return (
    <div className="pb-32 p-4 md:p-6 max-w-5xl mx-auto w-full min-h-screen bg-[#111827]">
        
        {/* Header y Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-chart-line text-[#FF3888]"></i> Consultas
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="w-full sm:w-40">
                    <CustomDatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        label="DESDE" 
                        direction="down"
                    />
                </div>
                <div className="w-full sm:w-40">
                    <CustomDatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        label="HASTA" 
                        direction="down"
                    />
                </div>
            </div>
        </div>

        {/* 1. Tarjetas de Resumen (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1F2937] p-5 rounded-xl border border-green-900/30 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 text-green-500"><i className="fas fa-arrow-up text-5xl"></i></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ingresos</p>
                <p className="text-2xl font-bold text-green-400 mt-1">${totals.income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="bg-[#1F2937] p-5 rounded-xl border border-red-900/30 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 text-red-500"><i className="fas fa-arrow-down text-5xl"></i></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Egresos</p>
                <p className="text-2xl font-bold text-red-400 mt-1">${totals.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 text-blue-500"><i className="fas fa-wallet text-5xl"></i></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Balance</p>
                <p className={`text-2xl font-bold mt-1 ${totals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    ${totals.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
            </div>
        </div>

        {/* 2. Gráfica */}
        <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-700 shadow-lg mb-6 h-64">
            <Bar data={chartData} options={chartOptions} />
        </div>

        {/* 3. Lista de Movimientos */}
        <div className="space-y-4">
            <h3 className="text-white font-bold text-lg border-b border-gray-700 pb-2">Detalle de Movimientos</h3>
            
            {loading ? (
                <div className="text-center py-10 text-gray-500 animate-pulse">Cargando datos...</div>
            ) : movements.length === 0 ? (
                <div className="text-center py-10 bg-[#1F2937]/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    No hay movimientos en este rango de fechas.
                </div>
            ) : (
                <div className="grid gap-3">
                    {movements.map((m) => {
                        const isIncome = m.tipo === 'ingreso';
                        return (
                            <div key={m.id} className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    {/* Icono Tipo */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                        <i className={`fas ${isIncome ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                                    </div>
                                    
                                    {/* Info */}
                                    <div>
                                        <p className="text-white font-bold text-sm sm:text-base">{m.descripcion}</p>
                                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                                            <span><i className="far fa-calendar mr-1"></i> {new Date(m.fecha).toLocaleDateString()}</span>
                                            <span><i className="far fa-clock mr-1"></i> {new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="hidden sm:inline">Por: {m.usuario?.nombre_completo || 'Sistema'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`font-mono font-bold text-lg ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                        {isIncome ? '+' : '-'}${Number(m.monto).toLocaleString()}
                                    </span>

                                    {/* Botón Borrar (Solo Admin) */}
                                    {isAdmin && (
                                        <button 
                                            onClick={() => setDeleteId(m.id)}
                                            className="w-8 h-8 rounded-full bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-400 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar movimiento"
                                        >
                                            <i className="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Alertas y Modales */}
        <CustomAlert isVisible={alert.show} message={alert.msg} type={alert.type} onClose={() => setAlert(prev => ({...prev, show: false}))} />
        
        <ConfirmationModal 
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            title="¿Eliminar Movimiento?"
            message="Esta acción no se puede deshacer (borrado lógico). Solo el administrador puede realizarla."
        />

        <BottomNav />
    </div>
  );
}