"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados del formulario
  const [identificador, setIdentificador] = useState(""); // Puede ser correo o ID
  const [password, setPassword] = useState("");
  
  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<any>({}); // Para marcar en rojo los inputs vacíos

  // --- VALIDACIÓN LOCAL (Visual) ---
  const validate = () => {
    const errors: any = {};
    if (!identificador.trim()) errors.identificador = "Ingresa tu correo o ID.";
    if (!password) errors.password = "Ingresa tu contraseña.";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    
    // 1. Validamos antes de enviar para evitar recarga innecesaria
    if (!validate()) return;

    setLoading(true);

    try {
      // 2. Petición al Backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Mapeamos a lo que espera el Backend (identificador, contrasena)
        body: JSON.stringify({ 
            identificador: identificador, 
            contrasena: password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      // 3. Guardar Token
      Cookies.set("token", data.token, { expires: 1 });

      // 4. REDIRECCIÓN INTELIGENTE POR ROL
      // Si el rol es 'alumno' -> Va a su panel exclusivo
      // Si es 'admin' o 'recepcionista' -> Va al panel de gestión
      if (data.usuario.rol === 'alumno') {
          router.push("/alumno/dashboard");
      } else {
          router.push("/admin/dashboard");
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
        
        {/* --- LOGO --- */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 mb-4 drop-shadow-[0_0_15px_rgba(196,0,107,0.5)]">
             <Image 
               src="/logo.png" 
               alt="Fire Inside Logo" 
               fill 
               className="object-contain"
               priority
             />
          </div>
          <p className="text-gray-400 text-sm font-medium tracking-wide">SISTEMA DE GESTIÓN</p>
        </div>

        {/* --- FORMULARIO --- */}
        {/* 'noValidate' desactiva los mensajes automáticos del navegador */}
        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          
          {/* CAMPO IDENTIFICADOR */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">Correo o ID de Usuario</label>
            <div className="relative group">
              <input 
                type="text" 
                className={`w-full h-12 pl-10 pr-4 bg-[#1E293B] rounded-xl border outline-none text-white transition-all placeholder-gray-600 
                    ${fieldErrors.identificador ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#FF3888] group-hover:border-gray-600'}`}
                placeholder="ejemplo@correo.com ó 1045"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
              />
              <i className={`fas fa-user absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.identificador ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[#FF3888]'}`}></i>
            </div>
            {fieldErrors.identificador && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.identificador}</p>}
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">Contraseña</label>
            <div className="relative group">
              <input 
                type="password" 
                className={`w-full h-12 pl-10 pr-4 bg-[#1E293B] rounded-xl border outline-none text-white transition-all placeholder-gray-600 
                    ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#FF3888] group-hover:border-gray-600'}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i className={`fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[#FF3888]'}`}></i>
            </div>
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
          </div>
          
          {/* Olvidaste tu contraseña */}
          <div className="flex justify-end mt-2">
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-gray-400 hover:text-[#FF3888] transition-colors hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
            </div>

          {/* MENSAJE DE ERROR GENERAL (Backend) */}
          {generalError && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center flex items-center justify-center gap-2">
              <i className="fas fa-exclamation-triangle"></i> {generalError}
            </div>
          )}

          {/* BOTÓN SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:opacity-90 transition-all shadow-lg shadow-pink-900/40 disabled:opacity-50 transform active:scale-[0.98]"
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Entrando...
                </span>
            ) : "Iniciar Sesión"}
          </button>
        </form>

        {/* LINK A REGISTRO */}
        <div className="mt-8 text-center text-sm text-gray-500">
          ¿Eres nuevo alumno? <Link href="/register" className="text-[#FF3888] font-bold hover:underline ml-1">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}