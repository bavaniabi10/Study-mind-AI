import React, { useState } from 'react';
import { Calendar, Sparkles, CheckCircle2, Circle, Clock, Target, Flag, Download, Bookmark, Check, Trash2 } from 'lucide-react';
import { StudyPlan, SubjectCategory } from '../types';
import { storage } from '../lib/storage';

interface StudyPlannerProps {
  subject: SubjectCategory;
  customSubject: string;
  onPlanSaved: () => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  subject,
  customSubject,
  onPlanSaved
}) => {
  const [goal, setGoal] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number>(7);
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [studyMethod, setStudyMethod] = useState<'pomodoro' | 'active_recall' | 'feynman' | 'block_study'>('active_recall');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const activeSubjectName = subject === 'Custom' ? (customSubject || 'General') : subject;

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      setError('Please enter your study goal or exam name.');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPlan(null);
    setSaved(false);

    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubjectName,
          goal,
          daysRemaining,
          dailyHours,
          currentLevel,
          studyMethod
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const planData: StudyPlan = await res.json();
      setCurrentPlan(planData);

      // Save to storage
      storage.savePlan(planData);
      setSaved(true);
      onPlanSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (dayNumber: number) => {
    if (!currentPlan) return;
    const updatedTasks = currentPlan.dailyTasks.map((t) =>
      t.dayNumber === dayNumber ? { ...t, completed: !t.completed } : t
    );
    const updatedPlan = { ...currentPlan, dailyTasks: updatedTasks };
    setCurrentPlan(updatedPlan);
    storage.savePlan(updatedPlan);
  };

  const handleDownloadPlan = () => {
    if (!currentPlan) return;
    const text = `STUDY PLAN: ${currentPlan.goal} (${currentPlan.subject})\nTotal Days: ${currentPlan.totalDays} | Hours/Day: ${currentPlan.dailyHours}\n\nSTRATEGY OVERVIEW:\n${currentPlan.weeklyOverview}\n\nDAILY TASKS:\n${currentPlan.dailyTasks.map(t => `Day ${t.dayNumber}: ${t.title} [${t.estimatedHours}h]\n - Topics: ${t.topics.join(', ')}\n - Action: ${t.activity}\n`).join('\n')}\nEXAM STRATEGY:\n${currentPlan.examStrategy}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyPlan_${currentPlan.subject.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = currentPlan ? currentPlan.dailyTasks.filter((t) => t.completed).length : 0;
  const totalTasks = currentPlan ? currentPlan.dailyTasks.length : 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div id="study-planner-container" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>AI Study Architect • {activeSubjectName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Personalized Exam Study Roadmap</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Build day-by-day active recall schedules tailored to your deadline and available daily study time.
          </p>
        </div>
      </div>

      {/* Plan Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label htmlFor="plan-goal-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Exam / Course Goal:
            </label>
            <input
              id="plan-goal-input"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Pass Data Structures Midterm, Master Organic Chemistry Reactions, Ace Calculus Final"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-days-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Days Available ({daysRemaining} days):
              </label>
              <select
                id="plan-days-select"
                value={daysRemaining}
                onChange={(e) => setDaysRemaining(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value={3}>3 Days (Crash Course)</option>
                <option value={7}>7 Days (1 Week Sprint)</option>
                <option value={14}>14 Days (2 Weeks Solid)</option>
                <option value={30}>30 Days (1 Month Complete)</option>
              </select>
            </div>

            <div>
              <label htmlFor="plan-hours-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hours / Day ({dailyHours} hrs):
              </label>
              <select
                id="plan-hours-select"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value={1}>1 Hour / Day</option>
                <option value={2}>2 Hours / Day</option>
                <option value={4}>4 Hours / Day</option>
                <option value={6}>6 Hours / Day</option>
              </select>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plan-level-select" className="block text-xs font-semibold text-slate-300 mb-1.5">Current Knowledge Level:</label>
            <select
              id="plan-level-select"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
            >
              <option value="beginner">🌱 Beginner (Starting from scratch)</option>
              <option value="intermediate">🌿 Intermediate (Know basic lectures)</option>
              <option value="advanced">🌳 Advanced (Revision & practice questions)</option>
            </select>
          </div>

          <div>
            <label htmlFor="plan-method-select" className="block text-xs font-semibold text-slate-300 mb-1.5">Study Technique Preference:</label>
            <select
              id="plan-method-select"
              value={studyMethod}
              onChange={(e) => setStudyMethod(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 cursor-pointer"
            >
              <option value="active_recall">🧠 Active Recall & Spaced Repetition</option>
              <option value="pomodoro">⏱️ Pomodoro Technique (25m / 5m)</option>
              <option value="feynman">💡 Feynman Technique (Teach to learn)</option>
              <option value="block_study">📦 Deep Work Block Study</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-500 hidden sm:block">
            Generates realistic, active learning daily tasks with milestones.
          </div>
          <button
            type="button"
            id="plan-generate-btn"
            disabled={loading || !goal.trim()}
            onClick={handleGeneratePlan}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Designing Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Study Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
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
          <div className="h-40 bg-slate-800/40 rounded-xl" />
        </div>
      )}

      {/* Plan Output */}
      {currentPlan && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {currentPlan.subject} Roadmap
                </span>
                {saved && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{currentPlan.goal}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentPlan.totalDays} Days Plan • {currentPlan.dailyHours} Hours/Day
              </p>
            </div>

            <button
              type="button"
              id="download-plan-btn"
              onClick={handleDownloadPlan}
              className="px-3.5 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:text-white transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Plan .txt</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Plan Progress</span>
              <span className="text-indigo-400">{completedCount} / {totalTasks} Days Completed ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
              Strategy Overview
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {currentPlan.weeklyOverview}
            </p>
          </div>

          {/* Milestones */}
          {currentPlan.milestones && currentPlan.milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-4 h-4" />
                <span>Key Checkpoints & Milestones</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentPlan.milestones.map((m, i) => (
                  <div key={i} className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
                    <span className="text-indigo-400 font-bold mr-1">Day {m.day}:</span>
                    <span className="text-slate-300">{m.milestone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Schedule Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Daily Action Items (Check off as you complete)</span>
            </h4>

            <div className="space-y-3">
              {currentPlan.dailyTasks.map((task) => {
                const isDone = !!task.completed;
                return (
                  <div
                    key={task.dayNumber}
                    onClick={() => handleToggleTask(task.dayNumber)}
                    className={`border rounded-xl p-4 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-indigo-400">Day {task.dayNumber}</span>
                            <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 my-2">
                            {task.topics.map((tp, idx) => (
                              <span key={idx} className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px] px-2 py-0.5 rounded-md">
                                {tp}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-indigo-300">Action:</strong> {task.activity}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {task.estimatedHours} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exam Strategy */}
          {currentPlan.examStrategy && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🎯 Final 24-Hour Exam Strategy
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentPlan.examStrategy}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
