
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import {
  Plus, Search, Trash2, FileText, ChevronLeft,
  Bold as BoldIcon, Italic as ItalicIcon, List as ListIcon,
  Heading1, Heading2, Edit3, Terminal, Sparkles, Code,
  Strikethrough, ListOrdered, CheckSquare, Quote, Minus, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc
} from "firebase/firestore";
import { db } from '../services/firebase';
import { ConfirmationModal } from './ConfirmationModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import SlashCommand from './CommandsExtension';

interface NotesSectionProps {
  notes: Note[];
  user: any;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes = [], user }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Configuração do Editor TipTap (Notion Ultimate)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-xl bg-white/5 p-6 border border-white/10 font-mono text-emerald-400',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Comece a digitar algo incrível (e tente usar Markdown!)',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Image,
      Typography,
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
      }),
      SlashCommand,
    ],
    content: selectedNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-zinc-300',
      },
    },
    onUpdate: ({ editor }) => {
      const markdownContent = (editor.storage as any).markdown.getMarkdown();
      if (selectedNoteId) {
        handleContentChange(markdownContent);
      }
    },
  }, [selectedNoteId]);

  useEffect(() => {
    if (editor && selectedNote && (editor.storage as any).markdown.getMarkdown() !== selectedNote.content) {
      editor.commands.setContent(selectedNote.content);
    }
  }, [selectedNoteId, editor]);

  const handleContentChange = async (content: string) => {
    if (selectedNoteId) {
      try {
        await updateDoc(doc(db, "notes", selectedNoteId), {
          content,
          lastModified: Date.now()
        });
      } catch (error) {
        console.error("Error updating note content:", error);
      }
    }
  };

  const addNote = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "notes"), {
        title: 'Nova Nota',
        content: '# Título da Nota\nClique aqui para começar a editar...',
        createdAt: Date.now(),
        lastModified: Date.now(),
        userId: user.uid
      });
      setSelectedNoteId(docRef.id);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Nota?',
      message: 'Esta ação não poderá ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "notes", id));
          if (selectedNoteId === id) {
            const remainingNotes = notes.filter(n => n.id !== id);
            setSelectedNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
          }
        } catch (error) {
          console.error("Error deleting note:", error);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateTitle = async (id: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, "notes", id), {
        title: newTitle,
        lastModified: Date.now()
      });
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const filteredNotes = (notes || []).filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full glasscn-container rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Sidebar de Notas */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-72 md:w-80 border-r border-white/10 flex flex-col bg-black/60 md:bg-black/40 backdrop-blur-3xl
        transition-transform duration-300
        ${selectedNoteId && 'hidden md:flex'} 
      `}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <Sparkles className="w-4 h-4 text-zinc-500" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Notas</h3>
            </div>
            <button onClick={addNote} className="p-2.5 bg-white text-black rounded-xl hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input
              className="w-full glasscn-input rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none border border-white/5 focus:border-white/20 transition-all"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {filteredNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 opacity-20">
              <FileText className="w-10 h-10 mb-2" />
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Vazio</p>
            </div>
          )}
          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full text-left p-6 rounded-[2rem] transition-all group relative overflow-hidden flex flex-col gap-2 ${selectedNoteId === note.id ? 'bg-white/10 border border-white/10 shadow-2xl' : 'hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  {new Date(note.lastModified).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <button onClick={(e) => deleteNote(note.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 text-zinc-700 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className={`text-sm font-black truncate tracking-tight ${selectedNoteId === note.id ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                {note.title}
              </h4>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Principal */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-y-auto scrollbar-hide">
        {selectedNote ? (
          <>
            <div className="px-6 md:px-12 py-8 md:py-12 space-y-6 md:space-y-8">
              {/* Botão voltar mobile */}
              <button
                onClick={() => setSelectedNoteId(null)}
                className="md:hidden flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 mb-4"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>

              <input
                className="w-full bg-transparent text-3xl md:text-5xl font-black text-white outline-none tracking-tighter placeholder:text-zinc-900 border-none focus:ring-0"
                value={selectedNote.title}
                onChange={(e) => updateTitle(selectedNote.id, e.target.value)}
                placeholder="Sem Título"
              />

              <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-2 rounded-3xl border border-white/5 w-fit shadow-2xl backdrop-blur-3xl sticky top-4 z-20">
                <ToolbarButton icon={<Heading1 className="w-4 h-4" />} active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} label="H1" />
                <ToolbarButton icon={<Heading2 className="w-4 h-4" />} active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton icon={<BoldIcon className="w-4 h-4" />} active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} label="B" />
                <ToolbarButton icon={<ItalicIcon className="w-4 h-4" />} active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} label="I" />
                <ToolbarButton icon={<Strikethrough className="w-4 h-4" />} active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} label="Strike" />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton icon={<ListIcon className="w-4 h-4" />} active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} label="Bullet" />
                <ToolbarButton icon={<ListOrdered className="w-4 h-4" />} active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} label="Num" />
                <ToolbarButton icon={<CheckSquare className="w-4 h-4" />} active={editor?.isActive('taskList')} onClick={() => editor?.chain().focus().toggleTaskList().run()} label="Tasks" />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton icon={<Quote className="w-4 h-4" />} active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} label="Quote" />
                <ToolbarButton icon={<Minus className="w-4 h-4" />} onClick={() => editor?.chain().focus().setHorizontalRule().run()} label="Rule" />
                <ToolbarButton icon={<Code className="w-4 h-4" />} active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} label="Code" />
              </div>

              <div className="editor-container">
                <EditorContent editor={editor} />
              </div>
            </div>

            <style>{`
                .ProseMirror {
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 1.15rem;
                    line-height: 1.6;
                    color: #d4d4d8;
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #27272a;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror h1 { font-size: 2.75rem; font-weight: 900; color: white; margin: 2rem 0 1rem 0; letter-spacing: -0.05em; line-height: 1.1; }
                .ProseMirror h2 { font-size: 1.85rem; font-weight: 800; color: white; margin: 1.75rem 0 0.75rem 0; letter-spacing: -0.03em; }
                .ProseMirror h3 { font-size: 1.45rem; font-weight: 700; color: white; margin: 1.5rem 0 0.5rem 0; }
                
                .ProseMirror blockquote {
                    border-left: 4px solid rgba(255,255,255,0.2);
                    padding-left: 1.5rem;
                    color: #a1a1aa;
                    font-style: italic;
                    margin: 1.5rem 0;
                }
                
                .ProseMirror pre {
                    background: rgba(255,255,255,0.03);
                    padding: 2rem;
                    border-radius: 1.5rem;
                    border: 1px solid rgba(255,255,255,0.08);
                    margin: 2rem 0;
                    font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
                    color: #34d399;
                }
                
                .ProseMirror code {
                    color: #34d399;
                    background: rgba(52, 211, 153, 0.1);
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.4rem;
                    font-size: 0.9em;
                }

                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.8rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    height: 1.84rem; /* Mesma altura que o line-height (1.15rem * 1.6) */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                    margin: 0 !important;
                }
                .ProseMirror ul[data-type="taskList"] li > div {
                    flex: 1 1 auto;
                    margin: 0 !important;
                    min-height: 1.84rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
                    appearance: none;
                    width: 1.1rem;
                    height: 1.1rem;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 4px;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    margin: 0 !important;
                    background: transparent;
                    transform: translateY(14px); /* Ajustado: desceu mais 2px (14px total) */
                }
                .ProseMirror ul[data-type="taskList"] input[type="checkbox"]:checked {
                    background: #34d399;
                    border-color: #34d399;
                }
                .ProseMirror ul[data-type="taskList"] input[type="checkbox"]:checked::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: black;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
                    text-decoration: line-through;
                    opacity: 0.5;
                }

                .ProseMirror hr {
                    border: none;
                    border-top: 2px solid rgba(255,255,255,0.05);
                    margin: 3rem 0;
                }

                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.5rem;
                    margin: 1.5rem 0;
                }
                .ProseMirror li {
                    margin-bottom: 0.5em;
                }
                
                .ProseMirror a {
                    color: #60a5fa;
                    text-decoration: underline;
                    cursor: pointer;
                }
            `}</style>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <FileText className="w-20 h-20 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Selecione uma nota</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; label: string; active?: boolean }> = ({ icon, onClick, label, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 ${active ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
