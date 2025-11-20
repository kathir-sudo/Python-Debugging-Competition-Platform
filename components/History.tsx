import React, { useState, useEffect } from 'react';
import type { Team, Submission } from '../types';
import { api } from '../services/api';
import { ClockIcon } from './Icons';
import CodeEditor from './CodeEditor';
import Results from './Results';

interface HistoryProps {
  team: Team;
}

const History: React.FC<HistoryProps> = ({ team }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    api.getSubmissionsByTeam(team.id).then(setSubmissions);
  }, [team.id]);

  if (submissions.length === 0) {
    return (
      <div className="text-center">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-500" />
        <h2 className="mt-4 text-2xl font-bold text-cyan-300 font-orbitron">No Submission History</h2>
        <p className="mt-2 text-sm text-gray-400">You have not made any submissions yet. Head to the challenge page to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm p-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 font-orbitron">Your Submissions</h3>
        <div className="space-y-3">
          {submissions.map(sub => (
            <div
              key={sub.id}
              onClick={() => setSelectedSubmission(sub)}
              className={`p-3 cursor-pointer transition-colors ${selectedSubmission?.id === sub.id ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <p className="font-semibold">{sub.problemTitle}</p>
              <div className="flex justify-between items-center text-xs text-gray-300">
                <span>{new Date(sub.timestamp).toLocaleString()}</span>
                <span className="font-bold">{sub.score} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm p-4">
        {selectedSubmission ? (
          <div>
            <h3 className="text-2xl font-bold mb-4 font-orbitron">{selectedSubmission.problemTitle}</h3>
            <div className="mb-4" style={{ height: '300px' }}>
              <CodeEditor
                code={selectedSubmission.code}
                onCodeChange={() => {}}
                problemId={selectedSubmission.problemId}
                readOnly={true}
              />
            </div>
            <Results results={selectedSubmission.results} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a submission from the left to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;