

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from './services/firebase';
import { KanbanBoard } from './components/KanbanBoard';
import { NotesSection } from './components/NotesSection';
import { AIInsights } from './components/AIInsights';
import { Login } from './components/Login';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsPanel, THEMES } from './components/SettingsPanel';
import UpdateNotification from './components/UpdateNotification';
import { Task, Note, Board, Column, ViewType } from './types';
import {
  Layout, BookText, Zap, ChevronLeft, ChevronRight, Palette,
  CircleUser, Plus, Trello, Trash2, Compass, LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [boards, setBoards] = useState<Board[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardIcon, setNewBoardIcon] = useState('📊');
  const [isEditingBoard, setIsEditingBoard] = useState<string | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardIcon, setEditBoardIcon] = useState('📊');
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('cyan');
  const [userProfile, setUserProfile] = useState<{ displayName?: string, photoURL?: string } | null>(null);

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

  // 1. Monitorar apenas o estado de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronizar Perfil e Temas quando o usuário logar
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.theme) setCurrentTheme(data.theme);
        setUserProfile({
          displayName: data.displayName,
          photoURL: data.photoURL
        });
      }
    }, (error) => {
      console.error("Erro na sincronização de perfil:", error);
    });

    return () => unsubUser();
  }, [user]);

  // Sincronização Firestore (Tempo Real)
  useEffect(() => {
    if (!user) return;

    // Listeners para coleções do usuário
    const qBoards = query(collection(db, "boards"), where("userId", "==", user.uid));
    const unsubBoards = onSnapshot(qBoards, (snapshot) => {
      setBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board)));
      setIsDataLoaded(true);
    });

    const qColumns = query(collection(db, "columns"), where("userId", "==", user.uid));
    const unsubColumns = onSnapshot(qColumns, (snap) => {
      setColumns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Column)));
    });

    const qTasks = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });

    const qNotes = query(collection(db, "notes"), where("userId", "==", user.uid));
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Note)));
    });

    return () => {
      unsubBoards();
      unsubColumns();
      unsubTasks();
      unsubNotes();
    };
  }, [user]);

  // Logic de Onboarding (Boas-vindas para novos usuários)
  useEffect(() => {
    if (user && isDataLoaded && boards.length === 0 && !hasCheckedOnboarding) {
      const createOnboardingData = async () => {
        setHasCheckedOnboarding(true);
        try {
          // Cria Board de Boas-vindas
          const boardDoc = await addDoc(collection(db, "boards"), {
            title: "🚀 Comece Aqui",
            icon: "✨",
            userId: user.uid,
            createdAt: Date.now()
          });

          // Cria Colunas
          const colTitles = ['A Aprender', 'Em Prática', 'Dominado'];
          const colRefs = await Promise.all(colTitles.map((t, i) =>
            addDoc(collection(db, "columns"), {
              boardId: boardDoc.id,
              userId: user.uid,
              title: t,
              order: i
            })
          ));

          // Adiciona Tarefas de Exemplo
          const taskPromises = [
            addDoc(collection(db, "tasks"), {
              boardId: boardDoc.id,
              columnId: colRefs[0].id,
              userId: user.uid,
              title: "Explore o Editor de Notas",
              description: "Use Markdown like # H1 ou - para listas. O alinhamento é pixel-perfect!",
              status: "A Aprender",
              priority: "high",
              createdAt: Date.now(),
              tags: [{ name: "Dica", color: "#34d399" }]
            }),
            addDoc(collection(db, "tasks"), {
              boardId: boardDoc.id,
              columnId: colRefs[0].id,
              userId: user.uid,
              title: "Troque seu Avatar",
              description: "Vá em configurações e mude sua foto (estilo Discord).",
              status: "A Aprender",
              priority: "medium",
              createdAt: Date.now(),
              tags: [{ name: "Perfil", color: "#60a5fa" }]
            })
          ];
          await Promise.all(taskPromises);

          // Adiciona Nota de Boas-vindas
          await addDoc(collection(db, "notes"), {
            title: "📖 Guia do Zentask",
            content: "# Bem-vindo ao seu novo fluxo!\n\nEste é o seu espaço sagrado para produtividade. Aqui estão algumas dicas:\n\n- **Modo Desktop**: O app foi feito para parecer nativo.\n- **IA Insights**: No menu lateral, a IA analisa seu dia.\n- **Markdown**: Use `/` ou atalhos para formatar.\n\nDivirta-se!",
            userId: user.uid,
            createdAt: Date.now(),
            lastModified: Date.now()
          });

        } catch (error) {
          console.error("Erro no onboarding:", error);
        }
      };
      createOnboardingData();
    } else if (boards.length > 0) {
      setHasCheckedOnboarding(true);
    }
  }, [user, boards, loading, hasCheckedOnboarding]);

  const handleLogout = () => signOut(auth);

  const addBoard = async () => {
    if (!user) {
      setSystemError("Usuário não autenticado. Verifique sua conexão ou login.");
      return;
    }

    if (!newBoardTitle.trim()) return;

    setLoading(true);
    try {
      const boardDoc = await addDoc(collection(db, "boards"), {
        title: newBoardTitle.trim(),
        icon: newBoardIcon,
        userId: user.uid,
        createdAt: Date.now()
      });

      const colTitles = ['Pendente', 'Fazendo', 'Feito'];
      const colPromises = colTitles.map((t, i) =>
        addDoc(collection(db, "columns"), {
          boardId: boardDoc.id,
          userId: user.uid,
          title: t,
          order: i
        })
      );

      await Promise.all(colPromises);
      setIsCreatingBoard(false);
      setNewBoardTitle('');
      setView(boardDoc.id);
    } catch (error: any) {
      console.error("Erro completo ao criar board:", error);
      setSystemError(`Erro no Firebase: ${error.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const updateBoard = async () => {
    if (!isEditingBoard) return;
    try {
      await updateDoc(doc(db, "boards", isEditingBoard), {
        title: editBoardTitle.trim(),
        icon: editBoardIcon,
        lastModified: Date.now()
      });
      setIsEditingBoard(null);
    } catch (error) {
      console.error("Erro ao atualizar board:", error);
    }
  };

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Quadro?',
      message: 'Tem certeza que deseja excluir este quadro e todas as suas colunas e tarefas permanentemente?',
      onConfirm: async () => {
        await deleteDoc(doc(db, "boards", id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#09090b]">
      <Zap className="w-12 h-12 text-white animate-pulse" />
    </div>
  );

  if (!user) return <Login />;

  const renderView = () => {
    if (view === 'dashboard') {
      return (
        <div className="p-10 max-w-6xl mx-auto space-y-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Fluxo de {userProfile?.displayName || user.displayName || 'Usuário'}</h1>
            <p className="text-zinc-500 font-medium">Sincronizado na Nuvem. Pronto para produzir.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <motion.button
                whileHover={{ y: -5 }}
                key={board.id}
                onClick={() => setView(board.id)}
                className="glasscn-card p-8 rounded-[2rem] text-left group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all">
                    <span className="text-2xl">{board.icon || '📊'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingBoard(board.id);
                        setEditBoardTitle(board.title);
                        setEditBoardIcon(board.icon || '📊');
                      }}
                      className="p-3 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-2xl transition-all relative z-30"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => deleteBoard(board.id, e)}
                      className="p-3 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-2xl transition-all relative z-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-xl text-zinc-100 mb-2 truncate pr-16">{board.title}</h3>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-widest border border-white/5">
                  Quadro de Produção
                </span>
              </motion.button>
            ))}

            {!isCreatingBoard ? (
              <button
                onClick={() => setIsCreatingBoard(true)}
                className="border-2 border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.03] transition-all group"
              >
                <Plus className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                <span className="text-sm font-bold text-zinc-500">Novo Board</span>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glasscn-card p-8 rounded-[2rem] flex flex-col gap-4 border-white/20 border-2"
              >
                <input
                  autoFocus
                  placeholder="Título do Quadro..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-white/30"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBoard()}
                />

                <div className="flex flex-wrap gap-2 py-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {['📊', '📁', '🚀', '🔥', '💡', '✅', '⚡', '✨', '🧠', '💼', '🎨', '🎮', '🏠', '❤️', '📅', '💰', '📈', '🧘', '🍎', '🏋️', '📚', '🎧', '✈️', '🌍', '🛠️', '⚙️', '📱', '🔔', '🏷️', '🎯'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewBoardIcon(emoji)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newBoardIcon === emoji ? 'bg-white/20 border-2 border-white' : 'hover:bg-white/10'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addBoard}
                    className="flex-1 bg-white text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-2xl shadow-white/10"
                  >
                    Criar Board
                  </button>
                  <button
                    onClick={() => setIsCreatingBoard(false)}
                    className="px-4 py-3 rounded-xl bg-white/5 text-zinc-500 hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {systemError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-10 right-10 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 cursor-pointer"
              onClick={() => setSystemError(null)}
            >
              <div className="bg-white/20 p-2 rounded-full">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Erro de Sincronização</p>
                <p className="text-sm font-bold">{systemError}</p>
              </div>
            </motion.div>
          )}
        </div>
      );
    }

    if (view === 'notes') return <NotesSection notes={notes} user={user} />;
    if (view === 'ai-insights') return <AIInsights tasks={tasks} notes={notes} />;

    const activeBoard = boards.find(b => b.id === view);
    if (activeBoard) {
      return (
        <KanbanBoard
          board={activeBoard}
          columns={columns.filter(c => c.boardId === view)}
          tasks={tasks}
          user={user}
        />
      );
    }
    return null;
  };

  const themeColors = THEMES[currentTheme as keyof typeof THEMES]?.colors || THEMES.cyan.colors;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden p-2 md:p-4 gap-2 md:gap-4 bg-transparent relative">
      {/* Background Dinâmico Baseado no Tema */}
      <style>{`
        body::before {
          background: 
            radial-gradient(circle at 20% 30%, ${themeColors[0]} 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, ${themeColors[1]} 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, ${themeColors[2]} 0%, transparent 55%) !important;
        }
      `}</style>
      {/* Sidebar Nativa / Mobile */}
      <aside
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-24'} 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative inset-y-4 left-4 md:left-0 z-[60] md:z-20
          glasscn-container rounded-[2.5rem] transition-all duration-500 
          flex flex-col border-r border-white/5
        `}
      >
        <div className="h-24 flex items-center px-8 justify-between drag-region">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            {isSidebarOpen && <span className="font-extrabold tracking-tighter text-white text-xl">ZEN</span>}
          </div>
          {/* Botão fechar mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-zinc-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto scrollbar-hide">
          <button
            onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:bg-white/5'}`}
          >
            <Compass className="w-5 h-5" />
            {isSidebarOpen && <span>Início</span>}
          </button>

          <div className="pt-6 pb-2 px-6">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">{isSidebarOpen ? 'Projetos' : '•'}</span>
          </div>

          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => { setView(board.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${view === board.id ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-xs">
                {board.icon || '📊'}
              </span>
              {isSidebarOpen && <span className="truncate">{board.title}</span>}
            </button>
          ))}

          <div className="pt-6 border-t border-white/5 mt-6 space-y-2">
            <button
              onClick={() => { setView('notes'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'notes' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <BookText className="w-5 h-5" />
              {isSidebarOpen && <span>Notas</span>}
            </button>
            <button
              onClick={() => { setView('ai-insights'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'ai-insights' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <Zap className="w-5 h-5" />
              {isSidebarOpen && <span>Insights</span>}
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-4 p-4 rounded-3xl glasscn-card hover:bg-white/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-white/20 transition-all">
              {userProfile?.photoURL || user?.photoURL ? (
                <img src={userProfile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <CircleUser className="w-6 h-6 text-zinc-400 group-hover:text-white" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-black text-white truncate">{userProfile?.displayName || user?.displayName || 'Usuário'}</p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Ativo</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />
        )}
      </AnimatePresence>


      <main className="flex-1 flex flex-col min-w-0 overflow-hidden gap-4">
        <header className="h-20 glasscn-container rounded-[2rem] flex items-center justify-between px-6 md:px-10 shrink-0 drag-region border border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-white"
            >
              <Trello className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-black text-white uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
              {view === 'dashboard' ? 'Início' : view === 'notes' ? 'Minhas Notas' : boards.find(b => b.id === view)?.title || 'Notas'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-zinc-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-3 text-zinc-600 hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto scrollbar-hide no-drag">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ConfirmationModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Modal de Edição de Board */}
      <AnimatePresence>
        {isEditingBoard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glasscn-card max-w-md w-full p-10 rounded-[3rem] border-white/10 space-y-8"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white tracking-tight">Editar Quadro</h2>
                <p className="text-zinc-500 text-sm font-medium">Personalize seu fluxo de trabalho.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Título do Quadro</label>
                  <input
                    autoFocus
                    placeholder="Ex: Trabalho, Estudos..."
                    className="w-full glasscn-input rounded-2xl py-4 px-6 text-sm font-bold outline-none border border-white/5 focus:border-white/20 transition-all"
                    value={editBoardTitle}
                    onChange={(e) => setEditBoardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateBoard()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Escolha um Ícone</label>
                  <div className="grid grid-cols-5 gap-3 p-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {['📊', '📁', '🚀', '🔥', '💡', '✅', '⚡', '✨', '🧠', '💼', '🎨', '🎮', '🏠', '❤️', '📅', '💰', '📈', '🧘', '🍎', '🏋️', '📚', '🎧', '✈️', '🌍', '🛠️', '⚙️', '📱', '🔔', '🏷️', '🎯'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditBoardIcon(emoji)}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-xl transition-all ${editBoardIcon === emoji ? 'bg-white/20 scale-110 shadow-xl border-2 border-white' : 'hover:bg-white/5'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateBoard}
                  className="flex-1 bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
                >
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setIsEditingBoard(null)}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-zinc-500 hover:bg-white/10 transition-all font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            user={user}
            userProfile={userProfile}
            onClose={() => setIsSettingsOpen(false)}
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
        )}
      </AnimatePresence>

      {/* Update Notification */}
      <UpdateNotification />
    </div>
  );
};

export default App;
