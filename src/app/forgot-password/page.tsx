"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage({ type: "error", text: "Ingresa un correo válido." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }), // Enviamos el correo
      });
      
      // Aunque falle (por seguridad), mostramos éxito visual si el formato es correcto
      setMessage({ 
        type: "success", 
        text: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña." 
      });
      setEmail("");

    } catch (error) {
      setMessage({ type: "error", text: "Ocurrió un error. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4 font-poppins text-white min-h-screen">
      <div className="w-full max-w-md bg-[#111827] p-8 rounded-3xl border border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* LOGO Y TÍTULO */}
        <div className="flex flex-col items-center mb-6">
           <div className="relative w-24 h-24 mb-2 drop-shadow-[0_0_15px_rgba(196,0,107,0.5)]">
             <Image src="/logo.png" alt="Fire Inside Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white">Recuperar Acceso</h1>
          <p className="text-gray-400 text-xs text-center mt-2 px-4">
            Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 ml-1 uppercase">Correo Registrado</label>
            <div className="relative group">
              <input 
                type="email" 
                required
                className="w-full h-12 pl-10 pr-4 bg-[#1E293B] rounded-xl border border-gray-700 focus:border-[#FF3888] outline-none text-white transition-all placeholder-gray-600 group-hover:border-gray-600"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF3888] transition-colors"></i>
            </div>
          </div>

          {/* MENSAJES DE ALERTA */}
          {message.text && (
            <div className={`p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2 border ${
                message.type === 'success' 
                ? 'bg-green-900/30 border-green-800 text-green-300' 
                : 'bg-red-900/30 border-red-800 text-red-300'
            }`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i> 
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#C4006B] to-[#FF3888] hover:opacity-90 transition-all shadow-lg shadow-pink-900/40 disabled:opacity-50 transform active:scale-[0.98]"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Enviar Enlace"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2">
            <i className="fas fa-arrow-left"></i> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}