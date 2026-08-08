import { NoteResponse, QuizResult, StudyPlan, Flashcard } from '../types';

const NOTES_KEY = 'studymind_saved_notes';
const QUIZZES_KEY = 'studymind_quiz_results';
const PLANS_KEY = 'studymind_saved_plans';
const CARDS_KEY = 'studymind_revision_cards';

export const storage = {
  getNotes: (): NoteResponse[] => {
    try {
      const data = localStorage.getItem(NOTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveNote: (note: NoteResponse) => {
    const notes = storage.getNotes().filter((n) => n.id !== note.id);
    notes.unshift(note);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  },
  deleteNote: (id: string) => {
    const notes = storage.getNotes().filter((n) => n.id !== id);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  },

  getQuizzes: (): QuizResult[] => {
    try {
      const data = localStorage.getItem(QUIZZES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveQuizResult: (result: QuizResult) => {
    const quizzes = storage.getQuizzes();
    quizzes.unshift(result);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  },

  getPlans: (): StudyPlan[] => {
    try {
      const data = localStorage.getItem(PLANS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  savePlan: (plan: StudyPlan) => {
    const plans = storage.getPlans().filter((p) => p.id !== plan.id);
    plans.unshift(plan);
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  },
  updatePlanTask: (planId: string, dayNumber: number, completed: boolean) => {
    const plans = storage.getPlans();
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const task = plan.dailyTasks.find((t) => t.dayNumber === dayNumber);
      if (task) {
        task.completed = completed;
        localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
      }
    }
  },
  deletePlan: (id: string) => {
    const plans = storage.getPlans().filter((p) => p.id !== id);
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  },

  getFlashcards: (): Flashcard[] => {
    try {
      const data = localStorage.getItem(CARDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveFlashcards: (newCards: Flashcard[]) => {
    const existing = storage.getFlashcards();
    const existingIds = new Set(existing.map((c) => c.id));
    const toAdd = newCards.filter((c) => !existingIds.has(c.id));
    const updated = [...toAdd, ...existing];
    localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
  },
  updateFlashcardStatus: (cardId: string, status: 'new' | 'learning' | 'mastered', easeRating?: 'hard' | 'good' | 'easy') => {
    const cards = storage.getFlashcards();
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      card.status = status;
      if (easeRating) card.easeRating = easeRating;
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    }
  },
  deleteFlashcard: (cardId: string) => {
    const cards = storage.getFlashcards().filter((c) => c.id !== cardId);
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
};
