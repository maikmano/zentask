
import React, { useState, useEffect } from 'react';
import { Task, Note } from '../types';
import { Sparkles, RefreshCw, Target, Zap, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import { getDailyInsights } from '../services/geminiService';

interface AIInsightsProps {
  tasks: Task[];
  notes: Note[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ tasks, notes }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    const data = await getDailyInsights(tasks, notes);
    setInsight(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const stats = [
    { 
      label: 'Produtividade', 
      value: `${Math.round((tasks.filter(t => t.status === 'done').length / (tasks.length || 1)) * 100)}%`, 
      icon: TrendingUp,
      color: 'text-emerald-400'
    },
    { 
      label: 'Pendentes', 
      value: tasks.filter(t => t.status === 'todo').length, 
      icon: Activity,
      color: 'text-blue-400'
    },
    { 
      label: 'Humor Médio', 
      value: notes.length > 5 ? 'Elevado' : 'Equilibrado', 
      icon: Zap,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <div className="glasscn-container rounded-[3rem] p-12 text-zinc-100 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/[0.02] rounded-full blur-[100px] group-hover:bg-white/[0.05] transition-all duration-1000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
               <Sparkles className="w-5 h-5 text-zinc-400 animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">Inteligência Pessoal</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter mb-6 leading-tight">Clareza no seu dia.</h2>
          <p className="text-zinc-500 text-lg max-w-xl leading-relaxed font-medium">
            Cruzamos seus dados de execução com suas reflexões diárias para gerar um mapa de progresso único.
          </p>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="mt-10 flex items-center gap-3 glasscn-button-primary px-8 py-4 rounded-2xl text-xs uppercase font-black transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Gerar Novo Mapa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glasscn-card p-8 rounded-[2rem] flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center transition-all group-hover:scale-110">
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glasscn-container rounded-[2.5rem] shadow-2xl overflow-hidden border-white/10">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <h3 className="text-sm font-black text-zinc-200 uppercase tracking-[0.2em]">Otimização Sugerida</h3>
          </div>
          {loading && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
               <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Calculando...</span>
            </div>
          )}
        </div>
        
        <div className="p-12 min-h-[350px]">
          {loading ? (
            <div className="space-y-6">
              <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
              <div className="h-4 bg-white/5 rounded-full w-11/12 animate-pulse"></div>
              <div className="h-4 bg-white/5 rounded-full w-10/12 animate-pulse"></div>
              <div className="pt-10 space-y-4">
                <div className="h-24 bg-white/[0.02] rounded-3xl border border-white/5 w-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="text-lg text-zinc-400 leading-[2] whitespace-pre-wrap font-medium">
              {insight}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
