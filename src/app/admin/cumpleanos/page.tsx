"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchWithAuth } from "@/lib/api";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";
import CustomDatePicker from "@/components/ui/CustomDatePicker"; // ✅ Usamos el componente existente

// Helper para calcular edad (corregido para usar la fecha de nacimiento original)
const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// Helper para formatear fecha bonita (ej: "15 de Octubre")
const formatDateNice = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(date);
};

export default function BirthdayPage() {
  const [students, setStudents] = useState<any[]>([]);
  // Iniciamos con la fecha de hoy en formato YYYY-MM-DD local
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); 
  const [loading, setLoading] = useState(true);
  const [alertState, setAlertState] = useState({ show: false, msg: '', type: 'success' as any });

  // 1. Cargar Datos
  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await fetchWithAuth('/users');
            if (Array.isArray(data)) {
                // Filtramos solo alumnos con fecha de nacimiento válida
                const validStudents = data.filter((u: any) => u.fecha_nacimiento && u.rol === 'alumno');
                setStudents(validStudents);
            }
        } catch (error) {
            console.error(error);
            setAlertState({ show: true, msg: 'Error al cargar lista de alumnos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // 2. Extraer solo las fechas de nacimiento para pasarlas al calendario (PUNTITOS)
  const allBirthdayDates = useMemo(() => {
      // Necesitamos pasarlas como strings YYYY-MM-DD
      // Ojo: La fecha de nacimiento original incluye el año de nacimiento.
      // El CustomDatePicker modificado comparará solo mes y día.
      return students.map(s => {
          // Aseguramos formato YYYY-MM-DD consistente
          return s.fecha_nacimiento.toString().split('T')[0];
      });
  }, [students]);

  // 3. Filtrar Cumpleañeros del día seleccionado
  const birthdaysToday = useMemo(() => {
      if (!selectedDate) return [];
      const [_, selectedMonth, selectedDay] = selectedDate.split('-'); // Formato YYYY-MM-DD

      return students.filter(student => {
          // Extraemos mes y día de la fecha del alumno
          const [__, studentMonth, studentDay] = student.fecha_nacimiento.toString().split('T')[0].split('-');
          return studentMonth === selectedMonth && studentDay === selectedDay;
      });
  }, [students, selectedDate]);

  // 4. Calcular Próximos Cumpleaños (Siguientes 14 días)
  const upcomingBirthdays = useMemo(() => {
      const today = new Date();
      const nextWeek = new Date(); 
      nextWeek.setDate(today.getDate() + 14); // Miramos 2 semanas adelante

      return students.filter(student => {
          const [y, m, d] = student.fecha_nacimiento.toString().split('T')[0].split('-').map(Number);
          
          // Creamos la fecha de cumple de ESTE año para comparar
          const birthdayThisYear = new Date(today.getFullYear(), m - 1, d);
          
          // Si ya pasó hoy (ayer), miramos el siguiente año
          // (Usamos setHours(0,0,0,0) para comparar fechas puras)
          const todayZero = new Date();
          todayZero.setHours(0,0,0,0);

          if (birthdayThisYear < todayZero) {
              birthdayThisYear.setFullYear(today.getFullYear() + 1);
          }

          // Verificamos si cae en el rango (Mañana -> 14 días)
          return birthdayThisYear > todayZero && birthdayThisYear <= nextWeek;
      }).sort((a, b) => {
          // Ordenar por fecha más próxima (mes y día)
          const [__a, ma, da] = a.fecha_nacimiento.toString().split('T')[0].split('-');
          const [__b, mb, db] = b.fecha_nacimiento.toString().split('T')[0].split('-');
          
          // Si es diferente mes, gana el menor. Si es mismo mes, gana el menor día.
          // Nota: Esto asume orden natural de calendario (Enero antes que Febrero)
          // Para cruce de año (Dic -> Ene) en "próximos días" la lógica es más compleja, 
          // pero para 14 días funciona bien salvo a fin de año.
          if (ma !== mb) {
              // Ajuste para fin de año: si hoy es Dic y el otro es Ene, Ene es "mayor" numéricamente pero "menor" en proximidad si cruzamos año.
              // Simplificación: Ordenamos por la fecha calculada "este año/próximo"
              const dateA = new Date(new Date().getFullYear(), Number(ma)-1, Number(da));
              if (dateA < new Date()) dateA.setFullYear(dateA.getFullYear()+1);
              
              const dateB = new Date(new Date().getFullYear(), Number(mb)-1, Number(db));
              if (dateB < new Date()) dateB.setFullYear(dateB.getFullYear()+1);
              
              return dateA.getTime() - dateB.getTime();
          }
          return Number(da) - Number(db);
      }).slice(0, 5); // Solo mostrar los primeros 5
  }, [students]);

  return (
    <div className="pb-32 p-4 md:p-6 max-w-5xl mx-auto w-full min-h-screen bg-[#111827]">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-birthday-cake text-yellow-400"></i> Cumpleaños
            </h2>
            
            {/* Selector de Fecha */}
            <div className="w-full md:w-64 z-20">
                <CustomDatePicker 
                    value={selectedDate}
                    onChange={setSelectedDate}
                    label="BUSCAR FECHA"
                    placeholder="Seleccionar día..."
                    events={allBirthdayDates} // 👈 Pasamos las fechas para los puntitos
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA PRINCIPAL: Cumpleañeros del día */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1F2937] border border-gray-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>

                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                        Celebrando el <span className="text-yellow-400">{formatDateNice(selectedDate)}</span>
                    </h3>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500 animate-pulse">Cargando datos...</div>
                    ) : birthdaysToday.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {birthdaysToday.map(student => (
                                <div key={student.id} className="bg-[#111827] rounded-xl p-4 flex items-center gap-4 border-l-4 border-yellow-400 shadow-lg hover:bg-gray-800 transition-colors group">
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-300 to-orange-500">
                                            <img 
                                                src={student.foto_perfil || `https://ui-avatars.com/api/?name=${student.nombre_completo}`} 
                                                alt={student.nombre_completo}
                                                className="w-full h-full rounded-full object-cover border-2 border-[#111827]"
                                            />
                                        </div>
                                        {/* Edad que CUMPLE (calculada) */}
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                            {calculateAge(student.fecha_nacimiento)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold text-lg truncate leading-tight">{student.nombre_completo}</h4>
                                        <div className="flex flex-col gap-1 mt-1 text-sm text-gray-400">
                                            {student.instagram && (
                                                <a href={`https://instagram.com/${student.instagram.replace('@','')}`} target="_blank" className="flex items-center gap-1 hover:text-pink-400 transition-colors">
                                                    <i className="fab fa-instagram"></i> {student.instagram}
                                                </a>
                                            )}
                                            <span className="text-xs text-gray-500">ID: {student.id}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center justify-center opacity-50">
                            <i className="fas fa-calendar-day text-5xl text-gray-600 mb-4"></i>
                            <p className="text-gray-400">No hay cumpleaños registrados para esta fecha.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMNA LATERAL: Próximos Cumpleaños */}
            <div className="space-y-4">
                <div className="bg-[#1F2937]/50 border border-gray-700/50 rounded-2xl p-5 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fas fa-hourglass-half text-[#FF3888]"></i> Próximos 14 días
                    </h3>

                    {upcomingBirthdays.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingBirthdays.map(student => {
                                const [y, m, d] = student.fecha_nacimiento.toString().split('T')[0].split('-');
                                // Calculamos la edad que VA a cumplir
                                const turningAge = calculateAge(student.fecha_nacimiento) + 1;

                                return (
                                    <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                        <img 
                                            src={student.foto_perfil || `https://ui-avatars.com/api/?name=${student.nombre_completo}`} 
                                            className="w-10 h-10 rounded-full object-cover bg-gray-800"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{student.nombre_completo}</p>
                                            <p className="text-xs text-gray-400">
                                                {d} de {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, Number(m)-1, 1))}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                            {turningAge} años
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay cumpleaños cercanos.</p>
                    )}
                </div>
            </div>

        </div>

        <CustomAlert isVisible={alertState.show} message={alertState.msg} type={alertState.type} onClose={() => setAlertState({ ...alertState, show: false })} />
        <BottomNav />
    </div>
  );
}