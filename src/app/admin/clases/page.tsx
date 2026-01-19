"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import BottomNav from "@/components/admin/BottomNav";
import ClassModal from "@/components/admin/classes/ClassModal";
import CustomAlert from "@/components/ui/CustomAlert";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
// 👇 Importamos el calendario personalizado
import CustomDatePicker from "@/components/ui/CustomDatePicker";

interface ClassItem {
  id: number;
  nombre: string;
  descripcion: string;
  maestro: string;
  precio: number;
  fecha_inicio: string;
  hora: string;
  nivel: string;
  dias_repeticion: number;
  imagen?: string; 
}

const LEVEL_COLORS: any = {
  iniciacion: 'bg-[#8B5CF6]',
  principiante: 'bg-[#10B981]',
  multinivel: 'bg-[#3B82F6]',
  intermedio: 'bg-[#F59E0B]',
  avanzado: 'bg-[#F97316]',
  especial: 'bg-[#EF4444]',
};

const LEVEL_LABELS: any = {
  iniciacion: 'Iniciación',
  principiante: 'Principiante',
  multinivel: 'Multinivel',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  especial: 'Especial',
};

export default function ClasesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Modales y Alertas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: 0 });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' as any });

  const showAlert = (message: string, type = 'success') => {
    setAlert({ show: true, message, type: type as any });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Lógica de Filtrado (Repetición)
  const daysBetween = (d1: Date, d2: Date) => {
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredClasses = classes.filter(cls => {
    if (selectedLevel !== 'all' && cls.nivel !== selectedLevel) return false;

    if (selectedDate) {
        const filterDate = new Date(selectedDate + 'T00:00:00');
        const classDate = new Date(cls.fecha_inicio + 'T00:00:00');

        if (cls.dias_repeticion === 0) return cls.fecha_inicio === selectedDate;
        if (filterDate < classDate) return false;

        const diff = daysBetween(classDate, filterDate);
        return diff % cls.dias_repeticion === 0;
    }
    return true;
  });

  const handleSave = async (data: any) => {
    const token = Cookies.get("token");
    const method = editingClass ? "PUT" : "POST";
    const url = editingClass 
        ? `${process.env.NEXT_PUBLIC_API_URL}/classes/${editingClass.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/classes`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            fetchClasses();
            setIsModalOpen(false);
            setEditingClass(null);
            showAlert(editingClass ? "Clase actualizada" : "Clase creada", "success");
        } else {
            const errorData = await res.json();
            const msg = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message || "Error al guardar";
            showAlert(msg, "error");
        }
    } catch (e) {
        showAlert("Error de conexión", "error");
    }
  };

  const handleDelete = async () => {
    const token = Cookies.get("token");
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/${confirmModal.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        setClasses(classes.filter(c => c.id !== confirmModal.id));
        showAlert("Clase eliminada", "success");
    } catch (e) { console.error(e); }
  };

  const formatSchedule = (cls: ClassItem) => {
    const [h, m] = cls.hora.split(':');
    const time = new Date(0, 0, 0, +h, +m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (cls.dias_repeticion === 0) return `${cls.fecha_inicio} - ${time}`;
    
    const date = new Date(cls.fecha_inicio + 'T00:00:00');
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return `${capitalizedDay} ${time}`;
  };

  return (
    <div className="pb-32 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-wide">Clases</h2>
        <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold border border-gray-700">
           {filteredClasses.length} Activas
        </span>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">
        
        {/* 👇 FILTRO DE FECHA CON CALENDARIO PERSONALIZADO */}
        <div className="w-full md:w-72 relative z-20">
            <CustomDatePicker 
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Filtrar por fecha..."
            />
            {/* Botón para limpiar el filtro si hay fecha seleccionada */}
            {selectedDate && (
                <button 
                    onClick={() => setSelectedDate('')} 
                    className="text-xs text-[#FF3888] font-bold mt-2 ml-1 hover:text-white transition-colors flex items-center gap-1 animate-in fade-in"
                >
                    <i className="fas fa-times"></i> Borrar filtro de fecha
                </button>
            )}
        </div>

        {/* FILTRO DE NIVELES (Carrusel) */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar w-full">
            <button 
                onClick={() => setSelectedLevel('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedLevel === 'all' 
                    ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white border-transparent' 
                    : 'bg-[#1E293B] text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
            >
                Todos
            </button>
            {Object.keys(LEVEL_LABELS).map((lvl) => (
                <button 
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedLevel === lvl
                        ? `${LEVEL_COLORS[lvl]} text-white border-transparent shadow-lg` 
                        : 'bg-[#1E293B] text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                >
                    {LEVEL_LABELS[lvl]}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <i className="fas fa-circle-notch fa-spin text-4xl text-[#FF3888] mb-4"></i>
            <p className="text-white">Cargando clases...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-0">
            {filteredClasses.map((cls) => (
                <div key={cls.id} className="bg-[#1E293B] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-gray-800 relative">
                    
                    {/* IMAGEN DE PORTADA */}
                    <div className="h-36 w-full bg-gray-800 relative overflow-hidden">
                        {cls.imagen ? (
                            <img src={cls.imagen} alt={cls.nombre} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0f1522] flex items-center justify-center">
                                <i className="fas fa-music text-4xl text-gray-700/50"></i>
                            </div>
                        )}
                        
                        {/* ETIQUETA DE PRECIO */}
                        <div className="absolute top-3 left-3">
                            <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg">
                                ${Number(cls.precio).toFixed(2)}
                            </span>
                        </div>

                        {/* ETIQUETA DE NIVEL */}
                        <div className="absolute top-3 right-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md text-white shadow-md ${LEVEL_COLORS[cls.nivel] || 'bg-gray-500'}`}>
                                {LEVEL_LABELS[cls.nivel] || cls.nivel}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-white leading-tight mb-1 line-clamp-1">{cls.nombre}</h3>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-chalkboard-teacher text-[#FF3888] text-xs"></i>
                            <span className="text-gray-400 text-xs uppercase tracking-wide font-semibold">{cls.maestro}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 border-l-2 border-[#FF3888] pl-3 italic line-clamp-2 flex-1">
                            {cls.descripcion || "Sin descripción"}
                        </p>
                        
                        <div className="bg-[#111827]/50 rounded-lg p-2 border border-gray-700/50">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <i className="far fa-calendar-alt text-[#FF3888] w-5 text-center"></i>
                                <span className="font-medium">{formatSchedule(cls)}</span>
                                {cls.dias_repeticion > 0 && (
                                    <i className="fas fa-sync-alt text-gray-500 text-xs ml-auto" title={`Repite cada ${cls.dias_repeticion} días`}></i>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-gray-700/50 divide-x divide-gray-700/50 bg-[#17202e]">
                        <button onClick={() => { setEditingClass(cls); setIsModalOpen(true); }} className="py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            <i className="fas fa-pencil-alt text-xs"></i> Editar
                        </button>
                        <button onClick={() => setConfirmModal({ isOpen: true, id: cls.id })} className="py-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                            <i className="fas fa-trash-alt text-xs"></i> Eliminar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      <button onClick={() => { setEditingClass(null); setIsModalOpen(true); }} className="fixed bottom-24 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white text-xl md:text-2xl shadow-xl shadow-pink-900/50 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center z-30 group">
        <i className="fas fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
      </button>

      <ClassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave} 
        initialData={editingClass}
        onShowAlert={showAlert}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleDelete}
        title="¿Eliminar clase?"
        message="Esta acción no se puede deshacer."
      />

      <CustomAlert isVisible={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, show: false }))} />
      
      <BottomNav />
    </div>
  );
}