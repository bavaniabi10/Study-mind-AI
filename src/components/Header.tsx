import React from 'react';
import { GraduationCap, BookOpen, Sparkles, CheckCircle2, Bookmark, Flame } from 'lucide-react';
import { SubjectCategory } from '../types';

interface HeaderProps {
  currentSubject: SubjectCategory;
  onSubjectChange: (subject: SubjectCategory) => void;
  customSubjectInput: string;
  onCustomSubjectChange: (val: string) => void;
  savedNotesCount: number;
  quizzesCount: number;
  activePlansCount: number;
}

export const SUBJECT_OPTIONS: SubjectCategory[] = [
  'Computer Science & AI',
  'Mathematics & Statistics',
  'Physics & Engineering',
  'Chemistry & Biology',
  'Economics & Business',
  'Psychology & Humanities',
  'Custom'
];

export const Header: React.FC<HeaderProps> = ({
  currentSubject,
  onSubjectChange,
  customSubjectInput,
  onCustomSubjectChange,
  savedNotesCount,
  quizzesCount,
  activePlansCount
}) => {
  return (
    <header id="header" className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  StudyMind <span className="text-indigo-400">AI</span>
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  College Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Your AI-Powered Doubts, Notes, Quiz & Revision Mentor
              </p>
            </div>
          </div>

          {/* Subject Selector & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Subject Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
              <BookOpen className="w-4 h-4 text-indigo-400 ml-2" />
              <select
                id="header-subject-select"
                value={currentSubject}
                onChange={(e) => onSubjectChange(e.target.value as SubjectCategory)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none pr-2 py-1 cursor-pointer"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900 text-slate-200">
                    {sub}
                  </option>
                ))}
              </select>

              {currentSubject === 'Custom' && (
                <input
                  id="header-custom-subject-input"
                  type="text"
                  placeholder="e.g. Organic Chemistry"
                  value={customSubjectInput}
                  onChange={(e) => onCustomSubjectChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-36"
                />
              )}
            </div>

            {/* Quick Stats Badges */}
            <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-300 border-l border-slate-800 pl-3">
              <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>{savedNotesCount} Notes</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{quizzesCount} Quizzes</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
                <Flame className="w-3.5 h-3.5 text-indigo-400" />
                <span>{activePlansCount} Plans</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
