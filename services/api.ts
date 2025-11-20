import type { Problem, Team, Submission, TestResult, User, CompetitionState } from '../types';

// Helper function for API requests
async function fetchApi(url: string, options: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    try {
        const errorData = await response.json();
        throw new Error(errorData.message || `An API error occurred: ${response.statusText}`);
    } catch(e) {
        throw new Error(`An API error occurred: ${response.statusText}`);
    }
  }
  if (response.status === 204) {
      return;
  }
  return response.json();
}

class ApiService {
  // Seeding is now handled by the backend. This is for reference.
  seedData() {
    console.log("Seeding is now managed by the backend server on its first startup.");
  }

  // Auth Management
  async login(teamName: string): Promise<Team> {
    const team = await fetchApi('/api/teams/login', {
      method: 'POST',
      body: JSON.stringify({ name: teamName }),
    });
    this.setCurrentUser(team);
    return team;
  }
  
  async adminLogin(password: string): Promise<User | null> {
    try {
      const adminUser = await fetchApi('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      this.setCurrentUser(adminUser as User);
      return adminUser as User;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  setCurrentUser(user: User) {
    localStorage.setItem('pycompete_current_user', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('pycompete_current_user');
    return userData ? JSON.parse(userData) : null;
  }

  logout() {
    localStorage.removeItem('pycompete_current_user');
    localStorage.removeItem('competitionEndTime');
    localStorage.removeItem('timeLeftOnPause');
  }

  // Team Management
  async getTeams(): Promise<Team[]> {
    return fetchApi('/api/teams');
  }

  async incrementTeamViolations(teamId: string): Promise<Team | null> {
      const updatedTeam = await fetchApi(`/api/teams/${teamId}/violation`, { method: 'POST' });
      this.setCurrentUser(updatedTeam);
      return updatedTeam;
  }
  
  async incrementTabSwitchViolations(teamId: string): Promise<Team | null> {
      const updatedTeam = await fetchApi(`/api/teams/${teamId}/tabswitch-violation`, { method: 'POST' });
      this.setCurrentUser(updatedTeam);
      return updatedTeam;
  }

  async disqualifyTeam(teamId: string): Promise<Team> {
      const updatedTeam = await fetchApi(`/api/teams/${teamId}/disqualify`, { method: 'POST' });
      this.setCurrentUser(updatedTeam);
      return updatedTeam;
  }

  async revertTeamDisqualification(teamId: string): Promise<Team> {
    return fetchApi(`/api/teams/${teamId}/revert-dq`, { method: 'POST' });
  }
  
  async setTeamStatus(teamId: string, status: 'active' | 'finished' | 'disqualified'): Promise<Team> {
      return fetchApi(`/api/teams/${teamId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
      });
  }

  async adjustTeamScore(teamId: string, score: number): Promise<Team> {
      return fetchApi(`/api/teams/${teamId}/score`, { 
          method: 'PUT',
          body: JSON.stringify({ score }),
      });
  }
  
  async finishContest(teamId: string): Promise<Team> {
      const updatedTeam = await fetchApi(`/api/teams/${teamId}/finish`, { method: 'POST' });
      this.setCurrentUser(updatedTeam);
      return updatedTeam;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await fetchApi(`/api/teams/${teamId}`, { method: 'DELETE' });
  }
  
  async clearTeamSubmissions(teamId: string): Promise<void> {
    await fetchApi(`/api/teams/${teamId}/submissions`, { method: 'DELETE' });
  }

  // Problem Management
  async getProblems(): Promise<Problem[]> {
    return fetchApi('/api/problems');
  }

  async addProblem(problem: Omit<Problem, 'id'>): Promise<Problem> {
    return fetchApi('/api/problems', {
      method: 'POST',
      body: JSON.stringify(problem),
    });
  }

  async updateProblem(updatedProblem: Problem): Promise<Problem> {
    return fetchApi(`/api/problems/${updatedProblem.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedProblem),
    });
  }

  async deleteProblem(problemId: string): Promise<void> {
    await fetchApi(`/api/problems/${problemId}`, { method: 'DELETE' });
  }

  // Submission Management
  async getSubmissions(): Promise<Submission[]> {
    return fetchApi('/api/submissions');
  }

  async getSubmissionsByTeam(teamId: string): Promise<Submission[]> {
    return fetchApi(`/api/submissions/team/${teamId}`);
  }

  async submitSolution(team: Team, problem: Problem, code: string, results: TestResult[]): Promise<Submission> {
    const submissionData = {
      teamId: team.id,
      problemId: problem.id,
      code,
      results,
    };
    const newSubmission = await fetchApi('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });

    // Refresh current user to get updated score
    const updatedTeam = await fetchApi(`/api/teams/${team.id}`);
    this.setCurrentUser(updatedTeam);

    return newSubmission;
  }

  // Competition State Management
  async getCompetitionState(): Promise<CompetitionState> {
    return fetchApi('/api/competition/state');
  }
  
  async updateCompetitionState(newState: CompetitionState): Promise<CompetitionState> {
    return fetchApi('/api/competition/state', {
      method: 'PUT',
      body: JSON.stringify(newState),
    });
  }

  async toggleCompetitionPause(): Promise<CompetitionState> {
    return fetchApi('/api/competition/toggle-pause', { method: 'POST' });
  }

  async broadcastAnnouncement(message: string): Promise<CompetitionState> {
      return fetchApi('/api/competition/announcement', {
          method: 'PUT',
          body: JSON.stringify({ message }),
      });
  }
}

export const api = new ApiService();