"use client";
import { useState, useEffect } from "react";

interface RandomWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[]; // Recibimos la lista completa
}

export default function RandomWinnerModal({ isOpen, onClose, students }: RandomWinnerModalProps) {
  const [displayUser, setDisplayUser] = useState<any>(null); // Usuario que se muestra cambiando rápido
  const [winner, setWinner] = useState<any>(null); // El ganador final
  const [isAnimating, setIsAnimating] = useState(false);

  // Filtramos solo alumnos activos para el sorteo
  const eligibleStudents = students.filter(s => s.rol === 'alumno' && s.activo);

  useEffect(() => {
    // Resetear cuando se abre el modal
    if (isOpen) {
      setWinner(null);
      setDisplayUser(null);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const startRaffle = () => {
    if (eligibleStudents.length === 0) return;
    
    setIsAnimating(true);
    setWinner(null);

    // 1. Animación de "barajado" (cambia nombres rápido)
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleStudents.length);
      setDisplayUser(eligibleStudents[randomIndex]);
    }, 100); // Cambia cada 100ms

    // 2. Detener y elegir ganador después de 3 segundos
    setTimeout(() => {
      clearInterval(interval);
      const finalIndex = Math.floor(Math.random() * eligibleStudents.length);
      const finalWinner = eligibleStudents[finalIndex];
      
      setDisplayUser(finalWinner);
      setWinner(finalWinner);
      setIsAnimating(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#1F2937] w-full max-w-md rounded-2xl border border-gray-700 shadow-[0_0_50px_rgba(196,0,107,0.3)] flex flex-col relative overflow-hidden">
        
        {/* Botón Cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#C4006B]/20 to-transparent"></div>

        <div className="p-8 flex flex-col items-center text-center relative z-0">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-gift text-[#FF3888]"></i> Sorteo Aleatorio
            </h2>

            {/* ÁREA DE VISUALIZACIÓN DEL GANADOR */}
            <div className={`w-40 h-40 rounded-full p-1 bg-gradient-to-br from-yellow-400 to-[#FF3888] mb-6 shadow-xl transition-all duration-300 ${winner ? 'scale-110 shadow-[0_0_30px_#FF3888]' : ''}`}>
                <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                    {displayUser ? (
                        <img 
                            src={displayUser.foto_perfil || `https://ui-avatars.com/api/?name=${displayUser.nombre_completo}`} 
                            className="w-full h-full object-cover" 
                            alt="Posible ganador" 
                        />
                    ) : (
                        <i className="fas fa-question text-5xl text-gray-600"></i>
                    )}
                </div>
            </div>

            {/* NOMBRE */}
            <div className="min-h-[80px]">
                {displayUser ? (
                    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                        <h3 className={`text-xl font-bold text-white leading-tight ${winner ? 'text-2xl text-yellow-400 drop-shadow-md' : ''}`}>
                            {displayUser.nombre_completo}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">ID: {displayUser.id}</p>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Presiona el botón para girar la tómbola...</p>
                )}
            </div>

            {/* BOTÓN DE ACCIÓN */}
            {!winner ? (
                <button 
                    onClick={startRaffle} 
                    disabled={isAnimating}
                    className="mt-6 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-lg hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnimating ? (
                        <span><i className="fas fa-spinner fa-spin mr-2"></i> Mezclando...</span>
                    ) : (
                        <span><i className="fas fa-play mr-2"></i> ¡Sortear Ganador!</span>
                    )}
                </button>
            ) : (
                <div className="mt-6 w-full flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-bold hover:bg-gray-800">
                        Cerrar
                    </button>
                    <button onClick={startRaffle} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600">
                        <i className="fas fa-redo mr-2"></i> Otro
                    </button>
                </div>
            )}

            {winner && (
                <div className="mt-4 text-xs text-yellow-500 font-bold animate-pulse">
                    ✨ ¡TENEMOS UN GANADOR! ✨
                </div>
            )}
        </div>
      </div>
    </div>
  );
}