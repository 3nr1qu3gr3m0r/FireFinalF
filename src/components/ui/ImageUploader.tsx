"use client";
import { useState, useRef } from "react";
import Cookies from "js-cookie";

interface ImageUploaderProps {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ currentImage, onImageUploaded }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Previsualización local inmediata
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    // 2. Subida al Backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = Cookies.get("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, {
        method: "POST",
        headers: {
           "Authorization": `Bearer ${token}` 
           // No poner Content-Type, FormData lo maneja
        },
        body: formData,
      });

      // --- CAMBIO CLAVE: Capturar el mensaje de error del Backend ---
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Si el backend envía { message: "File too large" }, lo leemos aquí
        const errorMessage = errorData.message || `Error del servidor (${res.status})`;
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      // El servicio backend devuelve { url: "...", public_id: "..." }
      if (data.url) {
        onImageUploaded(data.url); 
      } else {
        throw new Error("La respuesta del servidor no contiene la URL de la imagen.");
      }

    } catch (error: any) {
      console.error("Error subiendo:", error);
      // Este alert te dirá exactamente qué pasó (ej: "File too large", "Unauthorized", etc.)
      alert(`Fallo al subir: ${error.message}`); 
      setPreview(undefined); // Revertir a estado anterior si falla
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-bold text-gray-400">Imagen de Portada</label>
      
      <div 
        className="relative w-full h-40 bg-[#111827] border-2 border-dashed border-gray-700 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-[#FF3888] transition-colors group"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="flex flex-col items-center text-gray-500 group-hover:text-white">
            <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
            <span className="text-xs font-semibold">Click para subir imagen</span>
          </div>
        )}

        {/* Overlay de Carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <i className="fas fa-circle-notch fa-spin text-white text-2xl"></i>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}