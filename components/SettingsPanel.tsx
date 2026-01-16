
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Palette, Check, Save, Plus, History, ChevronRight, Zap } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface SettingsPanelProps {
    user: any;
    userProfile: any;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

const AVATARS = [
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aneka&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Lilly&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Jack&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Simba&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Nala&backgroundColor=ffdfbf",
];

export const THEMES = {
    'cyan': {
        name: 'Ocean Cyan',
        colors: ['rgba(8, 145, 178, 0.3)', 'rgba(13, 148, 136, 0.3)', 'rgba(6, 182, 212, 0.15)']
    },
    'sunset': {
        name: 'Sunset Glass',
        colors: ['rgba(244, 63, 94, 0.3)', 'rgba(245, 158, 11, 0.3)', 'rgba(225, 29, 72, 0.15)']
    },
    'emerald': {
        name: 'Emerald Forest',
        colors: ['rgba(16, 185, 129, 0.3)', 'rgba(20, 184, 166, 0.3)', 'rgba(5, 150, 105, 0.15)']
    },
    'midnight': {
        name: 'Midnight Purple',
        colors: ['rgba(76, 29, 149, 0.3)', 'rgba(30, 58, 138, 0.3)', 'rgba(124, 58, 237, 0.15)']
    },
    'mono': {
        name: 'Minimal Black',
        colors: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.01)']
    }
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, userProfile, onClose, currentTheme, onThemeChange }) => {
    const [displayName, setDisplayName] = useState(userProfile?.displayName || user.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || user.photoURL || AVATARS[0]);
    const [customAvatar, setCustomAvatar] = useState<string | null>(
        userProfile?.photoURL && !AVATARS.includes(userProfile.photoURL) ? userProfile.photoURL : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showUpdateNotes, setShowUpdateNotes] = useState(false);

    const UPDATE_HISTORY = [
        {
            version: '0.1.0',
            date: '16 Jan 2026',
            title: 'Seja bem vindo ao Zentask!',
            changes: [
                'Suporte a Comandos "/" (Slash Commands) no editor',
                'Motor de IA atualizado para Gemini 3 Flash Preview',
                'Sistema de Onboarding automático para novos usuários',
                'Layout 100% responsivo para Mobile e Desktop'
            ]
        }
    ];

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Tentar comprimir com qualidade 0.7
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMessage(null);
        setIsSaving(true);

        try {
            let result: string;
            if (file.size > 200 * 1024) {
                result = await compressImage(file);
            } else {
                result = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            setCustomAvatar(result);
            setSelectedAvatar(result);
        } catch (err) {
            setErrorMessage("Erro ao processar imagem.");
            console.error("Upload error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setErrorMessage(null);

        try {
            // 1. Prioridade: Salvar no Firestore (O que o App.tsx exibe via userProfile)
            await setDoc(doc(db, "users", user.uid), {
                displayName,
                photoURL: selectedAvatar,
                theme: currentTheme,
                updatedAt: Date.now()
            }, { merge: true });

            // 2. Tentar atualizar profile do Firebase Auth (secundário)
            try {
                await updateProfile(user, {
                    displayName,
                    photoURL: selectedAvatar
                });
            } catch (authError) {
                console.warn("Auth update failed, but Firestore saved:", authError);
            }

            onClose();
        } catch (e: any) {
            console.error("Critical Save Error:", e);
            setErrorMessage(`Erro ao salvar no banco de dados: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glasscn-container w-full max-w-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-10 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter">Configurações</h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Personalize sua experiência</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                    {/* Sessão de Perfil */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <User className="w-4 h-4" /> Perfil
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Seu Nome</label>
                                <input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full glasscn-input rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-white/10"
                                    placeholder="Como quer ser chamado?"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Novo Upload Button */}
                                <div className="flex flex-col items-center gap-2">
                                    <label className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center cursor-pointer transition-all group">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        <Plus className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                                    </label>
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">Novo Upload</span>
                                </div>

                                {/* Sua Foto Atual (Slot Estilo Discord) */}
                                {customAvatar && (
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => setSelectedAvatar(customAvatar)}
                                            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${selectedAvatar === customAvatar ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                        >
                                            <img src={customAvatar} alt="Sua Foto" className="w-full h-full object-cover" />
                                        </button>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Sua Foto</span>
                                    </div>
                                )}

                                <div className="h-10 w-px bg-white/5 mx-2" />

                                {AVATARS.map((url, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => setSelectedAvatar(url)}
                                            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${selectedAvatar === url ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                        >
                                            <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">#{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="text-xs font-bold text-red-400 mt-2 pl-2">⚠ {errorMessage}</p>
                        )}
                    </section>

                    {/* Sessão de Tema */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Palette className="w-4 h-4" /> Estilo (Glass)
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(THEMES).map(([id, theme]) => (
                                <button
                                    key={id}
                                    onClick={() => onThemeChange(id)}
                                    className={`p-4 rounded-[2rem] border transition-all text-left space-y-3 relative group overflow-hidden ${currentTheme === id ? 'glasscn-card bg-white/5 border-white/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {theme.colors.map((c, i) => (
                                                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                        {currentTheme === id && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Novo: Botão para Notas de Atualização */}
                    <section className="pt-4">
                        <button
                            onClick={() => setShowUpdateNotes(true)}
                            className="w-full glasscn-card p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all">
                                    <History className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-white">Notas de Atualização</h4>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Veja as novidades do Zentask</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                        </button>
                    </section>
                </div>

                {/* Overlay Interno para Notas de Atualização */}
                <AnimatePresence>
                    {showUpdateNotes && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute inset-0 z-50 bg-[#09090b] flex flex-col"
                        >
                            <div className="p-10 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowUpdateNotes(false)}
                                        className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500"
                                    >
                                        <History className="w-6 h-6 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tighter">Histórico</h2>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">O que mudou no Zentask</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowUpdateNotes(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                                {UPDATE_HISTORY.map((update, idx) => (
                                    <div key={idx} className="glasscn-card p-8 rounded-[2.5rem] border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
                                                v{update.version}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{update.date}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight">{update.title}</h3>
                                        <ul className="space-y-3">
                                            {update.changes.map((change, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-zinc-400 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-2 shrink-0" />
                                                    {change}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-10 bg-white/[0.02] border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="glasscn-button-primary px-10 py-4 rounded-2xl flex items-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Salvar Tudo</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
