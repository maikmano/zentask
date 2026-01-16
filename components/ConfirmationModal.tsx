
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glasscn-container w-full max-w-md rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] -z-10 ${variant === 'danger' ? 'bg-red-500/10' : 'bg-blue-500/10'
                            }`} />

                        <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-2xl ${variant === 'danger' ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'
                                }`}>
                                <AlertCircle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-400' : 'text-zinc-400'}`} />
                            </div>
                            <button
                                onClick={onCancel}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xl font-black text-white tracking-tighter">{title}</h3>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition-all border border-white/5"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${variant === 'danger'
                                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                        : 'glasscn-button-primary'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
