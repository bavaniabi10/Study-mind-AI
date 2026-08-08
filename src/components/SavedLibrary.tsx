import React, { useState, useEffect } from 'react';
import { Library, FileText, Target, Calendar, Layers, Trash2, Search, ExternalLink, Download } from 'lucide-react';
import { NoteResponse, QuizResult, StudyPlan, Flashcard } from '../types';
import { storage } from '../lib/storage';

interface SavedLibraryProps {
  onSelectNote: (note: NoteResponse) => void;
  onSelectPlan: (plan: StudyPlan) => void;
}

export const SavedLibrary: React.FC<SavedLibraryProps> = ({ onSelectNote, onSelectPlan }) => {
  const [filter, setFilter] = useState<'all' | 'notes' | 'quizzes' | 'plans' | 'flashcards'>('all');
  const [search, setSearch] = useState('');

  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const loadData = () => {
    setNotes(storage.getNotes());
    setQuizzes(storage.getQuizzes());
    setPlans(storage.getPlans());
    setFlashcards(storage.getFlashcards());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteNote(id);
    loadData();
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deletePlan(id);
    loadData();
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) || n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter((q) =>
    q.topic.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlans = plans.filter((p) =>
    p.goal.toLowerCase().includes(search.toLowerCase()) || p.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="saved-library-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Library className="w-4 h-4" />
              <span>Personal Knowledge Base</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Saved Notes, Quizzes & Study Plans</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Access your saved study materials anytime across sessions.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="library-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'notes', label: `Saved Notes (${notes.length})` },
          { id: 'quizzes', label: `Quizzes (${quizzes.length})` },
          { id: 'plans', label: `Study Plans (${plans.length})` },
          { id: 'flashcards', label: `Flashcards (${flashcards.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`filter-btn-${tab.id}`}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        
        {/* Saved Notes List */}
        {(filter === 'all' || filter === 'notes') && filteredNotes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Saved Notes ({filteredNotes.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onSelectNote(n)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-400">{n.subject}</span>
                      <span>{new Date(n.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {n.executiveSummary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 text-[10px]">
                      {n.keyTerms?.length || 0} Key Terms • {n.flashcards?.length || 0} Flashcards
                    </span>
                    <button
                      type="button"
                      id={`delete-note-btn-${n.id}`}
                      onClick={(e) => handleDeleteNote(n.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Plans List */}
        {(filter === 'all' || filter === 'plans') && filteredPlans.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Saved Study Plans ({filteredPlans.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPlans.map((p) => {
                const comp = p.dailyTasks ? p.dailyTasks.filter((t) => t.completed).length : 0;
                const tot = p.dailyTasks ? p.dailyTasks.length : 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlan(p)}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-emerald-400">{p.subject}</span>
                        <span>{p.totalDays} Days Plan</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {p.goal}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {p.weeklyOverview}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-emerald-400 font-medium text-[11px]">
                        Progress: {comp}/{tot} Days Completed
                      </span>
                      <button
                        type="button"
                        id={`delete-plan-btn-${p.id}`}
                        onClick={(e) => handleDeletePlan(p.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiz Results List */}
        {(filter === 'all' || filter === 'quizzes') && filteredQuizzes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>Past Quiz Results ({filteredQuizzes.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredQuizzes.map((q) => (
                <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-400">{q.subject}</span>
                    <span className="text-slate-400">{new Date(q.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{q.topic}</h4>
                  <div className="text-xs text-slate-300">
                    Score: <strong className="text-emerald-400">{q.score} / {q.totalQuestions}</strong> ({Math.round((q.score / q.totalQuestions) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flashcards Count Summary */}
        {(filter === 'all' || filter === 'flashcards') && flashcards.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Revision Flashcards Vault</h4>
                <p className="text-xs text-slate-400">{flashcards.length} Total Cards Saved ({flashcards.filter(c => c.status === 'mastered').length} Mastered)</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {notes.length === 0 && quizzes.length === 0 && plans.length === 0 && flashcards.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Library className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">Library is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Generated notes, quizzes, study plans, and flashcards will be stored here automatically!
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
