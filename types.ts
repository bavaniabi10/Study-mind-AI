export type ExplanationStyle = 'feynman' | 'standard' | 'analogies' | 'step_by_step';

export type SubjectCategory = 
  | 'Computer Science & AI'
  | 'Mathematics & Statistics'
  | 'Physics & Engineering'
  | 'Chemistry & Biology'
  | 'Economics & Business'
  | 'Psychology & Humanities'
  | 'Custom';

export interface DoubtRequest {
  subject: string;
  question: string;
  style: ExplanationStyle;
  contextText?: string;
}

export interface DoubtResponse {
  answer: string;
  summary: string;
  analogies?: string;
  keyTakeaways: string[];
  commonMisconceptions: string[];
  suggestedFollowUps: string[];
}

export interface NotesRequest {
  subject: string;
  topic: string;
  depth: 'summary' | 'comprehensive' | 'exam_prep';
  lectureText?: string;
}

export interface NoteFlashcard {
  front: string;
  back: string;
}

export interface NoteResponse {
  title: string;
  subject: string;
  markdownContent: string;
  executiveSummary: string;
  keyTerms: { term: string; definition: string }[];
  examPitfalls: string[];
  flashcards: NoteFlashcard[];
  timestamp: number;
  id: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  wrongOptionsExplanations?: string[];
  hint?: string;
  conceptTag: string;
}

export interface QuizRequest {
  subject: string;
  topic: string;
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  focus: 'conceptual' | 'numerical' | 'application';
}

export interface QuizResult {
  id: string;
  topic: string;
  subject: string;
  score: number;
  totalQuestions: number;
  userAnswers: number[];
  timestamp: number;
  questions: QuizQuestion[];
}

export interface DailyStudyTask {
  dayNumber: number;
  title: string;
  topics: string[];
  activity: string; // e.g. "Read ch 3, solve 5 problems, active recall 15 mins"
  estimatedHours: number;
  completed?: boolean;
}

export interface StudyPlanRequest {
  subject: string;
  goal: string;
  daysRemaining: number;
  dailyHours: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  studyMethod: 'pomodoro' | 'active_recall' | 'feynman' | 'block_study';
}

export interface StudyPlan {
  id: string;
  subject: string;
  goal: string;
  totalDays: number;
  dailyHours: number;
  weeklyOverview: string;
  milestones: { day: number; milestone: string }[];
  dailyTasks: DailyStudyTask[];
  examStrategy: string;
  timestamp: number;
}

export interface Flashcard {
  id: string;
  subject: string;
  topic: string;
  front: string;
  back: string;
  status?: 'new' | 'learning' | 'mastered';
  easeRating?: 'hard' | 'good' | 'easy';
}
