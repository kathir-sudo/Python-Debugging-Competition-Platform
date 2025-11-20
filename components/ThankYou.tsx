import React from 'react';
import { TrophyIcon, ArrowPathIcon } from './Icons';

interface ThankYouProps {
  message: string;
  allowUpsolve?: boolean;
  onUpsolve?: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ message, allowUpsolve = false, onUpsolve }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
        <TrophyIcon className="mx-auto h-16 w-16 text-cyan-400" />
        <h2 className="text-3xl font-extrabold text-cyan-300 font-orbitron">
          Competition Over
        </h2>
        <p className="text-lg text-gray-300">
          {message} Thank you for participating!
        </p>

        <p className="text-sm text-gray-400 pt-2">
          You may now log out or close this window.
        </p>
      </div>
    </div>
  );
};

export default ThankYou;