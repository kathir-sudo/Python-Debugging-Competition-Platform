import React, { useState, useEffect, useCallback } from 'react';
import type { Problem, Team, TestResult, TestCase, CompetitionState, User, View } from '../types';
import { api } from '../services/api';
import { usePyodide } from '../hooks/usePyodide';
import { runPythonCode } from '../services/pyodideService';
import ProblemStatement from './ProblemStatement';
import CodeEditor from './CodeEditor';
import Results from './Results';
import { ArrowUturnLeftIcon } from './Icons';

interface CodingChallengeProps {
  team: Team;
  competitionState: CompetitionState;
  setCurrentUser: (user: User) => void;
  setCurrentView: (view: View) => void;
}

const CodingChallenge: React.FC<CodingChallengeProps> = ({ team, competitionState, setCurrentUser, setCurrentView }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState<string>('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [violationModalMessage, setViolationModalMessage] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  
  const { pyodide, isLoading: isPyodideLoading } = usePyodide();
  const currentProblem = problems[currentProblemIndex];
  const isUpsolving = !competitionState.isActive;

  useEffect(() => {
    api.getProblems().then(setProblems);
  }, []);

  // Load code from draft or initialCode when problem changes
  useEffect(() => {
    const problem = problems[currentProblemIndex];
    if (problem) {
        const draftKey = `pycompete-draft-${problem.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        setCode(savedDraft || problem.initialCode || '');
        setResults([]); // Clear results when problem changes
        setShowHint(false); // Hide hint when problem changes
    }
  }, [currentProblemIndex, problems]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  const runTestCases = useCallback(async (cases: TestCase[], type: 'visible' | 'hidden'): Promise<TestResult[]> => {
    if (!pyodide) return [];
    
    const caseResults: TestResult[] = [];
    for (const testCase of cases) {
      const { output, error } = await runPythonCode(pyodide, code, testCase.input);
      const actualOutput = error ? `Runtime Error` : output;
      const passed = !error && actualOutput.trim() === testCase.expected.trim();
      
      caseResults.push({
        caseId: testCase.id,
        type,
        input: testCase.input,
        expected: testCase.expected,
        actual: actualOutput,
        passed: passed,
      });
    }
    return caseResults;
  }, [pyodide, code]);

  const handleSubmitCode = useCallback(async (isDisqualificationSubmit = false) => {
    if (!currentProblem || isRunning || isUpsolving) return;
    setIsRunning(true);
    setResults([]);
    setSubmissionMessage('');
    
    const visibleResults = await runTestCases(currentProblem.visibleTestCases, 'visible');
    const hiddenResults = await runTestCases(currentProblem.hiddenTestCases, 'hidden');
    
    const allResults = [...visibleResults, ...hiddenResults];
    setResults(allResults);
    await api.submitSolution(team, currentProblem, code, allResults);
    setIsRunning(false);

    if (isDisqualificationSubmit) {
        await api.disqualifyTeam(team.id);
        setCurrentView('thankyou');
    } else {
        setSubmissionMessage(`Submission successful! You passed ${allResults.filter(r => r.passed).length} out of ${allResults.length} test cases.`);
        setTimeout(() => setSubmissionMessage(''), 5000);
    }
  }, [currentProblem, isRunning, team, code, runTestCases, setCurrentView, isUpsolving]);

  const handleRunCode = async () => {
    if (!currentProblem || isRunning) return;
    setIsRunning(true);
    setResults([]);
    const visibleResults = await runTestCases(currentProblem.visibleTestCases, 'visible');
    setResults(visibleResults);
    setIsRunning(false);
  };
  
  const handleResetCode = () => {
    if (!currentProblem) return;
    setIsConfirmingReset(true);
  };

  const confirmResetCode = () => {
    if (!currentProblem) return;
    const draftKey = `pycompete-draft-${currentProblem.id}`;
    localStorage.removeItem(draftKey);
    setCode(currentProblem.initialCode || '');
    setIsConfirmingReset(false);
  };
  
  // Anti-cheat logic
  useEffect(() => {
    if (!competitionState?.useAntiCheat || isUpsolving) return;

    // This handler is for non-submitting violations. It just shows a popup.
    const showSimpleViolationWarning = (e: Event) => {
        e.preventDefault();
        const type = e.type.charAt(0).toUpperCase() + e.type.slice(1);
        console.warn(`Anti-cheat violation: ${type} by ${team.name}`);
        setViolationModalMessage(`A '${type}' action was detected. This is a violation of the rules.`);
    };

    const handleTabSwitchViolation = async () => {
      console.warn(`Anti-cheat violation: Tab Switch by ${team.name}`);
      try {
        const updatedTeam = await api.incrementTabSwitchViolations(team.id);
        if (updatedTeam) {
          setCurrentUser(updatedTeam);
          if (competitionState.autoDisqualifyOnTabSwitch && updatedTeam.tabSwitchViolations >= competitionState.tabSwitchViolationLimit) {
            setViolationModalMessage(`Tab switch limit reached (${updatedTeam.tabSwitchViolations}/${competitionState.tabSwitchViolationLimit}). Your final code is being submitted automatically, and your team will be disqualified.`);
            setTimeout(() => handleSubmitCode(true), 2500);
          } else {
            setViolationModalMessage(`Switching tabs is a violation. You have switched tabs ${updatedTeam.tabSwitchViolations} time(s). Reaching the limit of ${competitionState.tabSwitchViolationLimit} will result in automatic submission and disqualification.`);
          }
        }
      } catch (err) {
        console.error("Failed to report tab switch violation", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitchViolation();
      }
    };

    document.addEventListener('contextmenu', showSimpleViolationWarning);
    document.addEventListener('copy', showSimpleViolationWarning);
    document.addEventListener('paste', showSimpleViolationWarning);
    document.addEventListener('cut', showSimpleViolationWarning);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', showSimpleViolationWarning);
      document.removeEventListener('copy', showSimpleViolationWarning);
      document.removeEventListener('paste', showSimpleViolationWarning);
      document.removeEventListener('cut', showSimpleViolationWarning);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [team.id, competitionState, handleSubmitCode, setCurrentUser, isUpsolving]);
  
  const loadingMessage = isPyodideLoading ? 'Initializing Python Environment...' : isRunning ? 'Running Code...' : '';

  if (!currentProblem) {
    return <div className="text-center text-gray-400">Loading problems...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem-4rem)]">
        <div className="bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm h-full overflow-y-auto">
            <ProblemStatement 
              problem={currentProblem} 
              problems={problems} 
              setCurrentProblemIndex={setCurrentProblemIndex}
              showHint={showHint}
              setShowHint={setShowHint}
              allowHints={competitionState.allowHints}
              isUpsolving={isUpsolving}
            />
        </div>
        
        <div className="flex flex-col bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm h-full">
          <CodeEditor 
              problemId={currentProblem.id}
              code={code} 
              onCodeChange={handleCodeChange} 
          />
          
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm h-5">
                {submissionMessage ? <span className="text-green-400 font-semibold">{submissionMessage}</span> :
                <span className="text-cyan-400">{loadingMessage}</span>
                }
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleResetCode}
                disabled={isPyodideLoading || isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold border border-slate-600 hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:cursor-not-allowed"
                title="Reset to original buggy code"
              >
                <ArrowUturnLeftIcon className="w-5 h-5"/>
                Reset
              </button>
              <button
                onClick={handleRunCode}
                disabled={isPyodideLoading || isRunning}
                className="px-6 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                Run Tests
              </button>
              <button
                onClick={() => handleSubmitCode(false)}
                disabled={isPyodideLoading || isRunning || isUpsolving}
                className="px-6 py-2 bg-cyan-600/80 text-white font-semibold border border-cyan-500 hover:bg-cyan-600 transition-colors disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
                title={isUpsolving ? "Submissions are disabled after the competition." : ""}
              >
                {isUpsolving ? 'Contest Over' : 'Submit'}
              </button>
            </div>
          </div>
          
          <Results results={results} />
        </div>
      </div>

      {violationModalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-slate-900 p-8 max-w-md w-full border border-yellow-500 text-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-2xl font-bold text-yellow-400 mb-4 font-orbitron">Violation Detected</h3>
            <p className="text-gray-300 mb-6">{violationModalMessage}</p>
            <button
              onClick={() => setViolationModalMessage(null)}
              className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold border border-yellow-500 hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isConfirmingReset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-slate-900 shadow-2xl p-8 max-w-md w-full border border-yellow-500 text-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="mt-4 text-2xl font-bold text-yellow-400 mb-4 font-orbitron">Reset Code?</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to reset your code to the original version? Your current changes will be lost.</p>
            <div className="flex justify-center gap-4">
               <button
                onClick={() => setIsConfirmingReset(false)}
                className="px-6 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetCode}
                className="px-6 py-2 bg-yellow-600 text-white font-semibold border border-yellow-500 hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodingChallenge;