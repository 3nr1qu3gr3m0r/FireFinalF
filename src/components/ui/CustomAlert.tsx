"use client";
import { useEffect, useState } from "react";

interface CustomAlertProps {
  message: string;
  type: "success" | "error" | "warning";
  isVisible: boolean;
  onClose: () => void;
}

export default function CustomAlert({ message, type, isVisible, onClose }: CustomAlertProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto-ocultar después de 4 segundos
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Esperar animación de salida
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;

  // Configuración de estilos según el tipo
  const styles = {
    error: {
      bg: "bg-[#2A1015]",
      border: "border-red-500",
      icon: "fas fa-exclamation-circle text-red-500",
      title: "Error"
    },
    success: {
      bg: "bg-[#064E3B]",
      border: "border-green-500",
      icon: "fas fa-check-circle text-green-400",
      title: "Éxito"
    },
    warning: {
      bg: "bg-[#422006]",
      border: "border-yellow-500",
      icon: "fas fa-exclamation-triangle text-yellow-500",
      title: "Advertencia"
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md transition-all duration-300 transform ${show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
      <div className={`${currentStyle.bg} border-l-4 ${currentStyle.border} text-white p-4 rounded-lg shadow-2xl flex items-start gap-4 backdrop-blur-md`}>
        <div className="mt-1">
            <i className={`${currentStyle.icon} text-xl`}></i>
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-sm uppercase tracking-wider">{currentStyle.title}</h3>
            <p className="text-sm text-gray-200 mt-1">{message}</p>
        </div>
        <button onClick={() => setShow(false)} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}