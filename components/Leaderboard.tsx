import React, { useState, useEffect } from 'react';
import type { Team } from '../types';
import { api } from '../services/api';
import { TrophyIcon, ArrowDownTrayIcon } from './Icons';

interface LeaderboardProps {
  team: Team;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ team: currentTeam }) => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchAndSortTeams = async () => {
      const allTeams = await api.getTeams();
      // Filter for teams that have finished and are not disqualified
      const finishedTeams = allTeams.filter(team => team.hasFinished && !team.isDisqualified);
      const sortedTeams = finishedTeams
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Use Infinity to correctly sort teams with no submissions to the end of a score group
          return (a.lastSubmissionTimestamp || Infinity) - (b.lastSubmissionTimestamp || Infinity);
        });
      setTeams(sortedTeams);
    };
    
    fetchAndSortTeams();
    const intervalId = setInterval(fetchAndSortTeams, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, []);
  
  // Implements standard competition ranking (1, 2, 2, 4)
  const teamsWithRanks = teams.reduce<(Team & { rank: number })[]>((acc, team, index) => {
    if (index > 0) {
        const prevTeam = teams[index - 1];
        const prevTeamWithRank = acc[index - 1];
        // If score and submission time are identical, it's a tie
        if (team.score === prevTeam.score && team.lastSubmissionTimestamp === prevTeam.lastSubmissionTimestamp) {
            acc.push({ ...team, rank: prevTeamWithRank.rank });
            return acc;
        }
    }
    // Not a tie or it's the first team. Rank is the current position (index + 1)
    acc.push({ ...team, rank: index + 1 });
    return acc;
  }, []);

  const exportToCSV = () => {
    if (teamsWithRanks.length === 0) return;

    const headers = ['Rank', 'Team Name', 'Score', 'Last Submission'];
    const csvRows = teamsWithRanks.map(team => {
        const submissionTime = team.lastSubmissionTimestamp
          ? new Date(team.lastSubmissionTimestamp).toLocaleString()
          : 'N/A';
        // Escape commas and quotes in team name
        const teamName = `"${team.name.replace(/"/g, '""')}"`;
        return [team.rank, teamName, team.score, submissionTime].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'leaderboard.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <TrophyIcon className="mx-auto h-12 w-12 text-cyan-400" />
            <h2 className="mt-4 text-3xl font-extrabold text-cyan-300 font-orbitron">Final Leaderboard</h2>
            <p className="mt-2 text-sm text-gray-400">Showing final standings for teams that have completed the competition.</p>
        </div>
        
        <div className="flex justify-end mb-4">
            <button
              onClick={exportToCSV}
              disabled={teamsWithRanks.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export as CSV
            </button>
        </div>
      
      <div className="bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" title="Tie-breaker: The team that achieves a score first is ranked higher.">Last Submission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {teamsWithRanks.map((team, index) => {
              let rowClass = '';
              if (team.id === currentTeam?.id) {
                  rowClass = 'bg-cyan-900/50 ring-2 ring-cyan-400';
              } else if (team.isDisqualified) {
                  rowClass = 'bg-red-900/40 opacity-70 hover:opacity-100 transition-opacity';
              } else if (team.rank <= 3) {
                  rowClass = 'bg-cyan-950/40';
              }
              
              return (
              <tr key={team.id} className={rowClass}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                   <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-black ${!team.isDisqualified && team.rank === 1 ? 'bg-yellow-400' : !team.isDisqualified && team.rank === 2 ? 'bg-slate-400' : !team.isDisqualified && team.rank === 3 ? 'bg-amber-600' : 'bg-slate-600 text-white'}`}>
                    {team.rank}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-400">
                  {team.name}
                  {team.isDisqualified && (
                    <span className="ml-3 px-2 py-1 text-xs font-bold text-red-300 bg-red-500/20">
                      Disqualified
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{team.score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {team.lastSubmissionTimestamp ? new Date(team.lastSubmissionTimestamp).toLocaleTimeString() : 'N/A'}
                </td>
              </tr>
            )})}
             {teams.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">No teams have finished the competition yet.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;