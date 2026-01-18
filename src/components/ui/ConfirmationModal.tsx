"use client";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "¿Estás seguro?", 
  message = "Esta acción no se puede deshacer." 
}: ConfirmationModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#1E293B] rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40 transition-colors"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}