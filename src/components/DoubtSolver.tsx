import React, { useState } from 'react';
import { HelpCircle, Sparkles, Volume2, VolumeX, ArrowRight, Lightbulb, AlertTriangle, CheckCircle, Copy, Check, FileText, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DoubtResponse, ExplanationStyle, SubjectCategory } from '../types';

interface DoubtSolverProps {
  subject: SubjectCategory;
  customSubject: string;
  onNavigateToNotes: (topic: string, textContext?: string) => void;
  onNavigateToQuiz: (topic: string) => void;
}

const SAMPLE_DOUBTS: { subject: string; question: string; style: ExplanationStyle }[] = [
  { subject: 'Computer Science & AI', question: 'Explain Big O Notation and space vs time complexity simply with real examples.', style: 'feynman' },
  { subject: 'Computer Science & AI', question: 'How do Attention Mechanisms in AI Transformers work step-by-step?', style: 'step_by_step' },
  { subject: 'Mathematics & Statistics', question: 'What is the intuitive meaning of the Derivative vs Integral in Calculus?', style: 'analogies' },
  { subject: 'Physics & Engineering', question: 'Explain Quantum Entanglement and Superposition without complex math equations.', style: 'feynman' },
  { subject: 'Chemistry & Biology', question: 'How does ATP Synthase convert energy in the Mitochondria?', style: 'step_by_step' },
  { subject: 'Economics & Business', question: 'What is the difference between Inflation, Deflation, and Stagflation?', style: 'standard' },
  { subject: 'Psychology & Humanities', question: 'Explain Cognitive Dissonance theory with everyday human examples.', style: 'analogies' },
];

