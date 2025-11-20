import React from 'react';
import type { TestResult } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface ResultsProps {
  results: TestResult[];
}

const ResultCard: React.FC<{ result: TestResult; index: number }> = ({ result, index }) => {
    const isVisible = result.type === 'visible';
    const bgColor = result.passed ? 'bg-green-500/10' : 'bg-red-500/10';
    const borderColor = result.passed ? 'border-green-500/40' : 'border-red-500/40';

    return (
        <div className={`p-4 border ${bgColor} ${borderColor}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">
                    Test Case #{index + 1} {isVisible ? '' : '(Hidden)'}
                </h4>
                {result.passed ? (
                    <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Passed</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 text-red-400">
                        <XCircleIcon className="h-5 w-5" />
                        <span>Failed</span>
                    </div>
                )}
            </div>
            {isVisible && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 text-xs">
                    <div>
                        <h5 className="text-gray-400 mb-1">Input:</h5>
                        <pre className="bg-slate-800 p-2 whitespace-pre-wrap">{result.input}</pre>
                    </div>
                    <div>
                        <h5 className="text-gray-400 mb-1">Expected:</h5>
                        <pre className="bg-slate-800 p-2 whitespace-pre-wrap">{result.expected}</pre>
                    </div>
                    <div>
                        <h5 className="text-gray-400 mb-1">Your Output:</h5>
                        <pre className={`p-2 whitespace-pre-wrap ${result.passed ? 'bg-slate-800' : 'bg-red-900/30 text-red-300'}`}>{result.actual}</pre>
                    </div>
                 </div>
            )}
            {!isVisible && !result.passed && (
                 <p className="text-xs text-red-300 mt-2">Input and output for hidden cases are not shown.</p>
            )}
        </div>
    )
}

const Results: React.FC<ResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return <div className="flex-shrink-0 h-48 p-4 text-center text-gray-500">Run code or submit to see results.</div>;
  }
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className="flex-shrink-0 max-h-64 p-4 overflow-y-auto bg-slate-950/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Results</h3>
        <div className={`px-3 py-1 text-sm font-bold ${allPassed ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
            {passedCount} / {totalCount} Passed
        </div>
      </div>
      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard key={`${result.caseId}-${result.type}-${index}`} result={result} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Results;