
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth } from '../services/firebase';
import { Zap, Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) return setError('Preencha os campos para registrar.');
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 z-50 bg-[#09090b]">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glasscn-container w-full max-w-md rounded-[3rem] p-12"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-white text-zinc-950 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">ZEN DESKTOP</h1>
          <p className="text-zinc-500 text-sm mt-2">Sincronização Cloud Ativa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">E-mail Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors" />
              <input
                required type="email" placeholder="seu@email.com"
                className="w-full glasscn-input rounded-2xl py-4 pl-12 pr-4 text-sm font-medium"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Chave de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors" />
              <input
                required type="password" placeholder="••••••••"
                className="w-full glasscn-input rounded-2xl py-4 pl-12 pr-4 text-sm font-medium"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}

          <button
            disabled={isLoading}
            type="submit"
            className="w-full glasscn-button-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"
          >
            {isLoading ? "Acessando..." : "Entrar no Fluxo"}
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            type="button" onClick={handleRegister}
            className="w-full py-2 text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
          >
            Criar nova conta
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-2 text-emerald-500/40">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest">Servidor Protegido</span>
        </div>
      </motion.div>
    </div>
  );
};
