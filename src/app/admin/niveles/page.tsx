"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import BottomNav from "@/components/admin/BottomNav";
import ColorPicker from "@/components/ui/ColorPicker";
import CustomAlert from "@/components/ui/CustomAlert";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// --- MODAL CORREGIDO CON FORM ---
const LevelModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const [form, setForm] = useState({ nombre: "", color: "#8B5CF6" });
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            if (initialData) setForm(initialData);
            else setForm({ nombre: "", color: "#8B5CF6" });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Guardando nivel:", form);
        await onSubmit(form);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-[#1E293B] rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? "Editar Nivel" : "Nuevo Nivel"}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
                </div>
                
                {/* 👇 AQUI USAMOS FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Nombre del Nivel</label>
                        <input type="text" className="w-full h-11 bg-[#111827] border border-gray-700 rounded-xl px-4 text-white focus:border-[#FF3888] outline-none"
                            value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Avanzado" required />
                    </div>
                    
                    <ColorPicker label="Color del Nivel" value={form.color} onChange={(c) => setForm({...form, color: c})} />

                    <div className="pt-4 border-t border-gray-700 mt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-semibold">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white rounded-full font-bold shadow-lg hover:shadow-pink-900/50 disabled:opacity-50 transition-all">
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function NivelesPage() {
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: 0 });
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' as any });

    const showAlert = (msg: string, type = 'success') => {
        setAlert({ show: true, message: msg, type: type as any });
        setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
    };

    const fetchLevels = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/levels`);
            if (res.ok) setLevels(await res.json());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchLevels(); }, []);

    const handleSave = async (data: any) => {
        if (!data.nombre.trim()) return showAlert("El nombre es obligatorio", "warning");
        
        const token = Cookies.get("token");
        const method = editingLevel ? "PUT" : "POST";
        const url = editingLevel 
            ? `${process.env.NEXT_PUBLIC_API_URL}/levels/${(editingLevel as any).id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/levels`;

        const payload = {
            nombre: data.nombre,
            color: data.color
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                fetchLevels();
                setIsModalOpen(false);
                showAlert(editingLevel ? "Nivel actualizado" : "Nivel creado", "success");
            } else {
                const err = await res.json();
                showAlert(err.message || "Error al guardar", "error");
            }
        } catch (e) { showAlert("Error de conexión", "error"); }
    };

    const handleDelete = async () => {
        const token = Cookies.get("token");
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/levels/${confirmModal.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setLevels(levels.filter(l => l.id !== confirmModal.id));
            showAlert("Nivel eliminado", "success");
        } catch (e) { console.error(e); }
    };

    return (
        <div className="pb-32 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-white mb-6">Niveles Registrados</h2>

            {loading ? <p className="text-white text-center">Cargando...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {levels.map(level => (
                        <div key={level.id} className="bg-[#1E293B] rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:-translate-y-1 transition-transform group">
                            <div className="h-3 w-full" style={{ backgroundColor: level.color }}></div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{level.nombre}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }}></div>
                                    <span className="uppercase">{level.color}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 border-t border-gray-700 bg-[#17202e]">
                                <button onClick={() => { setEditingLevel(level); setIsModalOpen(true); }} className="py-3 text-gray-400 hover:text-white text-sm font-semibold border-r border-gray-700 hover:bg-white/5 transition-colors">Editar</button>
                                <button onClick={() => setConfirmModal({ isOpen: true, id: level.id })} className="py-3 text-red-400 hover:text-red-300 text-sm font-semibold hover:bg-red-900/10 transition-colors">Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={() => { setEditingLevel(null); setIsModalOpen(true); }} className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#C4006B] to-[#FF3888] text-white text-xl shadow-xl hover:scale-110 transition-transform flex items-center justify-center z-30">
                <i className="fas fa-plus"></i>
            </button>

            <LevelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSave} initialData={editingLevel} />
            <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={handleDelete} title="¿Eliminar nivel?" message="Esta acción es irreversible." />
            <CustomAlert isVisible={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, show: false }))} />
            <BottomNav />
        </div>
    );
}