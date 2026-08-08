import React from 'react';
import { HelpCircle, FileText, HelpCircle as QuizIcon, Calendar, Layers, Library } from 'lucide-react';

export type TabType = 'doubt' | 'notes' | 'quiz' | 'planner' | 'revision' | 'library';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedNotesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, savedNotesCount }) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'doubt', label: 'Doubt Solver', icon: HelpCircle },
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'quiz', label: 'MCQ & Quizzes', icon: QuizIcon },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'revision', label: 'Flashcards', icon: Layers },
    { id: 'library', label: 'Saved Library', icon: Library, badge: savedNotesCount },
  ];

  return (
    <nav id="navigation-tabs" className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-[65px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
