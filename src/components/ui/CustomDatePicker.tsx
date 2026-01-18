"use client";
import { useState, useEffect, useRef } from "react";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  direction?: "up" | "down"; // 👈 Nueva opción (Opcional)
}

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CustomDatePicker({ label, value, onChange, placeholder = "Seleccionar fecha...", direction = "down" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // 🔧 FIX: Evita que el componente desaparezca por diferencias de hora
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleSelectDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    
    return (
      <div className="grid grid-cols-7 gap-1 mt-2 justify-items-center">
        {[...blanks, ...days].map((day, i) => {
          if (!day) return <div key={i} className="h-8 w-8"></div>;
          const isSelected = value === `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          return (
            <button key={i} type="button" onClick={() => handleSelectDate(day)}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${isSelected ? "bg-[#FF3888] text-white shadow-lg shadow-pink-500/50 scale-105" : "text-gray-300 hover:bg-gray-700 hover:text-white active:scale-95"}`}>
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  // Si no está montado, mostramos placeholder para evitar saltos
  if (!isMounted) return <div className="w-full h-16 animate-pulse bg-gray-800/50 rounded-xl"></div>;

  const displayValue = value ? new Date(value + "T00:00:00").toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "";

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">{label}</label>}
      
      <div onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full bg-[#111827] border rounded-xl pl-10 pr-4 h-11 flex items-center cursor-pointer transition-all group ${isOpen ? "border-[#FF3888]" : "border-gray-700 hover:border-gray-600"}`}>
        <span className={`absolute left-3 transition-colors ${isOpen ? "text-[#FF3888]" : "text-gray-500 group-hover:text-gray-400"}`}><i className="fas fa-calendar-alt"></i></span>
        <span className={`block text-sm truncate ${displayValue ? "text-white font-medium" : "text-gray-500"}`}>{displayValue || placeholder}</span>
        <span className="absolute right-3 text-gray-500 text-xs"><i className={`fas fa-chevron-${isOpen ? "up" : "down"} transition-transform`}></i></span>
      </div>

      {isOpen && (
        // 👇 AQUÍ USAMOS LA VARIABLE: Si es 'up' va bottom-full, si es 'down' va top-full
        <div className={`absolute left-0 w-full sm:w-72 bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 
            ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} 
        `}>
           <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"><i className="fas fa-chevron-left text-xs"></i></button>
                <span className="text-white font-bold capitalize text-sm">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <button type="button" onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"><i className="fas fa-chevron-right text-xs"></i></button>
            </div>
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => <div key={d} className="text-center text-[10px] uppercase font-bold text-gray-500">{d}</div>)}
            </div>
            {renderCalendarDays()}
        </div>
      )}
    </div>
  );
}