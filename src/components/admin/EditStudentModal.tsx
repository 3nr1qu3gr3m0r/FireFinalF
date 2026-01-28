"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import CustomAlert from "@/components/ui/CustomAlert"; 
import CustomDatePicker from "@/components/ui/CustomDatePicker"; 

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
  onUpdate: () => void;
}

export default function EditStudentModal({ isOpen, onClose, studentData, onUpdate }: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "",
    whatsapp: "",
    direccion: "", // ✅ Nuevo campo
    fecha_nacimiento: "",
    instagram: "",
    emergencia_nombre: "",
    emergencia_telefono: "",
    informacion_medica: ""
  });
  const [loading, setLoading] = useState(false);

  const [alertState, setAlertState] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ isVisible: false, message: "", type: "error" });

  const showAlert = (message: string, type: "success" | "error" | "warning") => {
    setAlertState({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (studentData) {
      setFormData({
        nombre_completo: studentData.nombre_completo || "",
        correo: studentData.correo || "",
        whatsapp: studentData.whatsapp || studentData.telefono || "", 
        direccion: studentData.direccion || "", // ✅ Cargamos dirección
        fecha_nacimiento: studentData.fecha_nacimiento ? new Date(studentData.fecha_nacimiento).toISOString().split('T')[0] : "",
        instagram: studentData.instagram || "",
        emergencia_nombre: studentData.emergencia_nombre || "",
        emergencia_telefono: studentData.emergencia_telefono || "",
        informacion_medica: studentData.informacion_medica || ""
      });
    }
  }, [studentData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isNumeric = (val: string) => /^\d+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentData?.id) {
        showAlert("Error crítico: No se encontró el ID del usuario.", "error");
        return;
    }

    if (!formData.nombre_completo.trim()) {
        showAlert("El nombre completo es obligatorio.", "warning");
        return;
    }
    if (formData.correo && !isValidEmail(formData.correo)) {
        showAlert("El formato del correo es inválido.", "warning");
        return;
    }
    
    if (formData.whatsapp && !isNumeric(formData.whatsapp)) {
        showAlert("El WhatsApp solo debe contener números.", "warning");
        return;
    }
    
    if (formData.emergencia_telefono && !isNumeric(formData.emergencia_telefono)) {
        showAlert("El teléfono de emergencia solo debe contener números.", "warning");
        return;
    }

    setLoading(true);
    
    try {
        await fetchWithAuth(`/users/${studentData.id}`, {
            method: 'PATCH', 
            body: JSON.stringify(formData)
        });

        showAlert("✅ Datos actualizados correctamente", "success");
        setTimeout(() => {
            onUpdate();
            onClose();
        }, 1500);

    } catch (error: any) {
        console.error(error);
        showAlert(`❌ Error: ${error.message || 'No se pudo actualizar'}`, "error");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        
        <CustomAlert 
            isVisible={alertState.isVisible} 
            message={alertState.message} 
            type={alertState.type} 
            onClose={() => setAlertState(prev => ({ ...prev, isVisible: false }))} 
        />

        <div className="bg-[#1F2937] w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Editar Datos del Usuario</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" noValidate>
                
                {/* BLOQUE DATOS PERSONALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Nombre Completo</label>
                        <input name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Correo</label>
                        <input name="correo" type="email" value={formData.correo} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">WhatsApp</label>
                        <input name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                    </div>
                    
                    <div className="relative z-20">
                        <CustomDatePicker 
                            label="Fecha de Nacimiento"
                            value={formData.fecha_nacimiento}
                            onChange={(date) => setFormData({...formData, fecha_nacimiento: date})}
                            direction="down"
                        />
                    </div>
                </div>

                {/* BLOQUE EXTRA: DIRECCIÓN E INSTAGRAM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Dirección</label>
                        <input name="direccion" value={formData.direccion} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Instagram</label>
                        <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                    </div>
                </div>

                {/* BLOQUE EMERGENCIA */}
                <div className="border-t border-gray-700 my-4 pt-4">
                    <h3 className="text-[#FF3888] font-bold mb-3 uppercase text-sm">Emergencia y Salud</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Contacto Emergencia</label>
                            <input name="emergencia_nombre" value={formData.emergencia_nombre} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Teléfono Emergencia</label>
                            <input name="emergencia_telefono" type="tel" value={formData.emergencia_telefono} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 outline-none focus:border-[#FF3888]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 uppercase font-bold">Información Médica / Alergias</label>
                            <textarea name="informacion_medica" value={formData.informacion_medica} onChange={handleChange} className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2 text-white mt-1 h-20 outline-none focus:border-[#FF3888]" />
                        </div>
                    </div>
                </div>
            </form>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">Cancelar</button>
                <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-lg bg-[#FF3888] text-white font-bold hover:bg-[#d61f68] transition-colors shadow-lg shadow-pink-900/40">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : "Guardar Cambios"}
                </button>
            </div>
        </div>
    </div>
  );
}