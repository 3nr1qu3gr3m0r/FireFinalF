"use client";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import CustomAlert from "@/components/ui/CustomAlert";

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export default function RegisterStudentModal({ isOpen, onClose, onRegisterSuccess }: RegisterStudentModalProps) {
  const [userType, setUserType] = useState<'alumno' | 'recepcionista'>('alumno');
  
  const [formData, setFormData] = useState({
    nombre_completo: '', 
    correo: '',          
    whatsapp: '',        
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' as any });

  const showAlert = (msg: string, type = 'success') => {
      setAlert({ show: true, msg, type: type as any });
      if(type === 'success') setTimeout(() => setAlert(prev => ({...prev, show: false})), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      // Validaciones Frontend
      if (!formData.nombre_completo.trim()) {
          showAlert("El nombre completo es obligatorio", "warning");
          setLoading(false);
          return;
      }
      if (!formData.correo.trim()) {
          showAlert("El correo es obligatorio", "warning");
          setLoading(false);
          return;
      }
      if (formData.password !== formData.confirmPassword) {
          showAlert("Las contraseñas no coinciden", "warning");
          setLoading(false);
          return;
      }
      if (formData.password.length < 6) {
          showAlert("La contraseña debe tener al menos 6 caracteres", "warning");
          setLoading(false);
          return;
      }

      try {
          // 👇 AQUÍ ESTÁ LA CORRECCIÓN CLAVE
          const payload = {
              nombre_completo: formData.nombre_completo,
              correo: formData.correo,
              contrasena: formData.password, // ✅ Se envía como 'contrasena'
              rol: userType,
              whatsapp: formData.whatsapp,
              // ❌ 'activo': true  <-- ELIMINADO (El backend lo pone por defecto)
          };

          await fetchWithAuth('/auth/register', { 
              method: 'POST',
              body: JSON.stringify(payload)
          });

          showAlert(`✅ Usuario registrado correctamente`, "success");
          
          setTimeout(() => {
              setFormData({ nombre_completo: '', correo: '', whatsapp: '', password: '', confirmPassword: '' });
              onRegisterSuccess();
              onClose();
          }, 1500);

      } catch (error: any) {
          console.error(error);
          // Muestra el mensaje exacto que devuelve el backend
          showAlert(error.message || "Error al registrar usuario", "error");
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        
        <CustomAlert isVisible={alert.show} message={alert.msg} type={alert.type} onClose={() => setAlert(prev => ({...prev, show: false}))} />

        <div className="bg-[#1F2937] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Registrar Nuevo Usuario</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Selector de Tipo */}
                    <div className="bg-[#111827] p-1 rounded-lg flex">
                        <button 
                            type="button"
                            onClick={() => setUserType('alumno')}
                            className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'alumno' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <i className="fas fa-user-graduate"></i> Alumno
                        </button>
                        <button 
                            type="button"
                            onClick={() => setUserType('recepcionista')}
                            className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'recepcionista' ? 'bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <i className="fas fa-user-tie"></i> Staff
                        </button>
                    </div>

                    {/* Nombre Completo */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nombre Completo *</label>
                        <input 
                            name="nombre_completo" 
                            value={formData.nombre_completo} 
                            onChange={handleChange} 
                            placeholder="Ej: Juan Pérez López"
                            className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:border-[#FF3888] outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Contacto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                                Correo Electrónico *
                            </label>
                            <input 
                                type="email" 
                                name="correo" 
                                value={formData.correo} 
                                onChange={handleChange} 
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:border-[#FF3888] outline-none transition-colors"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">WhatsApp</label>
                            <input 
                                type="tel" 
                                name="whatsapp" 
                                value={formData.whatsapp} 
                                onChange={handleChange} 
                                placeholder="Solo números"
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:border-[#FF3888] outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Contraseñas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Contraseña *</label>
                            <input 
                                type="password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:border-[#FF3888] outline-none transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Confirmar *</label>
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:border-[#FF3888] outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Botón Submit */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-lg hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Registrar Usuario'}
                    </button>

                </form>
            </div>
        </div>
    </div>
  );
}