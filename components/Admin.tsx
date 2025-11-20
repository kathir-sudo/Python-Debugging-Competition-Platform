import React, { useState, useEffect } from 'react';
import type { Problem, Team, Submission, CompetitionState, TestCase } from '../types';
import { api } from '../services/api';
import CodeEditor from './CodeEditor';
import Leaderboard from './Leaderboard';
// FIX: Import Results component to resolve 'Cannot find name' error.
import Results from './Results';
import { SpeakerWaveIcon, PauseIcon, PlayIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import TeamStats from './TeamStats';

type AdminTab = 'controls' | 'problems' | 'teams' | 'submissions' | 'leaderboard';

const Admin: React.FC<{ setCompetitionState: (state: CompetitionState) => void }> = ({ setCompetitionState }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('controls');
    const [currentUser, setCurrentUser] = useState<Team | null>(null);

    useEffect(() => {
        const user = api.getCurrentUser();
        if(user && user.id !== 'admin'){
            setCurrentUser(user as Team)
        }
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'controls': return <AdminControls setGlobalState={setCompetitionState} />;
            case 'problems': return <AdminProblems />;
            case 'teams': return <AdminTeams />;
            case 'submissions': return <AdminSubmissions />;
            case 'leaderboard': return <Leaderboard team={currentUser as Team} />;
            default: return null;
        }
    };

    const TabButton: React.FC<{tab: AdminTab; label: string}> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-slate-800 border-x border-t border-slate-600 text-cyan-300' : 'text-gray-300 hover:bg-slate-700/50'}`}>
            {label}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-cyan-300 font-orbitron">Admin Dashboard</h2>
            <div className="flex border-b border-slate-600">
                <TabButton tab="controls" label="Controls" />
                <TabButton tab="problems" label="Problems" />
                <TabButton tab="teams" label="Teams" />
                <TabButton tab="submissions" label="Submissions" />
                <TabButton tab="leaderboard" label="Leaderboard" />
            </div>
            <div className="bg-slate-800 p-6 border-x border-b border-slate-600">
                {renderTabContent()}
            </div>
        </div>
    );
};

