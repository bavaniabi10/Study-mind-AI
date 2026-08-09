import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DoubtSolver } from './components/DoubtSolver';
import { NotesGenerator } from './components/NotesGenerator';
import { QuizArena } from './components/QuizArena';
import { StudyPlanner } from './components/StudyPlanner';
import { RevisionHub } from './components/RevisionHub';
import { SavedLibrary } from './components/SavedLibrary';
import { NoteResponse, StudyPlan, SubjectCategory } from './types';
import { storage } from './lib/storage';
import { GraduationCap, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
const [activeTab, setActiveTab] = useState('doubt');
const [currentSubject, setCurrentSubject] = useState('Computer Science & AI');
const [customSubjectInput, setCustomSubjectInput] = useState('');

// Cross-Navigation Data Transfer States
const [notesTopic, setNotesTopic] = useState('');
const [notesContext, setNotesContext] = useState('');
const [quizTopic, setQuizTopic] = useState('');

// Library Counts
const [savedNotesCount, setSavedNotesCount] = useState(0);
const [quizzesCount, setQuizzesCount] = useState(0);
const [activePlansCount, setActivePlansCount] = useState(0);

const refreshCounts = () => {
setSavedNotesCount(storage.getNotes().length);
setQuizzesCount(storage.getQuizzes().length);
setActivePlansCount(storage.getPlans().length);
};

useEffect(() => {
refreshCounts();
}, []);

// Cross tab navigation helpers
const handleNavigateToNotes = (topic: string, textContext?: string) => {
setNotesTopic(topic);
if (textContext) setNotesContext(textContext);
setActiveTab('notes');
};

const handleNavigateToQuiz = (topic: string) => {
setQuizTopic(topic);
setActiveTab('quiz');
};

const handleNavigateToDoubt = (question: string) => {
setActiveTab('doubt');
};

const handleSelectNoteFromLibrary = (note: NoteResponse) => {
setNotesTopic(note.title);
setNotesContext(note.executiveSummary);
setActiveTab('notes');
};

const handleSelectPlanFromLibrary = (plan: StudyPlan) => {
setActiveTab('planner');
};

return (

  {/* App Header */}
  <Header
    currentSubject={currentSubject}
    onSubjectChange={setCurrentSubject}
    customSubjectInput={customSubjectInput}
    onCustomSubjectChange={setCustomSubjectInput}
    savedNotesCount={savedNotesCount}
    quizzesCount={quizzesCount}
    activePlansCount={activePlansCount}
  />

  {/* Tab Navigation */}
  <Navigation
    activeTab={activeTab}
    onTabChange={setActiveTab}
    savedNotesCount={savedNotesCount}
  />

  {/* Main Content View */}
  <main id="main-content" className="flex-1 py-4">
    {activeTab === 'doubt' && (
      <DoubtSolver
        subject={currentSubject}
        customSubject={customSubjectInput}
        onNavigateToNotes={handleNavigateToNotes}
        onNavigateToQuiz={handleNavigateToQuiz}
      />
    )}

    {activeTab === 'notes' && (
      <NotesGenerator
        subject={currentSubject}
        customSubject={customSubjectInput}
        initialTopic={notesTopic}
        initialContext={notesContext}
        onNoteSaved={refreshCounts}
        onNavigateToQuiz={handleNavigateToQuiz}
      />
    )}

    {activeTab === 'quiz' && (
      <QuizArena
        subject={currentSubject}
        customSubject={customSubjectInput}
        initialTopic={quizTopic}
        onQuizCompleted={refreshCounts}
        onNavigateToNotes={handleNavigateToNotes}
        onNavigateToDoubt={handleNavigateToDoubt}
      />
    )}

    {activeTab === 'planner' && (
      <StudyPlanner
        subject={currentSubject}
        customSubject={customSubjectInput}
        onPlanSaved={refreshCounts}
      />
    )}

    {activeTab === 'revision' && (
      <RevisionHub
        subject={currentSubject}
        customSubject={customSubjectInput}
      />
    )}

    {activeTab === 'library' && (
      <SavedLibrary
        onSelectNote={handleSelectNoteFromLibrary}
        onSelectPlan={handleSelectPlanFromLibrary}
      />
    )}
  </main>

  {/* Simple Footer */}
  <footer id="app-footer" className="bg-slate-900/80 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-400 mt-auto">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center space-x-1.5 font-medium">
        <GraduationCap className="w-4 h-4 text-indigo-400" />
        <span>StudyMind AI Assistant</span>
        <span className="text-slate-600">•</span>
        <span>Empowering College Students</span>
      </div>

      <div className="flex items-center space-x-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Gemini 3.6 Flash Server Engine
        </span>
        <span>Local Storage Sync</span>
      </div>
    </div>
  </footer>

</div>


);
}