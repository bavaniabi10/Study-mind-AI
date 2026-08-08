import React, { useState } from 'react';
import { Target, Sparkles, HelpCircle, CheckCircle, XCircle, Trophy, RefreshCw, ArrowRight, Lightbulb, FileText } from 'lucide-react';
import { QuizQuestion, QuizResult, SubjectCategory } from '../types';
import { storage } from '../lib/storage';

interface QuizArenaProps {
  subject: SubjectCategory;
  customSubject: string;
  initialTopic?: string;
  onQuizCompleted: () => void;
  onNavigateToNotes: (topic: string) => void;
  onNavigateToDoubt: (question: string) => void;
}

const SAMPLE_QUIZ_TOPICS = [
  'Algorithms: Time & Space Complexity',
  'Calculus: Limits & Derivatives',
  'Physics: Newton Laws & Momentum',
  'Chemistry: Chemical Bonding & Geometry',
  'Economics: Supply, Demand & Equilibrium',
  'Psychology: Classical & Operant Conditioning'
];

export const QuizArena: React.FC<QuizArenaProps> = ({
  subject,
  customSubject,
  initialTopic = '',
  onQuizCompleted,
  onNavigateToNotes,
  onNavigateToDoubt
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focus, setFocus] = useState<'conceptual' | 'numerical' | 'application'>('conceptual');

  // Quiz State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const activeSubjectName = subject === 'Custom' ? (customSubject || 'General') : subject;

  const handleGenerateQuiz = async (overrideTopic?: string) => {
    const topicToUse = overrideTopic || topic;
    if (!topicToUse.trim()) {
      setError('Please enter a topic for the quiz.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setShowExplanation({});
    setShowHint({});
    setQuizFinished(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubjectName,
          topic: topicToUse,
          numQuestions,
          difficulty,
          focus
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions returned. Please try again.');
      }

      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (userAnswers[questionIndex] !== undefined) return; // Answered already
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setShowExplanation((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    let score = 0;
    const answerArr: number[] = [];
    questions.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      answerArr.push(uAns !== undefined ? uAns : -1);
      if (uAns === q.correctAnswerIndex) score++;
    });

    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      topic,
      subject: activeSubjectName,
      score,
      totalQuestions: questions.length,
      userAnswers: answerArr,
      timestamp: Date.now(),
      questions
    };

    storage.saveQuizResult(result);
    onQuizCompleted();
  };

  const currentQ = questions[currentIndex];
  const isCurrentAnswered = userAnswers[currentIndex] !== undefined;

  // Calculate score if finished
  const correctCount = questions.reduce((acc, q, i) => (userAnswers[i] === q.correctAnswerIndex ? acc + 1 : acc), 0);
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div id="quiz-arena-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>AI Practice Arena • {activeSubjectName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Interactive MCQ & Exam Quizzes</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Practice conceptual, numerical, or application MCQs with instant feedback and detailed explanations.
          </p>
        </div>
      </div>

      {/* Generator Form (if no questions active or finished) */}
      {questions.length === 0 && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <div>
            <label htmlFor="quiz-topic-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Quiz Topic / Module:
            </label>
            <input
              id="quiz-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Asymptotic Complexity, Cell Division, Macroeconomics Inflation, Quantum Mechanics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="quiz-num-select" className="block text-xs font-semibold text-slate-300 mb-1.5">Questions Count:</label>
              <select
                id="quiz-num-select"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value={3}>3 Questions (Quick Check)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Full Test)</option>
              </select>
            </div>

            <div>
              <label htmlFor="quiz-difficulty-select" className="block text-xs font-semibold text-slate-300 mb-1.5">Difficulty Level:</label>
              <select
                id="quiz-difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value="easy">🟢 Easy / Fundamentals</option>
                <option value="medium">🟡 Medium / College Midterm</option>
                <option value="hard">🔴 Hard / Advanced Exam</option>
              </select>
            </div>

            <div>
              <label htmlFor="quiz-focus-select" className="block text-xs font-semibold text-slate-300 mb-1.5">Question Focus:</label>
              <select
                id="quiz-focus-select"
                value={focus}
                onChange={(e) => setFocus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value="conceptual">🧠 Conceptual Understanding</option>
                <option value="numerical">🔢 Numerical / Problem Solving</option>
                <option value="application">💼 Real Case Application</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-500 hidden sm:block">
              Includes distractors and trap explanation analysis.
            </div>
            <button
              type="button"
              id="quiz-start-btn"
              disabled={loading || !topic.trim()}
              onClick={() => handleGenerateQuiz()}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Sample Quiz Topics */}
      {questions.length === 0 && !loading && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Practice Topics:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUIZ_TOPICS.map((st, i) => (
              <button
                key={i}
                type="button"
                id={`sample-quiz-topic-btn-${i}`}
                onClick={() => {
                  setTopic(st);
                  handleGenerateQuiz(st);
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer"
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-slate-800 rounded w-1/4" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="space-y-2">
            <div className="h-10 bg-slate-800/40 rounded-lg" />
            <div className="h-10 bg-slate-800/40 rounded-lg" />
            <div className="h-10 bg-slate-800/40 rounded-lg" />
            <div className="h-10 bg-slate-800/40 rounded-lg" />
          </div>
        </div>
      )}

      {/* Active Quiz Taking Screen */}
      {questions.length > 0 && !quizFinished && currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {currentQ.conceptTag || topic}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="hint-toggle-btn"
              onClick={() => setShowHint((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{showHint[currentIndex] ? 'Hide Hint' : 'Show Hint'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Hint Card */}
          {showHint[currentIndex] && currentQ.hint && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-200 italic flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div><strong>Hint:</strong> {currentQ.hint}</div>
            </div>
          )}

          {/* Question Text */}
          <div className="text-base font-semibold text-white leading-relaxed">
            {currentQ.question}
          </div>

          {/* Option Cards Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = userAnswers[currentIndex] === optIdx;
              const isCorrect = optIdx === currentQ.correctAnswerIndex;
              let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/50';

              if (isCurrentAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold';
                } else {
                  btnStyle = 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  id={`option-btn-${currentIndex}-${optIdx}`}
                  disabled={isCurrentAnswered}
                  onClick={() => handleSelectOption(currentIndex, optIdx)}
                  className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isCurrentAnswered && (
                    <div className="shrink-0">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Drawer */}
          {isCurrentAnswered && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 animate-fadeIn">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Solution & Explanation
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              id="prev-q-btn"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                id="next-q-btn"
                disabled={!isCurrentAnswered}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                id="finish-quiz-btn"
                disabled={!isCurrentAnswered}
                onClick={handleFinishQuiz}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
              >
                Complete Quiz & View Score
              </button>
            )}
          </div>

        </div>
      )}

      {/* Finished Quiz Performance Summary Screen */}
      {quizFinished && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="text-center space-y-3 py-4 border-b border-slate-800">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
            <p className="text-xs text-slate-400">Result for topic: <span className="text-indigo-300 font-semibold">{topic}</span></p>

            <div className="inline-block bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3">
              <div className="text-3xl font-extrabold text-white">
                {correctCount} / {questions.length} <span className="text-indigo-400 text-lg">({scorePercent}%)</span>
              </div>
              <div className="text-xs font-medium text-slate-400 mt-1">
                {scorePercent >= 80 ? '🎉 Outstanding Concept Mastery!' : scorePercent >= 60 ? '👍 Good Effort! Review weak spots.' : '💪 Needs Concept Revision.'}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Detailed Answers Review</h4>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userAns = userAnswers[idx];
                const isCorrect = userAns === q.correctAnswerIndex;
                return (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-200">
                        <span className="text-indigo-400 font-bold mr-1.5">Q{idx + 1}:</span>
                        {q.question}
                      </div>
                      <div>
                        {isCorrect ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Correct
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                            Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      <div><strong className="text-slate-300">Your Answer:</strong> {userAns !== undefined ? q.options[userAns] : 'Not answered'}</div>
                      {!isCorrect && (
                        <div className="text-emerald-400 font-medium"><strong>Correct Option:</strong> {q.options[q.correctAnswerIndex]}</div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60 leading-relaxed">
                      {q.explanation}
                    </div>

                    {!isCorrect && (
                      <div className="pt-1 flex space-x-2">
                        <button
                          type="button"
                          id={`ask-doubt-q-${idx}`}
                          onClick={() => onNavigateToDoubt(`Explain in depth why "${q.options[q.correctAnswerIndex]}" is correct for: ${q.question}`)}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Ask AI Mentor About This Doubt</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              id="retake-quiz-btn"
              onClick={() => {
                setQuestions([]);
                setQuizFinished(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>

            <button
              type="button"
              id="generate-notes-for-weak-btn"
              onClick={() => onNavigateToNotes(topic)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Notes for {topic}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
