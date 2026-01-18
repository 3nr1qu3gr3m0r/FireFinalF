"use client";
import { useState, useEffect, useRef } from "react";

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  direction?: "up" | "down"; // 👈 Nueva opción
}

export default function CustomTimePicker({ label, value, onChange, direction = "down" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("PM");

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setMinute(m);
      if (h === 0) { setHour(12); setPeriod("AM"); }
      else if (h === 12) { setHour(12); setPeriod("PM"); }
      else if (h > 12) { setHour(h - 12); setPeriod("PM"); }
      else { setHour(h); setPeriod("AM"); }
    }
  }, [value]);

  const updateTime = (h: number, m: number, p: "AM" | "PM") => {
    let hour24 = h;
    if (p === "AM" && h === 12) hour24 = 0;
    if (p === "PM" && h !== 12) hour24 = h + 12;
    onChange(`${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const handleSelect = (type: 'hour' | 'minute' | 'period', val: any) => {
    let newH = hour, newM = minute, newP = period;
    if (type === 'hour') newH = val;
    if (type === 'minute') newM = val;
    if (type === 'period') newP = val;
    setHour(newH); setMinute(newM); setPeriod(newP);
    updateTime(newH, newM, newP);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">{label}</label>}
      <div onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full bg-[#111827] border rounded-xl pl-10 pr-4 h-11 flex items-center cursor-pointer transition-all group ${isOpen ? "border-[#FF3888]" : "border-gray-700 hover:border-gray-600"}`}>
        <span className={`absolute left-3 transition-colors ${isOpen ? "text-[#FF3888]" : "text-gray-500 group-hover:text-gray-400"}`}><i className="fas fa-clock"></i></span>
        <span className={`block text-sm ${value ? "text-white font-medium" : "text-gray-500"}`}>{value ? `${hour}:${minute.toString().padStart(2, '0')} ${period}` : "Seleccionar hora..."}</span>
        <span className="absolute right-3 text-gray-500 text-xs"><i className={`fas fa-chevron-${isOpen ? "up" : "down"} transition-transform`}></i></span>
      </div>

      {isOpen && (
        // 👇 LÓGICA DE DIRECCIÓN
        <div className={`absolute left-0 w-full bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200 flex gap-2 h-48
             ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}
        `}>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                <span className="text-[10px] text-center text-gray-500 font-bold sticky top-0 bg-[#1E293B] py-1">Hora</span>
                {hoursList.map(h => (<button key={h} type="button" onClick={() => handleSelect('hour', h)} className={`py-1.5 rounded-lg text-sm font-bold ${hour === h ? "bg-[#FF3888] text-white" : "text-gray-400 hover:bg-white/10"}`}>{h}</button>))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 border-l border-r border-gray-700/50 px-1">
                <span className="text-[10px] text-center text-gray-500 font-bold sticky top-0 bg-[#1E293B] py-1">Min</span>
                {minutesList.map(m => (<button key={m} type="button" onClick={() => handleSelect('minute', m)} className={`py-1.5 rounded-lg text-sm font-bold ${minute === m ? "bg-[#FF3888] text-white" : "text-gray-400 hover:bg-white/10"}`}>{m.toString().padStart(2, '0')}</button>))}
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
                <button type="button" onClick={() => handleSelect('period', 'AM')} className={`py-2 rounded-lg text-xs font-bold ${period === 'AM' ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>AM</button>
                <button type="button" onClick={() => handleSelect('period', 'PM')} className={`py-2 rounded-lg text-xs font-bold ${period === 'PM' ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>PM</button>
            </div>
        </div>
      )}
    </div>
  );
}