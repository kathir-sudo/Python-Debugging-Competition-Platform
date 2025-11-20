import React, { useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { CodeBracketIcon, ShieldCheckIcon } from './Icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPotentialAdmin, setIsPotentialAdmin] = useState(false);
  
  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setTeamName(newName);
      if (newName.toLowerCase().trim() === 'admin') {
          setIsPotentialAdmin(true);
      } else {
          setIsPotentialAdmin(false);
      }
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
        if (isPotentialAdmin) {
            const admin = await api.adminLogin(password);
            if (admin) {
                onLogin(admin);
            } else {
                setError('Invalid admin password.');
            }
        } else {
            if (!teamName.trim()) {
                setError('Team name is required.');
                return;
            }
            const team = await api.login(teamName.trim());
            onLogin(team);
        }
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const commonInputClass = "appearance-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm focus:bg-slate-800";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
        <div className="text-center">
            {isPotentialAdmin ? <ShieldCheckIcon className="mx-auto h-12 w-12 text-cyan-400" /> : <CodeBracketIcon className="mx-auto h-12 w-12 text-cyan-400" />}
            <h2 className="mt-6 text-3xl font-extrabold text-cyan-300 font-orbitron">
                {isPotentialAdmin ? 'Admin Access' : 'Join the Debugging Challenge'}
            </h2>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="teamName" className="sr-only">Team Name</label>
                <input id="teamName" value={teamName} onChange={handleTeamNameChange} required className={commonInputClass} placeholder="Enter Your Team Name"/>
            </div>
            {isPotentialAdmin && (
                <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={commonInputClass} placeholder="Enter Admin Password"/>
                </div>
            )}
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div>
          <button onClick={handleLogin} disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-cyan-500 text-sm font-medium text-cyan-100 bg-cyan-600/80 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-cyan-800/50 disabled:cursor-not-allowed transition-all">
            {isLoading ? 'Processing...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;