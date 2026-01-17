"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Componente interno que usa useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!token) {
        setMessage({ type: "error", text: "Token no válido o faltante." });
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) throw new Error("El enlace expiró o hubo un error.");

      setMessage({ type: "success", text: "¡Contraseña actualizada! Redirigiendo..." });
      
      setTimeout(() => {
        router.push("/");
      }, 3000);

    } catch (err) {
      setMessage({ type: "error", text: "Error: El enlace ha caducado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111827] p-8 rounded-3xl border border-gray-800 shadow-2xl">
      <div className="flex flex-col items-center mb-6">
         <div className="relative w-24 h-24 mb-2">
           <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <h1 className="text-xl font-bold text-white">Nueva Contraseña</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Ingresa tu nueva clave</label>
          <input 
            type="password" required minLength={6}
            className="w-full h-12 px-4 bg-[#1E293B] rounded-xl border border-gray-700 text-white outline-none focus:border-[#FF3888]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white font-bold">
          {loading ? "Guardando..." : "Cambiar Contraseña"}
        </button>
      </form>
    </div>
  );
}

// Página principal envuelta en Suspense (Requisito de Next.js 13+)
export default function ResetPasswordPage() {
  return (
    <div className="auth-bg flex items-center justify-center p-4 min-h-screen font-poppins">
      <Suspense fallback={<div className="text-white">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}