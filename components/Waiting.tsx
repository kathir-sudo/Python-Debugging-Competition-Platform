import React from 'react';
import { ClockIcon } from './Icons';

const Waiting: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
        <ClockIcon className="mx-auto h-16 w-16 text-cyan-400 animate-pulse" />
        <h2 className="text-3xl font-extrabold text-cyan-300 font-orbitron">
          Please Wait
        </h2>
        <p className="text-lg text-gray-300">
          The competition has not started yet.
        </p>
        <p className="text-sm text-gray-400">
          The page will update automatically when the administrator starts the competition.
        </p>
      </div>
    </div>
  );
};

export default Waiting;