export const DoubtSolver: React.FC<DoubtSolverProps> = ({
  subject,
  customSubject,
  onNavigateToNotes,
  onNavigateToQuiz
}) => {
  const [question, setQuestion] = useState('');
  const [style, setStyle] = useState<ExplanationStyle>('feynman');
  const [contextText, setContextText] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<DoubtResponse | null>(null);

  // Audio TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<number, boolean>>({});

  const activeSubjectName = subject === 'Custom' ? (customSubject || 'General') : subject;

  const handleSolve = async (overrideQuestion?: string, overrideStyle?: ExplanationStyle) => {
    const qToSolve = overrideQuestion || question;
    const styleToUse = overrideStyle || style;

    if (!qToSolve.trim()) {
      setError('Please enter your study doubt or question.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setCheckedTakeaways({});

    try {
      const res = await fetch('/api/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubjectName,
          question: qToSolve,
          style: styleToUse,
          contextText: contextText.trim() ? contextText : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data: DoubtResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to solve doubt. Please check your API key/network connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeak = () => {
    if (!response) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${response.summary}. ${response.answer.replace(/[*#_]/g, '')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    const fullText = `### ${question}\n\n**Summary:** ${response.summary}\n\n${response.answer}\n\n**Key Takeaways:**\n${response.keyTakeaways.map(k => `- ${k}`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="doubt-solver-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>AI Academic Mentor • {activeSubjectName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Ask Any College Study Doubt</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Get instant, deep, or Feynman-style simple explanations tailored to your subject level.
            </p>
          </div>
        </div>
      </div>

      {/* Query Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div>
          <label htmlFor="doubt-question-input" className="block text-xs font-semibold text-slate-300 mb-2">
            What concept or problem are you stuck on?
          </label>
          <textarea
            id="doubt-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`e.g. "Why is time complexity of Merge Sort O(n log n) while QuickSort is O(n^2) worst case?" or "How do I balance redox equations in acidic solutions?"`}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Explanation Style Selector */}
        <div>
          <span className="block text-xs font-semibold text-slate-300 mb-2">Explanation Approach:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'feynman', label: '💡 Feynman (Simple)', desc: 'Plain language, zero fluff' },
              { id: 'standard', label: '🎓 College Standard', desc: 'Rigorous & detailed' },
              { id: 'analogies', label: '🔮 Real Analogies', desc: 'Metaphors & examples' },
              { id: 'step_by_step', label: '🔢 Step-by-Step', desc: 'Logical breakdown' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                id={`style-btn-${st.id}`}
                onClick={() => setStyle(st.id as ExplanationStyle)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  style === st.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold">{st.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Context Toggle */}
        <div>
          <button
            type="button"
            id="toggle-context-btn"
            onClick={() => setShowContext(!showContext)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            {showContext ? '─ Hide Additional Reading Context' : '+ Add Textbook Snippet or Source Context'}
          </button>
          {showContext && (
            <textarea
              id="doubt-context-input"
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="Paste relevant textbook paragraph, problem statement, or code snippet here..."
              rows={3}
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>

        {/* Solve Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-500 hidden sm:block">
            Powered by Gemini 3.6 Flash
          </div>
          <button
            type="button"
            id="doubt-solve-submit-btn"
            disabled={loading || !question.trim()}
            onClick={() => handleSolve()}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Analyzing & Solving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Explain Concept & Solve Doubt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample Doubts Quick Bar */}
      {!response && !loading && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular College Doubt Prompts (Click to test):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_DOUBTS.map((sd, i) => (
              <button
                key={i}
                id={`sample-doubt-btn-${i}`}
                type="button"
                onClick={() => {
                  setQuestion(sd.question);
                  setStyle(sd.style);
                  handleSolve(sd.question, sd.style);
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer"
              >
                <span className="text-indigo-400 font-semibold mr-1">[{sd.subject.split(' ')[0]}]</span>
                {sd.question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-20 bg-slate-800/60 rounded-xl" />
          <div className="h-32 bg-slate-800/40 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-slate-800/40 rounded-xl" />
            <div className="h-24 bg-slate-800/40 rounded-xl" />
          </div>
        </div>
      )}

      {/* Explanation Results View */}
      {response && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Concept Breakdown • {style.toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{question}</h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="tts-speak-btn"
                onClick={toggleSpeak}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen Answer'}</span>
              </button>

              <button
                type="button"
                id="copy-answer-btn"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Explanation'}</span>
              </button>
            </div>
          </div>

          {/* Core Executive Summary Pill */}
          <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Executive Summary</div>
              <p className="text-sm text-slate-200 mt-1 leading-relaxed font-medium">{response.summary}</p>
            </div>
          </div>

          {/* Main Answer Markdown Content */}
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed border-b border-slate-800 pb-6">
            <div className="markdown-body">
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          </div>

          {/* Analogy Card if present */}
          {response.analogies && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <span>🔮 Mental Model & Analogy</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic">{response.analogies}</p>
            </div>
          )}

          {/* Grid: Key Takeaways & Common Misconceptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Key Takeaways */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Exam Essentials (Check to Memorize)</span>
              </h4>
              <ul className="space-y-2">
                {response.keyTakeaways.map((kt, i) => (
                  <li
                    key={i}
                    onClick={() => setCheckedTakeaways(prev => ({ ...prev, [i]: !prev[i] }))}
                    className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedTakeaways[i]}
                      onChange={() => {}}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={checkedTakeaways[i] ? 'line-through text-slate-500' : ''}>{kt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Misconceptions */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Common Traps & Misconceptions</span>
              </h4>
              <ul className="space-y-2">
                {response.commonMisconceptions.map((cm, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{cm}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Follow-up Questions & Next Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-400">Deepen Your Understanding (Follow-up prompts):</div>
            <div className="flex flex-wrap gap-2">
              {response.suggestedFollowUps.map((fu, i) => (
                <button
                  key={i}
                  type="button"
                  id={`follow-up-btn-${i}`}
                  onClick={() => {
                    setQuestion(fu);
                    handleSolve(fu, style);
                  }}
                  className="text-xs bg-slate-950 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-700/60 rounded-xl px-3 py-2 transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{fu}</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Cross-Tool Navigation Shortcuts */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                id="convert-to-notes-btn"
                onClick={() => onNavigateToNotes(question, response.answer)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Generate Full Study Notes</span>
              </button>

              <button
                type="button"
                id="convert-to-quiz-btn"
                onClick={() => onNavigateToQuiz(question)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Test Knowledge With Quiz</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
