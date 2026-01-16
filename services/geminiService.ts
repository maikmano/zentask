
import { GoogleGenAI } from "@google/genai";
import { Task, Note } from "../types";

/**
 * SERVIÇO DE IA (GEMINI 3 FLASH PREVIEW)
 * Zentask: Focado em Organização e Desenvolvimento Pessoal.
 */

const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getDailyInsights = async (tasks: Task[], notes: Note[]) => {
  const ai = getAIInstance();
  if (!ai) return "Erro: Chave de API não configurada no .env.local.";

  // Filtramos apenas as tarefas ATIVAS (não concluídas) para não sugerir o que já foi feito
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedCount = tasks.filter(t => t.status === 'done').length;

  const tasksContext = activeTasks.map(t => `- [${t.priority || 'média'}] ${t.title}: ${t.description}`).join('\n');
  const notesContext = notes.map(n => `- ${n.title}: ${n.content.replace(/<[^>]*>/g, '').substring(0, 150)}...`).join('\n');

  const userPrompt = `
    Aja como um Coach de Produtividade e Mentor de Organização. 
    Analise o contexto abaixo para fornecer insights estratégicos e de bem-estar.
    
    Resumo da Execução:
    - Tarefas Concluídas Hoje: ${completedCount}
    - Tarefas Pendentes e Desafios: 
    ${tasksContext || "Nenhuma tarefa pendente no momento."}
    
    Reflexões e Notas Mentais:
    ${notesContext || "O usuário não escreveu notas hoje."}
    
    Instruções de Resposta:
    1. NÃO sugira fazer coisas que já foram marcadas como concluídas.
    2. Analise as Notas para dar 2 dicas de MELHORIA PESSOAL (mentalidade, foco, descanso).
    3. Analise as Tarefas Pendentes para sugerir 2 melhorias de ORGANIZAÇÃO (ordem, delegação ou simplificação).
    4. Mantenha um tom profissional, inspirador e direto ao ponto.
    5. Retorne o texto formatado com títulos claros em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        temperature: 0.75, // Um pouco mais criativo para dicas pessoais
      }
    });

    return response.text || "Sem resposta da IA.";

  } catch (error: any) {
    console.error("Erro no Gemini 3 Insights:", error);
    return `Ocorreu um erro ao gerar seus insights: ${error.message}`;
  }
};

export const refineTaskDescription = async (text: string) => {
  const ai = getAIInstance();
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine esta tarefa para um tom mais profissional e acionável em Português: "${text}". Retorne apenas o texto refinado sem aspas.`,
    });
    return response.text?.trim() || text;
  } catch {
    return text;
  }
};
