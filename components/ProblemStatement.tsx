import React, { useState } from 'react';
import type { Problem } from '../types';
import { LightBulbIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import CodeEditor from './CodeEditor';

interface ProblemStatementProps {
    problem: Problem;
    problems: Problem[];
    setCurrentProblemIndex: (index: number) => void;
    showHint: boolean;
    setShowHint: (show: boolean) => void;
    allowHints: boolean;
    isUpsolving: boolean;
}

const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem, problems, setCurrentProblemIndex, showHint, setShowHint, allowHints, isUpsolving }) => {
  
  const [showSolution, setShowSolution] = useState(false);
  const currentIndex = problems.findIndex(p => p.id === problem.id);
  const totalProblems = problems.length;
  
  const handleProblemChange = (newIndex: number) => {
      if (newIndex >= 0 && newIndex < totalProblems) {
          setCurrentProblemIndex(newIndex);
          setShowHint(false); // Hide hint when problem changes
          setShowSolution(false); // Hide solution when problem changes
      }
  };

  const hasInputFormat = problem.inputFormat && problem.inputFormat.trim() !== '';
  const hasOutputFormat = problem.outputFormat && problem.outputFormat.trim() !== '';
  const hasConstraints = problem.constraints && problem.constraints.length > 0 && problem.constraints.some(c => c.trim() !== '');


  return (
    <div className="p-6 h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-cyan-300 font-orbitron">{problem.title}</h2>
             <div className="flex items-center space-x-2">
                {totalProblems > 1 && (
                     <div className="flex items-center space-x-2">
                        <button onClick={() => handleProblemChange(currentIndex - 1)} disabled={currentIndex === 0} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeftIcon className="h-5 w-5 text-white" />
                        </button>
                        <span className="text-sm text-gray-300">Problem {currentIndex + 1} / {totalProblems}</span>
                        <button onClick={() => handleProblemChange(currentIndex + 1)} disabled={currentIndex === totalProblems - 1} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRightIcon className="h-5 w-5 text-white" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        <p className="text-gray-300 mb-6">{problem.description}</p>
        
        {allowHints && problem.hint && (
            <div className="mb-6">
                 <button onClick={() => setShowHint(!showHint)} className="flex items-center space-x-2 text-sm text-fuchsia-400 hover:text-fuchsia-300">
                    <LightBulbIcon className="h-5 w-5" />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                </button>
                {showHint && (
                    <div className="mt-2 bg-fuchsia-900/20 border border-fuchsia-500/30 p-3 text-fuchsia-300 text-sm">
                        {problem.hint}
                    </div>
                )}
            </div>
        )}
        
        {isUpsolving && problem.solution && (
            <div className="mb-6">
                <button onClick={() => setShowSolution(!showSolution)} className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold">
                    <span>{showSolution ? 'Hide Official Solution' : 'View Official Solution'}</span>
                </button>
                {showSolution && (
                    <div className="mt-2 h-48 overflow-hidden border border-cyan-700">
                         <CodeEditor 
                            code={problem.solution}
                            onCodeChange={() => {}}
                            problemId={`${problem.id}-solution`}
                            readOnly={true}
                         />
                    </div>
                )}
            </div>
        )}

        <div className="space-y-6">
            {hasInputFormat && (
                <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 font-orbitron">Input Format</h3>
                    <p className="text-gray-300 bg-slate-950 p-3 border border-slate-700 text-sm">{problem.inputFormat}</p>
                </div>
            )}
            {hasOutputFormat && (
                <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 font-orbitron">Output Format</h3>
                    <p className="text-gray-300 bg-slate-950 p-3 border border-slate-700 text-sm">{problem.outputFormat}</p>
                </div>
            )}
            {hasConstraints && (
                <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 font-orbitron">Constraints</h3>
                    <ul className="list-disc list-inside text-gray-300 bg-slate-950 p-3 border border-slate-700 text-sm">
                        {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
            )}
            {(problem.showSampleCases ?? true) && (
                 <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 font-orbitron">Sample Cases</h3>
                    {problem.visibleTestCases.map((tc, index) => (
                        <div key={tc.id} className="mb-4">
                            <p className="text-gray-300 font-semibold">Sample {index + 1}</p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <h4 className="text-sm text-gray-400 mb-1">Input:</h4>
                                    <pre className="bg-slate-950 p-3 border border-slate-700 text-white text-sm whitespace-pre-wrap">{tc.input}</pre>
                                </div>
                                <div>
                                    <h4 className="text-sm text-gray-400 mb-1">Expected Output:</h4>
                                    <pre className="bg-slate-950 p-3 border border-slate-700 text-white text-sm whitespace-pre-wrap">{tc.expected}</pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default ProblemStatement;