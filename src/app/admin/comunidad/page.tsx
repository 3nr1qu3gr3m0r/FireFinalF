"use client";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import BottomNav from "@/components/admin/BottomNav";
import { fetchWithAuth } from "@/lib/api";

export default function CommunityPage() {
  // --- ESTADOS ---
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [text, setText] = useState("");
  
  // Manejo de Imágenes
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // URL del servidor
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview local (blob)
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Spinner carga imagen

  // UI y Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null); // Modal visor

  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    // Verificar rol desde cookie
    const token = Cookies.get("token");
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const payload = JSON.parse(decodeURIComponent(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
            setIsAdmin(payload.rol === 'admin');
        } catch (e) {}
    }
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
      try {
          // Usamos la URL pública o fetchWithAuth si proteges el GET
          const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/announcements'); 
          const data = await res.json();
          if (Array.isArray(data)) {
              setAnnouncements(data);
              scrollToBottom();
          }
      } catch (error) {
          console.error("Error cargando anuncios", error);
      } finally {
          setLoading(false);
      }
  };

  const scrollToBottom = () => {
      setTimeout(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollIntoView({ behavior: "smooth" });
          }
      }, 100);
  };

  // --- 2. SUBIDA DE IMAGEN (Al seleccionar archivo) ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // a) Preview inmediato
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      setIsUploadingImage(true);

      // b) Subir al servidor (/files/upload)
      const formData = new FormData();
      formData.append("file", file);

      try {
          const token = Cookies.get("token");
          // Fetch directo para que el navegador maneje el Content-Type multipart
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` },
              body: formData,
          });

          if (!res.ok) throw new Error("Error subiendo imagen");

          const data = await res.json();
          if (data.url) {
              setUploadedImageUrl(data.url); // Guardamos la URL lista para enviar
          }
      } catch (error) {
          console.error(error);
          alert("Error al subir la imagen. Intenta de nuevo.");
          clearImage();
      } finally {
          setIsUploadingImage(false);
      }
  };

  const clearImage = () => {
      setUploadedImageUrl(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 3. ENVIAR ANUNCIO (Texto + URL de imagen ya subida) ---
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validar que haya contenido y que la imagen no se esté subiendo aún
      if ((!text.trim() && !uploadedImageUrl) || isUploadingImage) return;

      setSending(true);
      try {
          const payload = {
              contenido: text,
              imagen_url: uploadedImageUrl 
          };

          // Ahora sí enviamos JSON al endpoint de anuncios
          await fetchWithAuth('/announcements', {
              method: 'POST',
              body: JSON.stringify(payload)
          });

          setText("");
          clearImage();
          loadAnnouncements();
      } catch (error) {
          console.error(error);
          alert("Error al publicar el anuncio.");
      } finally {
          setSending(false);
      }
  };

  // --- 4. BORRAR ANUNCIO ---
  const handleDelete = async (id: number) => {
      if (!confirm("¿Eliminar este anuncio permanentemente?")) return;
      try {
          await fetchWithAuth(`/announcements/${id}`, { method: 'DELETE' });
          setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (error) {
          console.error(error);
      }
  };

  // Variable auxiliar para agrupar fechas
  let lastDate = "";

  return (
    <div className="bg-[#111827] min-h-screen flex flex-col">
        
        {/* --- HEADER FIJO --- */}
        <div className="sticky top-0 z-20 bg-[#1F2937]/90 backdrop-blur border-b border-gray-700 p-4 shadow-md">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-bullhorn text-[#FF3888]"></i> Muro de Anuncios
            </h2>
        </div>

        {/* --- FEED DE NOTICIAS --- */}
        {/* pb-36 asegura espacio para el input fijo en móviles */}
        <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-8">
            
            {loading ? (
                <div className="text-center text-gray-500 py-10 animate-pulse">Cargando anuncios...</div>
            ) : announcements.length === 0 ? (
                <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                    <i className="fas fa-comment-slash text-4xl mb-4 opacity-30"></i>
                    <p>No hay anuncios publicados aún.</p>
                </div>
            ) : (
                announcements.map((announcement) => {
                    const dateObj = new Date(announcement.fecha_creacion);
                    const dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    let showDate = false;
                    if (dateStr !== lastDate) {
                        showDate = true;
                        lastDate = dateStr;
                    }

                    // Construcción segura de la URL de la imagen
                    const imageUrl = announcement.imagen_url 
                        ? (announcement.imagen_url.startsWith('http') 
                            ? announcement.imagen_url 
                            : `${process.env.NEXT_PUBLIC_API_URL}${announcement.imagen_url}`)
                        : null;

                    return (
                        <div key={announcement.id} className="w-full">
                            
                            {/* Separador de Fecha */}
                            {showDate && (
                                <div className="flex justify-center mb-6 sticky top-2 z-10 opacity-90">
                                    <span className="bg-[#111827] text-gray-400 text-[10px] font-bold px-4 py-1 rounded-full border border-gray-700 shadow-sm uppercase tracking-widest">
                                        {dateStr}
                                    </span>
                                </div>
                            )}

                            {/* TARJETA CENTRADA (Estilo Feed) */}
                            <div className="flex justify-center">
                                <div className="bg-white text-black p-0 rounded-2xl w-full max-w-2xl shadow-lg relative group border border-gray-200 overflow-hidden">
                                    
                                    {/* Cabecera de la Tarjeta */}
                                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4006B] to-[#FF3888] flex items-center justify-center text-white shadow-sm">
                                            <i className="fas fa-bullhorn"></i>
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 block">Administración</span>
                                            <span className="text-xs text-gray-500 block">{dateStr} a las {timeStr}</span>
                                        </div>

                                        {/* Botón Borrar (Solo Admin) */}
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleDelete(announcement.id)}
                                                className="ml-auto text-gray-400 hover:text-red-500 p-2 transition-colors"
                                                title="Eliminar publicación"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        )}
                                    </div>

                                    {/* Cuerpo de la Tarjeta */}
                                    <div className="p-4">
                                        {/* Texto */}
                                        {announcement.contenido && (
                                            <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap break-words mb-4">
                                                {announcement.contenido} 
                                            </div>
                                        )}

                                        {/* Imagen */}
                                        {imageUrl && (
                                            <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100">
                                                <img 
                                                    src={imageUrl} 
                                                    alt="Anuncio" 
                                                    className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                                                    onClick={() => setFullImage(imageUrl)}
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            {/* Elemento invisible para autoscroll */}
            <div ref={scrollRef}></div>
        </div>

        {/* --- INPUT ÁREA (SOLO ADMIN - FIXED BOTTOM) --- */}
        {isAdmin && (
            <div className="fixed bottom-[64px] left-0 w-full bg-[#111827] border-t border-gray-700 p-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                <div className="max-w-4xl mx-auto relative">
                    
                    {/* Preview Imagen Flotante */}
                    {imagePreview && (
                        <div className="absolute bottom-full left-0 mb-3 p-2 bg-[#1F2937] rounded-lg border border-gray-600 shadow-xl animate-in slide-in-from-bottom-2 flex items-center gap-3">
                            <img src={imagePreview} className={`w-16 h-16 object-cover rounded-md border border-gray-500 ${isUploadingImage ? 'opacity-50' : ''}`} />
                            
                            {isUploadingImage ? (
                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                    <i className="fas fa-spinner fa-spin"></i> Subiendo...
                                </span>
                            ) : (
                                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                    <i className="fas fa-check"></i> Lista
                                </span>
                            )}

                            <button onClick={clearImage} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white w-6 h-6 rounded-full flex items-center justify-center transition-colors ml-2">
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-[#1F2937] p-2 rounded-2xl border border-gray-600 focus-within:border-[#FF3888] transition-colors">
                        
                        {/* Botón Clip */}
                        <label className="p-3 text-gray-400 hover:text-white cursor-pointer transition-colors shrink-0 active:scale-90">
                            <i className="fas fa-image text-xl"></i>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageSelect}
                                ref={fileInputRef}
                                disabled={isUploadingImage}
                            />
                        </label>

                        {/* Textarea Auto-expandible */}
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Escribe un nuevo anuncio para la comunidad..."
                            className="flex-1 bg-transparent text-white outline-none resize-none py-3 max-h-32 custom-scrollbar placeholder-gray-500 text-sm sm:text-base"
                            rows={1}
                            style={{ minHeight: '48px' }}
                            onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 128) + 'px';
                            }}
                        />

                        {/* Botón Enviar */}
                        <button 
                            type="submit" 
                            disabled={sending || isUploadingImage || (!text.trim() && !uploadedImageUrl)}
                            className="p-3 text-[#FF3888] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 active:scale-90"
                        >
                            {sending ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="fas fa-paper-plane text-xl"></i>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- VISOR DE IMAGEN FULLSCREEN --- */}
        {fullImage && (
            <div 
                className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                onClick={() => setFullImage(null)}
            >
                <button className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl font-light">&times;</button>
                <img 
                    src={fullImage} 
                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain select-none" 
                    onClick={(e) => e.stopPropagation()} // Evitar cerrar si click en la imagen
                />
            </div>
        )}

        <BottomNav />
    </div>
  );
}