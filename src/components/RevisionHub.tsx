import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, RotateCw, CheckCircle2, Flame, Award, Trash2 } from 'lucide-react';
import { Flashcard, SubjectCategory } from '../types';
import { storage } from '../lib/storage';

interface RevisionHubProps {
  subject: SubjectCategory;
  customSubject: string;
}

export const RevisionHub: React.FC<RevisionHubProps> = ({ subject, customSubject }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deck State
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeSubjectName = subject === 'Custom' ? (customSubject || 'General') : subject;

  useEffect(() => {
    // Load saved flashcards from storage
    const savedCards = storage.getFlashcards();
    setCards(savedCards);
  }, []);

  const handleGenerateCards = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to generate flashcards.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/revision/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubjectName,
          topic,
          count: 8
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        storage.saveFlashcards(data.flashcards);
        const updated = storage.getFlashcards();
        setCards(updated);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (ease: 'hard' | 'good' | 'easy') => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    const newStatus = ease === 'easy' ? 'mastered' : 'learning';

    storage.updateFlashcardStatus(currentCard.id, newStatus, ease);
    const updated = storage.getFlashcards();
    setCards(updated);

    // Advance to next card
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleDeleteCurrent = () => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    storage.deleteFlashcard(currentCard.id);
    const updated = storage.getFlashcards();
    setCards(updated);
    setIsFlipped(false);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const currentCard = cards[currentIndex];
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;

  return (
    <div id="revision-hub-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Spaced Repetition Vault • {activeSubjectName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Active Recall Flashcards</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Master core formulas, definitions, and concepts through active recall testing.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 self-start sm:self-auto">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">{masteredCount} / {cards.length} Mastered</div>
              <div className="text-[10px] text-slate-400">Total Cards in Vault</div>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <label htmlFor="flashcard-topic-input" className="block text-xs font-semibold text-slate-300">
          Generate New Flashcard Deck by Topic:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="flashcard-topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Organic Reactions, Fourier Series, Data Structures, Macroeconomics"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            id="flashcard-generate-btn"
            disabled={loading || !topic.trim()}
            onClick={handleGenerateCards}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Generate Deck</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Interactive 3D Flashcard Player */}
      {cards.length > 0 && currentCard ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Card Meta Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400">
                Card {currentIndex + 1} of {cards.length}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {currentCard.topic}
              </span>
              {currentCard.status === 'mastered' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Mastered
                </span>
              )}
            </div>

            <button
              type="button"
              id="delete-flashcard-btn"
              onClick={handleDeleteCurrent}
              className="text-xs text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
              title="Delete Card"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Flashcard Box */}
          <div
            id="flashcard-flipper-box"
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[220px] bg-slate-950 border-2 border-slate-800 hover:border-indigo-500/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform hover:scale-[1.01] shadow-inner relative select-none"
          >
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
              {isFlipped ? 'ANSWER / BACK (CLICK TO FLIP)' : 'QUESTION / FRONT (CLICK TO FLIP)'}
            </div>

            <div className={`text-base sm:text-lg font-medium leading-relaxed max-w-2xl ${isFlipped ? 'text-emerald-300' : 'text-white'}`}>
              {isFlipped ? currentCard.back : currentCard.front}
            </div>

            <div className="mt-4 text-xs text-indigo-400 flex items-center gap-1 font-semibold">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap card to reveal {isFlipped ? 'question' : 'answer'}</span>
            </div>
          </div>

          {/* Rating Buttons */}
          <div className="pt-2 space-y-2">
            <div className="text-center text-xs font-medium text-slate-400">Rate your recall speed:</div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                id="rate-hard-btn"
                onClick={() => handleRating('hard')}
                className="p-3 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                🔴 Hard (Repeat)
              </button>

              <button
                type="button"
                id="rate-good-btn"
                onClick={() => handleRating('good')}
                className="p-3 bg-indigo-950/40 border border-indigo-800/60 hover:bg-indigo-900/60 text-indigo-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                🟡 Good (Learning)
              </button>

              <button
                type="button"
                id="rate-easy-btn"
                onClick={() => handleRating('easy')}
                className="p-3 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                🟢 Easy (Mastered!)
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Flashcards in Vault Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Type a topic above to generate a new active-recall deck, or convert your generated Smart Notes into flashcards!
          </p>
        </div>
      )}

    </div>
  );
};
