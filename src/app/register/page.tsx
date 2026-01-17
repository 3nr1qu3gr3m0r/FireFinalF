"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  
  // Estado para errores de campo (Frontend visual)
  const [fieldErrors, setFieldErrors] = useState<any>({});
  
  // Estado para errores generales (Backend)
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

// --- VALIDACIÓN LOCAL (Visual) ---
  const validate = () => {
    const errors: any = {};
    
    // 1. Validar que no esté vacío
    if (!formData.name.trim()) {
        errors.name = "El nombre es obligatorio.";
    } 
    // 2. Validar longitud mínima
    else if (formData.name.length < 3) {
        errors.name = "El nombre es muy corto.";
    }
    // 3. NUEVO: Validar que SOLO tenga letras y espacios (No números, no símbolos)
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name)) {
        errors.name = "El nombre solo puede contener letras.";
    }
    
    // --- Validaciones de correo y contraseña (igual que antes) ---
    if (!formData.email) {
      errors.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Ingresa un correo válido.";
    }

    if (!formData.password) {
      errors.password = "La contraseña es obligatoria.";
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    
    // 1. Ejecutamos validación visual primero
    if (!validate()) return; 

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre_completo: formData.name,
            correo: formData.email,
            contrasena: formData.password,
            rol: "alumno" 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      }

      // --- REDIRECCIÓN INTELIGENTE ---
      if (data.token) {
        Cookies.set("token", data.token, { expires: 1 });
        
        // Verificamos el rol que nos devuelve el backend
        if (data.usuario.rol === 'admin' || data.usuario.rol === 'recepcionista') {
            router.push("/admin/dashboard");
        } else {
            router.push("/alumno/dashboard"); // 👈 Los alumnos van a su propia zona
        }
      } else {
        router.push("/");
      }
      
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4 font-poppins text-white min-h-screen">
      <div className="w-full max-w-md bg-[#111827] p-8 rounded-3xl border border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="flex flex-col items-center mb-6">
           <div className="relative w-32 h-32 mb-2 drop-shadow-[0_0_15px_rgba(196,0,107,0.5)]">
             <Image src="/logo.png" alt="Fire Inside Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white">Registro de Alumnos</h1>
        </div>

        {/* ⚠️ Agregamos noValidate para desactivar los globos feos de HTML */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* CAMPO NOMBRE */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 ml-1 uppercase">Nombre Completo</label>
            <div className="relative group">
                <input type="text" 
                  className={`w-full h-12 pl-4 pr-4 bg-[#1E293B] rounded-xl border outline-none text-white transition-all 
                    ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#FF3888] group-hover:border-gray-600'}`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>
            {/* Mensaje de error personalizado */}
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
          </div>

          {/* CAMPO CORREO */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 ml-1 uppercase">Correo Electrónico</label>
            <div className="relative group">
                <input type="email"
                  className={`w-full h-12 pl-4 pr-4 bg-[#1E293B] rounded-xl border outline-none text-white transition-all 
                    ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#FF3888] group-hover:border-gray-600'}`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
            </div>
            {fieldErrors.email && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 ml-1 uppercase">Crear Contraseña</label>
            <div className="relative group">
                <input type="password" 
                  className={`w-full h-12 pl-4 pr-4 bg-[#1E293B] rounded-xl border outline-none text-white transition-all 
                    ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#FF3888] group-hover:border-gray-600'}`}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
            </div>
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
          </div>

          {/* ERROR GENERAL (DEL BACKEND) */}
          {generalError && (
             <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center">
               <i className="fas fa-exclamation-circle mr-2"></i>{generalError}
             </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:opacity-90 shadow-lg mt-2 transition-transform active:scale-[0.98]">
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Registrarme"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link href="/" className="text-[#FF3888] font-bold hover:underline ml-1">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
}