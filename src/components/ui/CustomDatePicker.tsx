"use client";
import { useState, useEffect, useRef } from "react";

interface DatePickerProps {
  label: string;
  value: string; // Formato YYYY-MM-DD
  onChange: (date: string) => void;
}

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CustomDatePicker({ label, value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados internos para la navegación del calendario
  const [currentDate, setCurrentDate] = useState(new Date()); // Para saber qué mes estamos viendo
  
  // Sincronizar con el valor externo
  useEffect(() => {
    if (value) {
      // Si hay un valor seleccionado, el calendario debe abrirse en ese mes/año
      // Ajustamos la zona horaria para evitar errores de "un día antes"
      const [y, m, d] = value.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA DEL CALENDARIO ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JS es 0-11, necesitamos 1-12
    
    // Formatear a YYYY-MM-DD
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Renderizar días
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    
    const allSlots = [...blanks, ...days];

    // Checar si el día renderizado es el seleccionado
    const isSelected = (d: number) => {
        if (!value) return false;
        const [vy, vm, vd] = value.split('-').map(Number);
        return vy === year && vm === month + 1 && vd === d;
    };

    return (
      <div className="grid grid-cols-7 gap-1 mt-2">
        {allSlots.map((day, i) => {
          if (!day) return <div key={i} className="h-8"></div>;
          
          const selected = isSelected(day);
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectDate(day)}
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${selected 
                    ? "bg-[#FF3888] text-white shadow-lg shadow-pink-500/50" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  // Formato visual para el input (Ej: 15 de Enero, 2026)
  const displayValue = value ? new Date(value + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "";

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">{label}</label>
      
      {/* EL INPUT "FALSO" QUE ABRE EL CALENDARIO */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
            relative w-full bg-[#1F2937]/50 border rounded-xl pl-10 pr-4 py-3.5 cursor-pointer transition-all group
            ${isOpen ? "border-[#FF3888] bg-[#1F2937]" : "border-gray-700 hover:border-gray-600"}
        `}
      >
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? "text-[#FF3888]" : "text-gray-500 group-hover:text-gray-400"}`}>
            <i className="fas fa-calendar-alt"></i>
        </span>
        
        <span className={`block ${displayValue ? "text-white font-medium" : "text-gray-500"}`}>
            {displayValue || "Seleccionar fecha..."}
        </span>
        
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
            <i className={`fas fa-chevron-down transition-transform ${isOpen ? "rotate-180" : ""}`}></i>
        </span>
      </div>

      {/* EL POPUP DEL CALENDARIO */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-[#111827] border border-gray-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Cabecera (Mes/Año y Flechas) */}
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-chevron-left"></i>
                </button>
                <span className="text-white font-bold capitalize">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button type="button" onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] uppercase font-bold text-gray-500">
                        {d}
                    </div>
                ))}
            </div>

            {/* Días del mes */}
            {renderCalendarDays()}

        </div>
      )}
    </div>
  );
}