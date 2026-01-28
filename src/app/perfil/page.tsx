"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import BottomNav from "@/components/admin/BottomNav";
import CustomAlert from "@/components/ui/CustomAlert";

export default function ProfilePage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  
  // Estado del formulario con TODOS los campos editables
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "", // Ahora editable
    telefono: "", 
    fecha_nacimiento: "",
    instagram: "",
    direccion: "", 
    // Contacto de Emergencia
    emergencia_nombre: "",
    emergencia_parentesco: "",
    emergencia_telefono: "",
    // Password
    password: "", 
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' as any });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showAlert = (msg: string, type = 'success') => {
      setAlert({ show: true, msg, type: type as any });
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  // 1. Cargar Datos
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
        router.push("/");
        return;
    }

    fetchWithAuth("/users/profile")
      .then((data) => {
        setUser(data);
        const birthDate = data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toISOString().split('T')[0] : "";
        
        setFormData({
            nombre_completo: data.nombre_completo || "",
            correo: data.correo || "",
            telefono: data.whatsapp || "",
            fecha_nacimiento: birthDate,
            instagram: data.instagram || "",
            direccion: data.direccion || "",
            // Cargar datos de emergencia
            emergencia_nombre: data.emergencia_nombre || "",
            emergencia_parentesco: data.emergencia_parentesco || "",
            emergencia_telefono: data.emergencia_telefono || "",
            password: "",
            confirmPassword: ""
        });
      })
      .catch((err) => {
          console.error(err);
          showAlert("Error al cargar perfil", "error");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);
      const formDataImage = new FormData();
      formDataImage.append("file", file);

      try {
          const token = Cookies.get("token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` },
              body: formDataImage,
          });

          if (!res.ok) throw new Error("Error al subir imagen");
          const data = await res.json();

          if (data.url) {
              setUser((prev: any) => ({ ...prev, foto_perfil: data.url }));
              await fetchWithAuth("/users/profile", {
                  method: "PATCH",
                  body: JSON.stringify({ foto_perfil: data.url })
              });
              showAlert("Foto actualizada correctamente");
          }
      } catch (error) {
          console.error(error);
          showAlert("Error al cambiar la foto", "error");
      } finally {
          setUploadingImage(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      if (formData.password && formData.password !== formData.confirmPassword) {
          showAlert("Las contraseñas no coinciden", "warning");
          setSaving(false);
          return;
      }

      try {
          // Preparamos el payload con TODO lo editable
          const payload: any = {
              nombre_completo: formData.nombre_completo,
              correo: formData.correo, // Se envía para validar cambio
              whatsapp: formData.telefono,
              fecha_nacimiento: formData.fecha_nacimiento,
              instagram: formData.instagram,
              direccion: formData.direccion,
              emergencia_nombre: formData.emergencia_nombre,
              emergencia_parentesco: formData.emergencia_parentesco,
              emergencia_telefono: formData.emergencia_telefono,
          };

          if (formData.password) {
              payload.contrasena = formData.password; 
          }

          await fetchWithAuth("/users/profile", {
              method: "PATCH",
              body: JSON.stringify(payload)
          });

          showAlert("Perfil actualizado con éxito");
          setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));

      } catch (error: any) {
          console.error(error);
          // Mostramos el mensaje exacto del backend (ej: "Correo ya registrado")
          showAlert(error.message || "Error al guardar cambios", "error");
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
      return <div className="min-h-screen bg-[#111827] flex items-center justify-center text-gray-500">Cargando perfil...</div>;
  }

  const profilePic = user?.foto_perfil?.startsWith("http") 
      ? user.foto_perfil 
      : `${process.env.NEXT_PUBLIC_API_URL}${user?.foto_perfil}` || `https://ui-avatars.com/api/?name=${user?.nombre_completo}&background=random`;

  // Lógica visual: ¿Mostrar dirección?
  // Si es recepcionista O admin, la mostramos. Si es alumno, no.
  const showAddress = user?.rol === 'recepcionista' || user?.rol === 'admin';

  return (
    <div className="bg-[#111827] h-screen overflow-y-auto relative pb-32 custom-scrollbar">
        
        {/* Cabecera */}
        <div className="h-40 bg-gradient-to-r from-[#C4006B] to-[#FF3888] relative shrink-0">
            <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
            
            <div className="bg-[#1F2937] rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8">
                
                {/* Avatar */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full p-1 bg-[#111827]">
                            <img 
                                src={profilePic} 
                                alt="Perfil" 
                                className={`w-full h-full rounded-full object-cover border-4 border-[#1F2937] ${uploadingImage ? 'opacity-50' : ''}`} 
                                onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.nombre_completo}&background=random`}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-camera text-white text-2xl"></i>
                        </div>
                        {uploadingImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mt-4 text-center">{user?.nombre_completo}</h2>
                    <div className="flex items-center gap-2 mt-1 justify-center">
                        <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-bold uppercase tracking-wider">
                            {user?.rol}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-black/40 text-gray-400 text-xs font-mono">
                            ID: {user?.id}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Sección: Datos Personales */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <i className="fas fa-user text-[#FF3888]"></i> Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    name="nombre_completo"
                                    value={formData.nombre_completo}
                                    onChange={handleChange}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    name="correo"
                                    value={formData.correo}
                                    onChange={handleChange}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Teléfono / WhatsApp</label>
                                <input 
                                    type="tel" 
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fecha de Nacimiento</label>
                                <input 
                                    type="date" 
                                    name="fecha_nacimiento"
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instagram</label>
                                <input 
                                    type="text" 
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    placeholder="@usuario"
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            
                            {/* SOLO SI ES RECEPCIONISTA O ADMIN */}
                            {showAddress && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dirección</label>
                                    <input 
                                        type="text" 
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección: Contacto de Emergencia */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <i className="fas fa-first-aid text-[#FF3888]"></i> En caso de emergencia
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre del contacto</label>
                                <input 
                                    type="text" 
                                    name="emergencia_nombre"
                                    value={formData.emergencia_nombre}
                                    onChange={handleChange}
                                    placeholder="Nombre completo"
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Parentesco</label>
                                <input 
                                    type="text" 
                                    name="emergencia_parentesco"
                                    value={formData.emergencia_parentesco}
                                    onChange={handleChange}
                                    placeholder="Ej: Madre, Hermano..."
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Teléfono de emergencia</label>
                                <input 
                                    type="tel" 
                                    name="emergencia_telefono"
                                    value={formData.emergencia_telefono}
                                    onChange={handleChange}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Seguridad */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <i className="fas fa-lock text-[#FF3888]"></i> Seguridad
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Dejar en blanco para no cambiar"
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Confirmar Contraseña</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={!formData.password}
                                    className="w-full bg-[#111827] border border-gray-600 rounded-xl p-3 text-white focus:border-[#FF3888] outline-none transition-colors disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botón Guardar */}
                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] shadow-lg hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</span>
                            ) : (
                                <span><i className="fas fa-save mr-2"></i> Guardar Cambios</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <CustomAlert isVisible={alert.show} message={alert.msg} type={alert.type} onClose={() => setAlert(prev => ({...prev, show: false}))} />
        <BottomNav />
    </div>
  );
}