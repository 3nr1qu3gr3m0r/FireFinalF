'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchWithAuth } from '@/lib/api';
import CustomAlert from '@/components/ui/CustomAlert';

// Interfaces
interface Level {
  id: number;
  nombre: string;
  color?: string; // Soportamos el color que viene en tu diseño
}

interface Badge {
  id: number;
  nombre: string;
  imagen_url?: string;
}

interface User {
  id: number;
  nombre_completo: string;
  nivel?: Level;
  insignias?: Badge[];
}

export default function StudentGamificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = parseInt(id);
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<User | null>(null);
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Selección actual
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([]);

  // Alertas
  const [alert, setAlert] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  // Carga de datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, levelsData, badgesData] = await Promise.all([
          fetchWithAuth(`/users/${studentId}`),
          fetchWithAuth('/levels'),
          fetchWithAuth('/badges'),
        ]);

        if (userData && !userData.error) {
           setStudent(userData);
           if (userData.nivel) setSelectedLevelId(userData.nivel.id);
           if (userData.insignias && Array.isArray(userData.insignias)) {
             setSelectedBadgeIds(userData.insignias.map((b: Badge) => b.id));
           }
        }

        // Asignamos colores por defecto si la base de datos no trae color
        const processedLevels = (Array.isArray(levelsData) ? levelsData : []).map((l: any, index: number) => ({
            ...l,
            color: l.color || ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 4] // Colores cíclicos por defecto
        }));

        setLevels(processedLevels);
        setBadges(Array.isArray(badgesData) ? badgesData : []);

      } catch (error) {
        console.error('Error:', error);
        setAlert({ show: true, type: 'error', message: 'Error cargando información.' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  const toggleBadge = (badgeId: number) => {
    setSelectedBadgeIds((prev) => 
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert({ ...alert, show: false });
    try {
      if (selectedLevelId && selectedLevelId !== student?.nivel?.id) {
        await fetchWithAuth('/levels/assign', {
          method: 'POST',
          body: JSON.stringify({ usuario_id: studentId, nivel_id: selectedLevelId }),
        });
      }
      await fetchWithAuth('/badges/assign', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: studentId, insignia_ids: selectedBadgeIds }),
      });

      setAlert({ show: true, type: 'success', message: 'Logros guardados exitosamente.' });
      
      // Actualizar visualmente sin recargar
      const newLevel = levels.find(l => l.id === selectedLevelId);
      setStudent(prev => prev ? { ...prev, nivel: newLevel } : null);

    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Error al guardar cambios.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Cargando logros...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto p-4 sm:p-6">
      
      {/* Header simple integrado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Asignar Logros</h1>
        <p className="text-gray-400">Alumno: <span className="text-primary-400 font-semibold">{student?.nombre_completo}</span></p>
      </div>

      {/* Alerta flotante */}
      {alert.show && (
        <div className="mb-4">
          <CustomAlert type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, show: false })} />
        </div>
      )}

      {/* Área Scrollable (.logros-content) */}
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-8">
        
        {/* SECCIÓN NIVELES */}
        <div>
           <h2 className="text-xl font-bold text-white mb-4 pl-1 border-l-4 border-primary-500">Nivel del Alumno</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {levels.map((level) => {
               const isSelected = selectedLevelId === level.id;
               return (
                 <div
                   key={level.id}
                   onClick={() => setSelectedLevelId(level.id)}
                   className={`
                     relative flex flex-col items-center text-center p-5 rounded-xl cursor-pointer border-2 transition-all duration-200
                     bg-gray-800 hover:-translate-y-1
                     ${isSelected 
                       ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-gray-800/80' 
                       : 'border-gray-700 hover:border-pink-400'}
                   `}
                 >
                   {/* Barra de color superior (simulando .level-color-swatch) */}
                   <div 
                     className="absolute top-0 left-0 right-0 h-3 rounded-t-lg opacity-80"
                     style={{ backgroundColor: level.color || '#8B5CF6' }}
                   />
                   
                   <div className="mt-4">
                     <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                       {level.nombre}
                     </span>
                   </div>

                   {/* Indicador de selección (Check) */}
                   {isSelected && (
                     <div className="absolute top-4 right-2 text-pink-500">
                       <i className="fas fa-check-circle"></i> {/* Si usas FontAwesome */}
                       <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>

        {/* SECCIÓN INSIGNIAS */}
        <div>
           <h2 className="text-xl font-bold text-white mb-4 pl-1 border-l-4 border-blue-500">Insignias Obtenidas</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
             {badges.map((badge) => {
               const isSelected = selectedBadgeIds.includes(badge.id);
               return (
                 <div
                   key={badge.id}
                   onClick={() => toggleBadge(badge.id)}
                   className={`
                     flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 h-full
                     bg-gray-800 hover:-translate-y-1
                     ${isSelected 
                       ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] bg-gray-800' 
                       : 'border-gray-700 hover:border-blue-400'}
                   `}
                 >
                   <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden bg-gray-700 ring-2 ring-gray-600">
                      {badge.imagen_url ? (
                        <img 
                          src={badge.imagen_url} 
                          alt={badge.nombre} 
                          className={`w-full h-full object-cover ${!isSelected && 'grayscale opacity-70'}`} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏆</div>
                      )}
                   </div>
                   <span className={`text-sm font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                     {badge.nombre}
                   </span>
                 </div>
               );
             })}
           </div>
        </div>

      </div>

      {/* Footer (.logros-footer) */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`
            w-full h-12 rounded-full font-bold text-white text-lg shadow-lg transition-all transform active:scale-95
            ${saving 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:shadow-pink-500/25'}
          `}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

    </div>
  );
}