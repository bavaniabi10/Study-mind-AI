import React, { useState } from 'react';
import { FileText, Sparkles, Download, Copy, Bookmark, Check, Layers, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { NoteResponse, SubjectCategory } from '../types';
import { storage } from '../lib/storage';

interface NotesGeneratorProps {
  subject: SubjectCategory;
  customSubject: string;
  initialTopic?: string;
  initialContext?: string;
  onNoteSaved: () => void;
  onNavigateToQuiz: (topic: string) => void;
}

const SAMPLE_NOTE_TOPICS: { subject: string; topic: string; depth: 'summary' | 'comprehensive' | 'exam_prep' }[] = [
  { subject: 'Computer Science & AI', topic: 'Dynamic Programming vs Greedy Algorithms', depth: 'comprehensive' },
  { subject: 'Mathematics & Statistics', topic: 'Linear Algebra: Eigenvalues & Eigenvectors', depth: 'exam_prep' },
  { subject: 'Physics & Engineering', topic: 'Thermodynamics: Laws & Entropy', depth: 'comprehensive' },
  { subject: 'Chemistry & Biology', topic: 'DNA Replication & Polymerase Enzymes', depth: 'summary' },
  { subject: 'Economics & Business', topic: 'Macroeconomic Monetary Policy & Interest Rates', depth: 'exam_prep' },
  { subject: 'Psychology & Humanities', topic: 'Neuroplasticity & Synaptic Pruning', depth: 'summary' },
];

export const NotesGenerator: React.FC<NotesGeneratorProps> = ({
  subject,
  customSubject,
  initialTopic = '',
  initialContext = '',
  onNoteSaved,
  onNavigateToQuiz
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [lectureText, setLectureText] = useState(initialContext);
  const [depth, setDepth] = useState<'summary' | 'comprehensive' | 'exam_prep'>('comprehensive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteResponse, setNoteResponse] = useState<NoteResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cardsSaved, setCardsSaved] = useState(false);

  const activeSubjectName = subject === 'Custom' ? (customSubject || 'General') : subject;

  const handleGenerate = async (overrideTopic?: string) => {
    const topicToUse = overrideTopic || topic;
    if (!topicToUse.trim() && !lectureText.trim()) {
      setError('Please provide a topic name or paste lecture text.');
      return;
    }

    setLoading(true);
    setError(null);
    setNoteResponse(null);
    setSaved(false);
    setCardsSaved(false);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubjectName,
          topic: topicToUse,
          depth,
          lectureText: lectureText.trim() ? lectureText : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data: NoteResponse = await res.json();
      setNoteResponse(data);

      // Auto-save note to library
      storage.saveNote(data);
      setSaved(true);
      onNoteSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to generate study notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!noteResponse) return;
    navigator.clipboard.writeText(noteResponse.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!noteResponse) return;
    const blob = new Blob([noteResponse.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteResponse.title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveFlashcards = () => {
    if (!noteResponse || !noteResponse.flashcards) return;
    const cardsToSave = noteResponse.flashcards.map((fc, idx) => ({
      id: `fc-${noteResponse.id}-${idx}`,
      subject: noteResponse.subject,
      topic: noteResponse.title,
      front: fc.front,
      back: fc.back,
      status: 'new' as const
    }));
    storage.saveFlashcards(cardsToSave);
    setCardsSaved(true);
  };

  return (
    <div id="notes-generator-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>AI Notes Architect • {activeSubjectName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Generate Structured Study Notes</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Transform raw topics, syllabus modules, or lecture transcripts into exam-ready structured notes.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="md:col-span-2">
            <label htmlFor="notes-topic-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Study Topic / Concept Title:
            </label>
            <input
              id="notes-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Backpropagation in Neural Networks, Dijkstra Algorithm, or Mitosis vs Meiosis"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="notes-depth-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detail Depth:
            </label>
            <select
              id="notes-depth-select"
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="summary">⚡ Executive Summary (Quick Review)</option>
              <option value="comprehensive">📖 Comprehensive Course Notes</option>
              <option value="exam_prep">🎯 Exam Prep & Cheat Sheet</option>
            </select>
          </div>

        </div>

        <div>
          <label htmlFor="notes-transcript-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Optional Source Text / Lecture Transcript / Syllabus Snippet:
          </label>
          <textarea
            id="notes-transcript-input"
            value={lectureText}
            onChange={(e) => setLectureText(e.target.value)}
            placeholder="Paste textbook excerpt, lecture slides text, or professor's speech transcript..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-500 hidden sm:block">
            Auto-extracts key terms, exam pitfalls, and active recall flashcards.
          </div>
          <button
            type="button"
            id="notes-generate-submit-btn"
            disabled={loading || (!topic.trim() && !lectureText.trim())}
            onClick={() => handleGenerate()}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Crafting Master Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Sample Topics */}
      {!noteResponse && !loading && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Try Quick Sample College Topics:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_NOTE_TOPICS.map((st, idx) => (
              <button
                key={idx}
                type="button"
                id={`sample-topic-btn-${idx}`}
                onClick={() => {
                  setTopic(st.topic);
                  setDepth(st.depth);
                  handleGenerate(st.topic);
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer"
              >
                <span className="text-indigo-400 font-semibold mr-1">[{st.subject.split(' ')[0]}]</span>
                {st.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="h-64 bg-slate-800/40 rounded-xl" />
        </div>
      )}

      {/* Notes Display */}
      {noteResponse && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {noteResponse.subject} Notes
                </span>
                {saved && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Saved in Library
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{noteResponse.title}</h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="notes-copy-btn"
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:text-white text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                id="notes-download-btn"
                onClick={handleDownload}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:text-white text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
              Executive Summary
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {noteResponse.executiveSummary}
            </p>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm leading-relaxed border-b border-slate-800 pb-6">
            <div className="markdown-body">
              <ReactMarkdown>{noteResponse.markdownContent}</ReactMarkdown>
            </div>
          </div>

          {/* Key Terms Vocabulary Grid */}
          {noteResponse.keyTerms && noteResponse.keyTerms.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Key Terms & Vocabulary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {noteResponse.keyTerms.map((kt, i) => (
                  <div key={i} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <div className="text-xs font-bold text-indigo-300">{kt.term}</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{kt.definition}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Pitfalls */}
          {noteResponse.examPitfalls && noteResponse.examPitfalls.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>Exam Traps & Loss-of-Marks Checklist</span>
              </h4>
              <ul className="space-y-1.5">
                {noteResponse.examPitfalls.map((ep, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">⚠️</span>
                    <span>{ep}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Recall Flashcards Section */}
          {noteResponse.flashcards && noteResponse.flashcards.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Auto-Generated Revision Flashcards ({noteResponse.flashcards.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active recall questions created from these notes.</p>
                </div>
                <button
                  type="button"
                  id="save-flashcards-vault-btn"
                  onClick={handleSaveFlashcards}
                  disabled={cardsSaved}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {cardsSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>{cardsSaved ? 'Saved to Revision Vault!' : 'Save Flashcards to Revision Vault'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {noteResponse.flashcards.map((fc, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-200">
                      <span className="text-indigo-400 font-bold mr-1">Q{i + 1}:</span> {fc.front}
                    </div>
                    <div className="text-xs text-emerald-300/90 pt-1 border-t border-slate-800/80">
                      <span className="font-bold text-emerald-400 mr-1">A:</span> {fc.back}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              id="notes-test-quiz-btn"
              onClick={() => onNavigateToQuiz(noteResponse.title)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
            >
              <span>Test Knowledge on {noteResponse.title} with Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
