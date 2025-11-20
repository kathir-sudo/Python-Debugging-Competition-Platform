import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

const PauseOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" 
      aria-modal="true" 
      role="dialog"
    >
      <div className="w-full max-w-xl p-8 space-y-6 bg-slate-900/90 border border-yellow-500/80 shadow-2xl shadow-yellow-500/10 text-center">
        <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-400" />
        <h2 className="text-4xl font-extrabold text-yellow-300 font-orbitron">
          Competition Paused
        </h2>
        <p className="text-lg text-gray-200">
          The administrator has paused the competition. Your timer is stopped.
          <br />
          Please wait for the competition to resume.
        </p>
        
        <div className="pt-4 text-left bg-slate-800/50 border border-slate-700 p-4 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-300 mb-3 text-center">Rules Reminder</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                <li>Do not switch tabs or leave the browser window.</li>
                <li>Do not use external tools, websites, or AI assistants.</li>
                <li>Copying, pasting, or right-clicking is disabled and monitored.</li>
                <li>Violations may lead to point deductions or disqualification.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default PauseOverlay;