const LiveSubmissionFeed: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const latestSubmissions = await api.getSubmissions();
                setSubmissions(latestSubmissions);
            } catch (error) {
                console.error("Failed to fetch submissions for live feed:", error);
            }
        };

        fetchSubmissions();
        const intervalId = setInterval(fetchSubmissions, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, []);

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 10) return "just now";
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="bg-slate-900 p-4 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-white font-orbitron">Live Submission Feed</h3>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {submissions.length > 0 ? submissions.map(s => (
                    <div key={s.id} className="bg-slate-800 p-3 shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-cyan-400">{s.teamName}</p>
                                <p className="text-sm text-gray-300">submitted to "{s.problemTitle}"</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 ${s.score > 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                                {s.score}/{s.results.length}
                            </span>
                        </div>
                        <p className="text-right text-xs text-gray-500 mt-1">{formatTimeAgo(s.timestamp)}</p>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">No submissions yet.</p>}
            </div>
        </div>
    );
};


interface BroadcastAnnouncementProps {
    state: CompetitionState | null;
    onStateUpdate: (newState: CompetitionState) => void;
}

const BroadcastAnnouncement: React.FC<BroadcastAnnouncementProps> = ({ state, onStateUpdate }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleBroadcast = async () => {
        if (!message.trim() || isSending) return;
        setIsSending(true);
        setFeedback('');
        try {
            const updatedState = await api.broadcastAnnouncement(message.trim());
            onStateUpdate(updatedState);
            setFeedback('Announcement sent successfully!');
            setMessage('');
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            setFeedback('Failed to send announcement.');
             setTimeout(() => setFeedback(''), 3000);
        } finally {
            setIsSending(false);
        }
    };
    
    const handleClear = async () => {
        if (isSending) return;
        setIsSending(true);
        setFeedback('');
        try {
            const updatedState = await api.broadcastAnnouncement('');
            onStateUpdate(updatedState);
            setFeedback('Announcement cleared.');
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            setFeedback('Failed to clear announcement.');
            setTimeout(() => setFeedback(''), 3000);
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="bg-slate-900 p-4 border border-slate-700">
            <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-2 font-orbitron"><SpeakerWaveIcon className="w-6 h-6"/> Broadcast</h3>
            {state?.announcement?.message ? (
                <div className="mb-4 bg-slate-800 p-3">
                    <p className="text-sm text-gray-400 font-semibold">Current Announcement:</p>
                    <p className="text-cyan-300">{state.announcement.message}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400 mb-4">Send a message that will appear as a banner for all contestants.</p>
            )}
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="E.g., 15 minutes remaining in the competition!"
                className="w-full bg-slate-800 text-white p-2 h-20 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={isSending}
            />
            <div className="flex justify-between items-center mt-2">
                <p className={`text-sm h-4 ${feedback.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{feedback}</p>
                <div className="flex items-center gap-2">
                    {state?.announcement?.message && (
                        <button onClick={handleClear} disabled={isSending} className="px-6 py-2 bg-slate-600 font-semibold border border-slate-500 hover:bg-slate-500 disabled:opacity-50">
                            {isSending ? '...' : 'Clear'}
                        </button>
                    )}
                    <button
                        onClick={handleBroadcast}
                        disabled={isSending || !message.trim()}
                        className="px-6 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700 disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Sending...' : 'Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminControls: React.FC<{ setGlobalState: (state: CompetitionState) => void }> = ({ setGlobalState }) => {
    const [state, setState] = useState<CompetitionState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        api.getCompetitionState().then(setState);
    }, []);
    
    const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleStateUpdate = (newState: CompetitionState) => {
        setState(newState);
        setGlobalState(newState);
    };

    const handleSave = async (newState: CompetitionState) => {
        setIsSaving(true);
        try {
            const updatedState = await api.updateCompetitionState(newState);
            handleStateUpdate(updatedState);
            showFeedback('Settings saved successfully!');
        } catch (error) {
            showFeedback('Failed to save settings.', 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleCompetition = () => {
        if (!state) return;
        const newState = { ...state, isActive: !state.isActive };
        handleSave(newState);
    }
    
    const handleTogglePause = async () => {
      if (!state) return;
      setIsSaving(true);
      try {
        const updatedState = await api.toggleCompetitionPause();
        handleStateUpdate(updatedState);
      } catch (error) {
        showFeedback('Failed to toggle pause state.', 'error');
      } finally {
        setIsSaving(false);
      }
    }
    
    if (!state) return <div>Loading controls...</div>;

    return (
        <div className="space-y-6 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-slate-900 p-4 border border-slate-700 space-y-4">
                         <div>
                            <h3 className="text-xl font-semibold font-orbitron">Competition Controls</h3>
                            <p className="text-sm text-gray-400">Manage the global state of the competition.</p>
                         </div>
                         <div className="flex gap-4">
                            <button 
                                onClick={handleToggleCompetition} 
                                disabled={isSaving}
                                className={`w-full px-6 py-2 font-bold border transition-colors disabled:opacity-50
                                    ${state.isActive ? 'bg-red-600/80 border-red-500 hover:bg-red-600' : 'bg-green-600/80 border-green-500 hover:bg-green-600'}`}
                            >
                                {isSaving ? '...' : state.isActive ? 'Stop Competition' : 'Start Competition'}
                            </button>
                             <button 
                                onClick={handleTogglePause} 
                                disabled={isSaving || !state.isActive}
                                className="w-full flex items-center justify-center gap-2 px-6 py-2 font-bold border transition-colors bg-yellow-600/80 border-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 disabled:border-slate-500 disabled:cursor-not-allowed"
                             >
                                {isSaving ? '...' : state.isPaused ? <><PlayIcon className="w-5 h-5"/> Resume</> : <><PauseIcon className="w-5 h-5"/> Pause</>}
                             </button>
                         </div>
                    </div>
                     <BroadcastAnnouncement state={state} onStateUpdate={handleStateUpdate} />
                </div>
                <LiveSubmissionFeed />
            </div>

            <div className="pt-6 border-t border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold font-orbitron">Detailed Settings</h3>
                    {feedback && (
                        <div className={`text-sm px-3 py-1 ${feedback.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {feedback.message}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Competition Duration (minutes)</label>
                        <input type="number" value={state.timer} onChange={e => setState({...state, timer: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                    <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Violation Limit</label>
                        <input type="number" value={state.violationLimit} onChange={e => setState({...state, violationLimit: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold">Allow Hints</label>
                        <input type="checkbox" checked={state.allowHints} onChange={e => setState({...state, allowHints: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold">Enable Anti-Cheat</label>
                        <input type="checkbox" checked={state.useAntiCheat} onChange={e => setState({...state, useAntiCheat: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold" title="Auto-submit and disqualify team if they switch tabs more than the limit.">Auto DQ on Tab Switch</label>
                        <input type="checkbox" checked={state.autoDisqualifyOnTabSwitch} onChange={e => setState({...state, autoDisqualifyOnTabSwitch: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Tab Switch Limit</label>
                        <input type="number" value={state.tabSwitchViolationLimit} onChange={e => setState({...state, tabSwitchViolationLimit: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                </div>
                <button onClick={() => handleSave(state)} disabled={isSaving} className="w-full mt-6 py-2 px-4 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700 disabled:bg-cyan-800/50">
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
}

const emptyProblem: Omit<Problem, 'id'> = {
  title: '',
  description: '',
  initialCode: '',
  inputFormat: '',
  outputFormat: '',
  constraints: [''],
  hint: '',
  solution: '',
  showSampleCases: true,
  visibleTestCases: [{ id: 1, input: '', expected: '' }],
  hiddenTestCases: [],
};

const AdminProblems: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [editingProblem, setEditingProblem] = useState<Partial<Problem> | null>(null);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 4000);
    };

    const fetchProblems = () => api.getProblems().then(setProblems);

    useEffect(() => {
        fetchProblems();
    }, []);

    const handleDelete = async (problemId: string) => {
        if (window.confirm("Are you sure you want to delete this problem?")) {
            await api.deleteProblem(problemId);
            fetchProblems();
        }
    };

    const handleSave = async (problemToSave: Partial<Problem>) => {
        try {
            if (problemToSave.id) {
                await api.updateProblem(problemToSave as Problem);
            } else {
                await api.addProblem(problemToSave as Omit<Problem, 'id'>);
            }
            setEditingProblem(null);
            fetchProblems();
        } catch (error) {
            console.error("Failed to save problem", error);
            showFeedback(`Error: ${(error as Error).message}`, 'error');
        }
    };

    if (editingProblem) {
        return <ProblemEditor problem={editingProblem} onSave={handleSave} onCancel={() => setEditingProblem(null)} />;
    }

    return (
        <div className="space-y-4 text-white">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold font-orbitron">Manage Problems</h3>
                <button onClick={() => setEditingProblem(emptyProblem)} className="px-4 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700">
                    Add New Problem
                </button>
            </div>
            {feedback && (
                <div className={`text-sm px-3 py-2 ${feedback.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="space-y-2">
                {problems.map(p => (
                    <div key={p.id} className="bg-slate-700 p-3 flex justify-between items-center">
                        <span>{p.title}</span>
                        <div>
                            <button onClick={() => setEditingProblem(p)} className="text-sm text-cyan-400 hover:underline mr-4">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const ProblemEditor: React.FC<{ problem: Partial<Problem>; onSave: (problem: Partial<Problem>) => void; onCancel: () => void; }> = ({ problem, onSave, onCancel }) => {
    const [editedProblem, setEditedProblem] = useState(problem);

    const handleChange = (field: keyof Problem, value: any) => {
        setEditedProblem(prev => ({ ...prev, [field]: value }));
    };

    const handleTestCaseChange = (type: 'visibleTestCases' | 'hiddenTestCases', index: number, field: keyof TestCase, value: any) => {
        const cases = [...(editedProblem[type] || [])];
        cases[index] = { ...cases[index], [field]: value, id: cases[index]?.id || index + 1 };
        handleChange(type, cases);
    };
    
    const addTestCase = (type: 'visibleTestCases' | 'hiddenTestCases') => {
        const cases = [...(editedProblem[type] || [])];
        const newId = (Math.max(0, ...cases.map(c => c.id)) || 0) + 1;
        handleChange(type, [...cases, { id: newId, input: '', expected: '' }]);
    };

    const moveTestCase = (from: 'visibleTestCases' | 'hiddenTestCases', fromIndex: number) => {
        const to = from === 'visibleTestCases' ? 'hiddenTestCases' : 'visibleTestCases';
        const fromCases = [...(editedProblem[from] || [])];
        const toCases = [...(editedProblem[to] || [])];

        const [movedCase] = fromCases.splice(fromIndex, 1);
        toCases.push(movedCase);

        setEditedProblem(prev => ({
            ...prev,
            [from]: fromCases,
            [to]: toCases,
        }));
    };
    
    const deleteTestCase = (type: 'visibleTestCases' | 'hiddenTestCases', index: number) => {
        const cases = [...(editedProblem[type] || [])];
        cases.splice(index, 1);
        handleChange(type, cases);
    };

    const TestCaseFields: React.FC<{
        tc: TestCase,
        type: 'visibleTestCases' | 'hiddenTestCases',
        index: number,
    }> = ({ tc, type, index }) => (
        <div className="flex gap-2 my-2 bg-slate-800 p-2 border border-slate-700 items-start">
            <div className="flex-grow space-y-2">
                <textarea placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange(type, index, 'input', e.target.value)} className="w-full bg-slate-600 p-1 text-xs h-16 border border-slate-500 font-mono"/>
                <textarea placeholder="Expected Output" value={tc.expected} onChange={e => handleTestCaseChange(type, index, 'expected', e.target.value)} className="w-full bg-slate-600 p-1 text-xs h-16 border border-slate-500 font-mono"/>
            </div>
            <div className="flex flex-col space-y-2">
                 <button onClick={() => moveTestCase(type, index)} className="p-1.5 bg-slate-700 hover:bg-slate-600" title={type === 'visibleTestCases' ? 'Move to Hidden' : 'Move to Visible'}>
                     {type === 'visibleTestCases' ? <ArrowDownIcon className="w-4 h-4"/> : <ArrowUpIcon className="w-4 h-4"/>}
                </button>
                <button onClick={() => deleteTestCase(type, index)} className="p-1.5 bg-red-800 hover:bg-red-700" title="Delete Test Case">
                    <TrashIcon className="w-4 h-4"/>
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 text-white">
             <h3 className="text-xl font-semibold font-orbitron">{editedProblem.id ? 'Edit Problem' : 'Add New Problem'}</h3>
            <input type="text" placeholder="Title" value={editedProblem.title} onChange={e => handleChange('title', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Description" value={editedProblem.description} onChange={e => handleChange('description', e.target.value)} className="w-full bg-slate-700 p-2 h-24 border border-slate-600" />
            <textarea placeholder="Initial buggy code for contestants" value={editedProblem.initialCode} onChange={e => handleChange('initialCode', e.target.value)} className="w-full bg-slate-700 p-2 h-24 font-mono border border-slate-600" />
            
            <input type="text" placeholder="Input Format" value={editedProblem.inputFormat} onChange={e => handleChange('inputFormat', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <input type="text" placeholder="Output Format" value={editedProblem.outputFormat} onChange={e => handleChange('outputFormat', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Constraints (one per line)" value={(editedProblem.constraints || []).join('\n')} onChange={e => handleChange('constraints', e.target.value.split('\n'))} className="w-full bg-slate-700 p-2 h-20 border border-slate-600" />
            <input type="text" placeholder="Hint" value={editedProblem.hint} onChange={e => handleChange('hint', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Official Solution Code" value={editedProblem.solution} onChange={e => handleChange('solution', e.target.value)} className="w-full bg-slate-700 p-2 h-24 font-mono border border-slate-600" />
            
            <div className="flex items-center justify-between bg-slate-700 p-3 border border-slate-600">
                <label htmlFor="showSampleCases" className="font-semibold">Show Sample Cases to Contestants</label>
                <input
                    id="showSampleCases"
                    type="checkbox"
                    checked={editedProblem.showSampleCases ?? true}
                    onChange={e => handleChange('showSampleCases', e.target.checked)}
                    className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-600">
                <div>
                    <h4 className="font-semibold text-cyan-400">Visible Test Cases</h4>
                    {(editedProblem.visibleTestCases || []).map((tc, i) => (
                        <TestCaseFields key={`vis-${i}`} tc={tc} type="visibleTestCases" index={i} />
                    ))}
                    <button onClick={() => addTestCase('visibleTestCases')} className="text-sm text-cyan-400 hover:underline mt-1">+ Add Visible Case</button>
                </div>
                 <div>
                    <h4 className="font-semibold text-fuchsia-400">Hidden Test Cases</h4>
                    {(editedProblem.hiddenTestCases || []).map((tc, i) => (
                         <TestCaseFields key={`hid-${i}`} tc={tc} type="hiddenTestCases" index={i} />
                    ))}
                     <button onClick={() => addTestCase('hiddenTestCases')} className="text-sm text-fuchsia-400 hover:underline mt-1">+ Add Hidden Case</button>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button onClick={onCancel} className="px-4 py-2 bg-slate-600 font-semibold border border-slate-500 hover:bg-slate-500">Cancel</button>
                <button onClick={() => onSave(editedProblem)} className="px-4 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700">Save Problem</button>
            </div>
        </div>
    );
};

const AdminTeams: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished' | 'disqualified'>('all');
    const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [clearingTeam, setClearingTeam] = useState<Team | null>(null);

    const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 4000);
    };

    const fetchTeams = () => api.getTeams().then(setTeams);

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleDelete = async (teamId: string) => {
        if (window.confirm("Are you sure you want to delete this team? This action is permanent.")) {
            await api.deleteTeam(teamId);
            fetchTeams();
        }
    }
    
    const handleAdjustScore = async (teamId: string, teamName: string, currentScore: number) => {
        const newScoreStr = window.prompt(`Enter new score for team "${teamName}" (current is ${currentScore}):`);
        if (newScoreStr) {
            const newScore = parseInt(newScoreStr, 10);
            if (!isNaN(newScore) && newScore >= 0) {
                await api.adjustTeamScore(teamId, newScore);
                fetchTeams();
            } else {
                showFeedback("Invalid score. Please enter a non-negative number.", 'error');
            }
        }
    };

    const handleStatusChange = async (teamId: string, newStatus: 'active' | 'finished' | 'disqualified') => {
        try {
            await api.setTeamStatus(teamId, newStatus);
            fetchTeams();
            showFeedback('Team status updated successfully.');
        } catch (error) {
            showFeedback('Failed to update status.', 'error');
        }
    };
    
    const handleClearSubmissionsConfirm = async (team: Team) => {
        if (!team) return;
        try {
            await api.clearTeamSubmissions(team.id);
            showFeedback(`Successfully cleared all submissions for ${team.name}.`);
            fetchTeams();
        } catch (error) {
            showFeedback(`Failed to clear submissions: ${(error as Error).message}`, 'error');
        } finally {
            setClearingTeam(null);
        }
    };

    if (viewingTeamId) {
        return <TeamStats teamId={viewingTeamId} onBack={() => setViewingTeamId(null)} />;
    }
    
    const getCurrentStatus = (team: Team): 'active' | 'finished' | 'disqualified' => {
        if (team.isDisqualified) return 'disqualified';
        if (team.hasFinished) return 'finished';
        return 'active';
    };

    const rankedTeams = teams
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return (a.lastSubmissionTimestamp || Infinity) - (b.lastSubmissionTimestamp || Infinity);
        })
        .reduce<(Team & { rank: number })[]>((acc, team, index, allSorted) => {
            let rank;
            if (index > 0) {
                const prevTeam = allSorted[index - 1];
                const prevTeamWithRank = acc[index - 1];
                if (team.score === prevTeam.score && team.lastSubmissionTimestamp === prevTeam.lastSubmissionTimestamp) {
                    rank = prevTeamWithRank.rank;
                } else {
                    rank = index + 1;
                }
            } else {
                rank = 1;
            }
            acc.push({ ...team, rank });
            return acc;
        }, []);

    const filteredTeams = rankedTeams.filter(team => {
        const nameMatch = team.name.toLowerCase().includes(filter.toLowerCase());
        if (!nameMatch) return false;

        switch (statusFilter) {
            case 'active':
                return !team.isDisqualified && !team.hasFinished;
            case 'finished':
                return team.hasFinished && !team.isDisqualified;
            case 'disqualified':
                return team.isDisqualified;
            case 'all':
            default:
                return true;
        }
    });

    return (
        <>
            <div className="space-y-4 text-white">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold font-orbitron">Manage Teams</h3>
                    {feedback && (
                        <div className={`text-sm px-3 py-1 ${feedback.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {feedback.message}
                        </div>
                    )}
                </div>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Filter by team name..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="flex-grow bg-slate-700 p-2 border border-slate-600"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'finished' | 'disqualified')}
                        className="bg-slate-700 p-2 border border-slate-600 text-white"
                        aria-label="Filter teams by status"
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="finished">Finished</option>
                        <option value="disqualified">Disqualified</option>
                    </select>
                </div>
                 <div className="overflow-x-auto">
                     <table className="min-w-full text-sm">
                        <thead className="text-left">
                            <tr className="border-b border-slate-600">
                                <th className="p-2">Rank</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">Score</th>
                                <th className="p-2">Violations</th>
                                <th className="p-2">Status</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeams.map((t) => (
                                <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-2 font-semibold text-center">{t.rank}</td>
                                    <td className="p-2 font-semibold">{t.name}</td>
                                    <td className="p-2">{t.score}</td>
                                    <td className="p-2" title={`Tab Switches: ${t.tabSwitchViolations}`}>{t.violations}</td>
                                    <td className="p-2">{t.isDisqualified ? <span className="text-red-400">Disqualified</span> : t.hasFinished ? <span className="text-green-400">Finished</span> : 'Active'}</td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <select
                                                value={getCurrentStatus(t)}
                                                onChange={(e) => handleStatusChange(t.id, e.target.value as 'active' | 'finished' | 'disqualified')}
                                                className="bg-slate-800 p-1 text-xs border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="finished">Finished</option>
                                                <option value="disqualified">Disqualified</option>
                                            </select>
                                            <button onClick={() => setViewingTeamId(t.id)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500">Stats</button>
                                            <button onClick={() => handleAdjustScore(t.id, t.name, t.score)} className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500">Score</button>
                                            <button onClick={() => setClearingTeam(t)} className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-500">Clear Data</button>
                                            <button onClick={() => handleDelete(t.id)} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {filteredTeams.length === 0 && (
                                <tr><td colSpan={6} className="text-center p-4 text-gray-400">No matching teams found.</td></tr>
                            )}
                        </tbody>
                     </table>
                 </div>
            </div>
            
            {clearingTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
                  <div className="bg-slate-900 shadow-2xl p-8 max-w-md w-full border border-orange-500 text-center backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
                    </svg>
                    <h3 className="mt-4 text-2xl font-bold text-orange-400 mb-4 font-orbitron">Confirm Clear Data</h3>
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to delete all submissions for team <strong className="font-bold text-white">"{clearingTeam.name}"</strong>? This will reset their score and is irreversible.
                    </p>
                    <div className="flex justify-center gap-4">
                       <button
                        onClick={() => setClearingTeam(null)}
                        className="px-6 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleClearSubmissionsConfirm(clearingTeam)}
                        className="px-6 py-2 bg-orange-600 text-white font-semibold border border-orange-500 hover:bg-orange-700 transition-colors"
                      >
                        Confirm Clear
                      </button>
                    </div>
                  </div>
                </div>
            )}
        </>
    );
}

const AdminSubmissions: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selected, setSelected] = useState<Submission | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
    const [teamFilter, setTeamFilter] = useState('');

    useEffect(() => { api.getSubmissions().then(subs => setSubmissions(subs.sort((a,b) => b.timestamp - a.timestamp))) }, []);

    const filteredSubmissions = submissions.filter(s => {
      if (teamFilter && !s.teamName.toLowerCase().includes(teamFilter.toLowerCase())) {
        return false;
      }
      if (filterStatus === 'success') {
          return s.results.length > 0 && s.score === s.results.length;
      }
      if (filterStatus === 'failed') {
          return s.score < s.results.length;
      }
      return true;
    });

    const FilterButton: React.FC<{ status: 'all' | 'success' | 'failed', label: string }> = ({ status, label }) => (
        <button 
            onClick={() => setFilterStatus(status)} 
            className={`px-3 py-1 text-xs font-medium ${filterStatus === status ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
                <div className="flex space-x-2 mb-2">
                    <FilterButton status="all" label="All" />
                    <FilterButton status="success" label="Success" />
                    <FilterButton status="failed" label="Failed" />
                </div>
                 <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Filter by team name..."
                        value={teamFilter}
                        onChange={e => setTeamFilter(e.target.value)}
                        className="w-full bg-slate-900 text-white p-2 border border-slate-700 text-sm"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredSubmissions.map(s => (
                        <div key={s.id} onClick={() => setSelected(s)} className={`p-2 cursor-pointer ${selected?.id === s.id ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-bold">{s.teamName} - {s.problemTitle}</p>
                                <span className={`text-xs px-2 py-0.5 ${s.score === s.results.length && s.results.length > 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                                    {s.score}/{s.results.length}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                     {filteredSubmissions.length === 0 && (
                        <div className="text-center text-gray-500 p-4">No matching submissions.</div>
                    )}
                </div>
            </div>
            <div className="md:col-span-2 bg-slate-900 border border-slate-700 p-4">
                {selected ? (
                    <div>
                        <h4 className="text-lg font-bold mb-2 font-orbitron">Code</h4>
                        <div className="h-64 mb-4">
                            <CodeEditor code={selected.code} onCodeChange={() => {}} problemId={selected.problemId} readOnly />
                        </div>
                        <h4 className="text-lg font-bold mb-2 font-orbitron">Results</h4>
                        <div className="h-48">
                           <Results results={selected.results} />
                        </div>
                    </div>
                ) : <p>Select a submission to view details.</p>}
            </div>
        </div>
    );
}

export default Admin;