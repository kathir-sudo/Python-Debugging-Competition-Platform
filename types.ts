export interface TestCase {
  id: number;
  input: string;
  expected: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  initialCode?: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  hint?: string;
  solution?: string;
  showSampleCases?: boolean;
  visibleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  score: number;
  tabSwitchViolations: number;
  violations: number;
  isDisqualified: boolean;
  hasFinished: boolean;
  lastSubmissionTimestamp: number | null;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  problemId: string;
  problemTitle: string;
  code: string;
  results: TestResult[];
  timestamp: number;
  score: number;
}

export interface TestResult {
  caseId: number;
  type: 'visible' | 'hidden';
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export type User = Team | { id: 'admin'; name: 'Admin' };

export type View = 'login' | 'challenge' | 'leaderboard' | 'history' | 'admin' | 'thankyou' | 'waiting';

export interface CompetitionState {
  isActive: boolean;
  timer: number; // in minutes
  allowHints: boolean;
  useAntiCheat: boolean;
  autoDisqualifyOnTabSwitch: boolean;
  tabSwitchViolationLimit: number;
  violationLimit: number;
  isPaused?: boolean;
  announcement?: {
    message: string;
    timestamp: number;
  };
}