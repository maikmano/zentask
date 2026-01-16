
/**
 * DOCUMENTAÇÃO DE TIPOS - ZENFLOW
 * Este arquivo define a estrutura de dados que o Backend deve suportar.
 */

export interface TaskTag {
  name: string;
  color: string; // Hexadecimal (ex: #f43f5e)
}

/**
 * Representa uma tarefa dentro de uma coluna do Kanban.
 * No Backend: Tabela 'tasks'
 */
export interface Task {
  id: string; // UUID v4
  columnId: string; // Foreign Key para 'columns.id'
  title: string;
  description: string;
  status: string; // Mapeado via título da coluna (todo, in-progress, done)
  priority: 'low' | 'medium' | 'high';
  createdAt: number; // Timestamp Unix
  deadline?: number; // Timestamp Unix opcional
  tags: TaskTag[]; // Array de objetos serializado ou tabela N:N
}

/**
 * Colunas de um quadro Kanban.
 * No Backend: Tabela 'columns'
 */
export interface Column {
  id: string;
  boardId: string; // Foreign Key para 'boards.id'
  title: string;
  order: number; // Ordem de exibição (index)
}

/**
 * Entidade pai de um fluxo de trabalho.
 * No Backend: Tabela 'boards'
 */
export interface Board {
  id: string;
  title: string;
  icon?: string;
  createdAt: number;
}

/**
 * Notas do diário pessoal.
 * No Backend: Tabela 'notes'
 */
export interface Note {
  id: string;
  title: string;
  content: string; // Conteúdo em HTML (gerado pelo Rich Editor)
  createdAt: number;
  lastModified: number;
}

// Controla a navegação SPA no Frontend
export type ViewType = 'dashboard' | 'notes' | 'ai-insights' | string;
