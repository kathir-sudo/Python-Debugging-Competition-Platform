import React, { useState, useEffect, useRef } from 'react';
import type { Problem, Submission, Team } from '../types';
import { api } from '../services/api';
import { ArrowLeftIcon, ChartBarIcon, ClockIcon, TrophyIcon, HashtagIcon, CheckCircleIcon, XCircleIcon } from './Icons';

// Chart.js is loaded from a script tag in index.html
declare const Chart: any;

interface TeamStatsProps {
    teamId: string;
    onBack: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-slate-900 p-4 border border-slate-700 flex items-center space-x-4">
        <div className={`p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const TeamStats: React.FC<TeamStatsProps> = ({ teamId, onBack }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [teamsData, submissionsData, problemsData] = await Promise.all([
                    api.getTeams(),
                    api.getSubmissionsByTeam(teamId),
                    api.getProblems()
                ]);
                
                setTeam(teamsData.find(t => t.id === teamId) || null);
                setAllTeams(teamsData);
                setSubmissions(submissionsData.sort((a, b) => a.timestamp - b.timestamp)); // sort chronologically
                setProblems(problemsData);
            } catch (error) {
                console.error("Failed to fetch team stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teamId]);

    useEffect(() => {
        if (!chartRef.current || !team) return;
        
        const scoreProgression = submissions.reduce<{ x: number; y: number }[]>((acc, sub) => {
            const submissionsSoFar = submissions.filter(s => s.timestamp <= sub.timestamp);
            const bestScores = submissionsSoFar.reduce<Record<string, number>>((map, s) => {
                 if (!map[s.problemId] || s.score > map[s.problemId]) {
                    map[s.problemId] = s.score;
                }
                return map;
            }, {});
            const totalScore = Object.values(bestScores).reduce((sum, score) => sum + score, 0);
            
            acc.push({ x: sub.timestamp, y: totalScore });
            return acc;
        }, []);
        
        const uniqueProgression = Array.from(new Map(scoreProgression.map(item => [item.x, item])).values());
        if (uniqueProgression.length === 0 && team.lastSubmissionTimestamp) {
             uniqueProgression.unshift({ x: team.lastSubmissionTimestamp, y: 0 });
        }


        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Score Over Time',
                    data: uniqueProgression,
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.2)',
                    fill: true,
                    stepped: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        type: 'time', 
                        time: { unit: 'minute', tooltipFormat: 'HH:mm:ss' }, 
                        title: { display: true, text: 'Time', color: '#9ca3af' }, 
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' }
                    },
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Score', color: '#9ca3af' }, 
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

    }, [submissions, team]);

    if (loading) return <p className="text-center">Loading team statistics...</p>;
    if (!team) return <p className="text-center text-red-400">Could not find team data.</p>;
    
    const problemStats = problems.map(problem => {
        const problemSubmissions = submissions.filter(s => s.problemId === problem.id);
        const bestSubmission = problemSubmissions.reduce((best, current) => (current.score > best.score ? current : best), { score: 0, results: [] });
        const firstCorrectSubmission = problemSubmissions.sort((a, b) => a.timestamp - b.timestamp).find(s => s.score === s.results.length);

        return {
            ...problem,
            attempts: problemSubmissions.length,
            bestScore: bestSubmission.score,
            totalTestCases: bestSubmission.results.length || 0,
            solvedTimestamp: firstCorrectSubmission?.timestamp
        };
    });
    
    const sortedTeams = allTeams.sort((a,b) => b.score - a.score);
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;

    return (
        <div>
            <button onClick={onBack} className="flex items-center space-x-2 mb-6 text-sm text-cyan-400 hover:text-cyan-300">
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Teams List</span>
            </button>
            <h3 className="text-2xl font-bold text-cyan-300 mb-6 font-orbitron">Statistics for {team.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<TrophyIcon className="w-6 h-6"/>} title="Final Score" value={team.score} color="bg-cyan-500/30 text-cyan-300"/>
                <StatCard icon={<HashtagIcon className="w-6 h-6"/>} title="Leaderboard Rank" value={rank > 0 ? `#${rank}` : 'N/A'} color="bg-yellow-500/30 text-yellow-300"/>
                <StatCard icon={<CheckCircleIcon className="w-6 h-6"/>} title="Problems Solved" value={`${problemStats.filter(p => p.solvedTimestamp).length} / ${problems.length}`} color="bg-green-500/30 text-green-300"/>
                <StatCard icon={<XCircleIcon className="w-6 h-6"/>} title="Total Violations" value={team.violations + team.tabSwitchViolations} color="bg-red-500/30 text-red-300"/>
            </div>

            <div className="bg-slate-900 p-4 border border-slate-700 mb-8">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-orbitron"><ChartBarIcon className="w-6 h-6"/>Score Progression</h4>
                <div className="h-64 relative">
                    {submissions.length > 0 ? <canvas ref={chartRef}></canvas> : <p className="text-center text-gray-500 pt-20">No submissions yet to show progress.</p>}
                </div>
            </div>

            <div>
                 <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">Problem Breakdown</h4>
                 <div className="space-y-3">
                     {problemStats.map(p => (
                        <div key={p.id} className="bg-slate-900 p-4 border border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">{p.title}</p>
                                <p className="text-xs text-gray-400">
                                    {p.attempts} attempt(s)
                                    {p.solvedTimestamp && ` • Solved at ${new Date(p.solvedTimestamp).toLocaleTimeString()}`}
                                </p>
                            </div>
                            <div className={`font-bold text-lg ${p.solvedTimestamp ? 'text-green-400' : 'text-yellow-400'}`}>
                                {p.bestScore} / {p.totalTestCases}
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default TeamStats;