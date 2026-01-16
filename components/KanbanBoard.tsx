
import React, { useState } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc
} from "firebase/firestore";
import { db } from '../services/firebase';
import { Task, Column, Board, TaskTag } from '../types';
import {
  Plus, Trash2, Sparkles, MoreHorizontal, Calendar, Clock,
  AlignLeft, Tag as TagIcon, X, Check, AlertCircle
} from 'lucide-react';
import { refineTaskDescription } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';

const PRESET_TAGS: TaskTag[] = [
  { name: 'Urgente', color: '#f43f5e' },
  { name: 'Trabalho', color: '#3b82f6' },
  { name: 'Pessoal', color: '#10b981' },
  { name: 'Estudo', color: '#f59e0b' },
  { name: 'Saúde', color: '#8b5cf6' },
];

interface KanbanBoardProps {
  board: Board;
  columns: Column[];
  tasks: Task[];
  user: any;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board, columns = [], tasks = [], user
}) => {
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const handleOpenCreateTask = (columnId: string) => {
    setEditingTask({
      columnId,
      title: '',
      description: '',
      priority: 'medium',
      createdAt: Date.now(),
      tags: [],
      deadline: undefined
    });
  };

  const handleSaveTask = async () => {
    if (!editingTask || !editingTask.title?.trim() || !user) return;

    try {
      if (editingTask.id) {
        const taskRef = doc(db, "tasks", editingTask.id);
        await updateDoc(taskRef, { ...editingTask });
      } else {
        await addDoc(collection(db, "tasks"), {
          ...editingTask,
          userId: user.uid,
          status: 'todo'
        });
      }
      setEditingTask(null);
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Tarefa',
      message: 'Tem certeza que deseja excluir esta tarefa permanentemente? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        await deleteDoc(doc(db, "tasks", id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('taskId', id);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (id) {
      await updateDoc(doc(db, "tasks", id), { columnId: colId });
    }
    setDraggedTaskId(null);
  };

  const addColumn = async () => {
    if (!newColumnTitle.trim() || !user) return;
    try {
      await addDoc(collection(db, "columns"), {
        boardId: board.id,
        userId: user.uid,
        title: newColumnTitle.trim(),
        order: columns.length
      });
      setNewColumnTitle('');
      setIsAddingColumn(false);
    } catch (e) {
      console.error("Erro ao criar coluna:", e);
    }
  };

  const deleteColumn = async (colId: string) => {
    const colTasks = tasks.filter(t => t.columnId === colId);

    const performDelete = async () => {
      // Excluir tarefas da coluna primeiro
      const deletePromises = colTasks.map(task => deleteDoc(doc(db, "tasks", task.id)));
      await Promise.all(deletePromises);
      // Excluir a coluna
      await deleteDoc(doc(db, "columns", colId));
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    if (colTasks.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Coluna?',
        message: `Esta coluna contém ${colTasks.length} tarefas. Ao excluí-la, todas as tarefas serão removidas permanentemente.`,
        onConfirm: performDelete
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Coluna?',
        message: 'Deseja remover esta coluna permanentemente?',
        onConfirm: performDelete
      });
    }
  };

  const saveColumnTitle = async (colId: string) => {
    if (!editColumnTitle.trim()) return;
    await updateDoc(doc(db, "columns", colId), { title: editColumnTitle.trim() });
    setEditingColumnId(null);
  };

  const handleRefineTask = async () => {
    if (!editingTask?.title) return;
    const refined = await refineTaskDescription(editingTask.title);
    setEditingTask(prev => prev ? ({ ...prev, title: refined }) : null);
  };

  const toggleTag = (tag: TaskTag) => {
    setEditingTask(prev => {
      if (!prev) return null;
      const tags = prev.tags || [];
      const exists = tags.find(t => t.name === tag.name);
      if (exists) {
        return { ...prev, tags: tags.filter(t => t.name !== tag.name) };
      }
      return { ...prev, tags: [...tags, tag] };
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-6 md:px-10 py-4 md:py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{board.title}</h1>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-10 flex gap-4 md:gap-8 scrollbar-hide items-start">
        {columns.sort((a, b) => a.order - b.order).map(col => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
            className="w-80 shrink-0 flex flex-col gap-4 rounded-[2rem] p-4 glasscn-card bg-white/[0.01] hover:bg-white/[0.02]"
          >
            <div className="flex items-center justify-between px-4 py-2 group/col">
              {editingColumnId === col.id ? (
                <input
                  autoFocus
                  className="bg-white/10 border-none outline-none text-xs font-bold text-white rounded px-2 py-1 w-full"
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  onBlur={() => saveColumnTitle(col.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveColumnTitle(col.id)}
                />
              ) : (
                <>
                  <h3
                    onClick={() => { setEditingColumnId(col.id); setEditColumnTitle(col.title); }}
                    className="font-bold text-zinc-500 text-xs uppercase tracking-widest cursor-text hover:text-white transition-colors"
                  >
                    {col.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-600 font-black">
                      {tasks.filter(t => t.columnId === col.id).length}
                    </span>
                    <button
                      onClick={() => deleteColumn(col.id)}
                      className="p-1 opacity-0 group-hover/col:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 min-h-[50px]">
              <AnimatePresence>
                {tasks.filter(t => t.columnId === col.id).map(task => (
                  <motion.div
                    key={task.id} layoutId={task.id} draggable
                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                    onClick={() => setEditingTask(task)}
                    className="glasscn-card p-5 rounded-2xl cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${task.priority === 'high' ? 'border-rose-500/20 text-rose-500' : 'border-zinc-500/20 text-zinc-500'
                        }`}>
                        {task.priority}
                      </div>
                      <button onClick={(e) => deleteTask(task.id, e)} className="p-1 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 mb-2">{task.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      {(task.tags || []).map((tag, i) => (
                        <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-medium pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : '--/--'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button onClick={() => handleOpenCreateTask(col.id)} className="w-full py-3 border border-dashed border-white/5 rounded-2xl text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-all">
              + Nova Tarefa
            </button>
          </div>
        ))}

        {/* Adicionar Nova Coluna */}
        {!isAddingColumn ? (
          <button
            onClick={() => setIsAddingColumn(true)}
            className="w-80 shrink-0 h-16 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center gap-3 text-zinc-600 hover:text-white hover:bg-white/[0.02] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Nova Coluna</span>
          </button>
        ) : (
          <div className="w-80 shrink-0 glasscn-card p-6 rounded-[2rem] flex flex-col gap-4 border-white/20 border-2">
            <input
              autoFocus
              placeholder="Nome da Coluna..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-white/30 font-bold"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            />
            <div className="flex gap-2">
              <button
                onClick={addColumn}
                className="flex-1 bg-white text-black py-2 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-200 transition-colors"
              >
                Criar
              </button>
              <button
                onClick={() => setIsAddingColumn(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glasscn-container w-full max-w-2xl rounded-[3rem] p-10 space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Configurar Tarefa</h3>
                <button onClick={() => setEditingTask(null)}><X className="w-6 h-6 text-zinc-600" /></button>
              </div>

              <input
                className="w-full bg-transparent text-4xl font-black text-white outline-none tracking-tighter"
                placeholder="Nome da tarefa" value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase flex items-center gap-2"><Calendar className="w-3 h-3" /> Prazo</label>
                  <input
                    type="datetime-local" className="w-full glasscn-input rounded-2xl py-3 px-4 text-xs font-bold text-white"
                    value={editingTask.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: new Date(e.target.value).getTime() })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase flex items-center gap-2"><AlertCircle className="w-3 h-3" /> Prioridade</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button key={p} onClick={() => setEditingTask({ ...editingTask, priority: p as any })} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${editingTask.priority === p ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Descrição</label>
                <textarea
                  className="w-full glasscn-input rounded-2xl p-6 text-sm outline-none h-32 resize-none"
                  placeholder="Descrição detalhada..." value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase flex items-center gap-2"><TagIcon className="w-3 h-3" /> Tags</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map(tag => {
                    const active = editingTask.tags?.some(t => t.name === tag.name);
                    return (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-2 ${active ? 'bg-white/10 text-white' : 'text-zinc-500 border-white/5'}`}
                        style={active ? { borderColor: tag.color } : {}}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={handleRefineTask} className="text-[10px] font-black text-zinc-500 flex items-center gap-2 hover:text-white transition-colors"><Sparkles className="w-3 h-3" /> Refinar com Gemini</button>
                <button onClick={handleSaveTask} className="glasscn-button-primary px-10 py-4 rounded-2xl text-[10px] font-black uppercase">Salvar Sincronizado</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
