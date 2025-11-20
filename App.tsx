import React, { useState, useEffect } from 'react';
// FIX: Import Team type to resolve errors when casting currentUser
import type { User, View, CompetitionState, Team } from './types';
import { api } from './services/api';
import Header from './components/Header';
import Login from './components/Login';
import CodingChallenge from './components/CodingChallenge';
import Leaderboard from './components/Leaderboard';
import Admin from './components/Admin';
import History from './components/History';
import ThankYou from './components/ThankYou';
import Waiting from './components/Waiting';
import AnnouncementBanner from './components/AnnouncementBanner';
import PauseOverlay from './components/PauseOverlay';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('challenge');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [competitionState, setCompetitionState] = useState<CompetitionState | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWithRetries = async (retries = 5, delay = 500): Promise<CompetitionState> => {
      for (let i = 0; i < retries; i++) {
        try {
          const state = await api.getCompetitionState();
          return state; // Success!
        } catch (error) {
          console.warn(`API call failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`, error);
          if (i < retries - 1) {
            await new Promise(res => setTimeout(res, delay));
          } else {
            throw error; // All retries failed, throw the final error
          }
        }
      }
      throw new Error("Failed to fetch competition state after multiple retries.");
    };

    const initializeApp = async () => {
      try {
        const state = await fetchWithRetries();
        setCompetitionState(state);
        
        const loggedInUser = api.getCurrentUser();
        if (loggedInUser) {
          setCurrentUser(loggedInUser);
          if (loggedInUser.id === 'admin') {
            setCurrentView('admin');
          }
        } else {
          setCurrentView('login');
        }
      } catch (error) {
        console.error("Failed to initialize app state:", error);
        setInitError((error as Error).message || "Could not connect to the server. Please ensure the backend is running.");
      }
    };
    initializeApp();
  }, []);

  // Polling effect for real-time state updates (e.g., announcements) for contestants
  useEffect(() => {
    if (!currentUser || currentUser.id === 'admin') return;

    const pollState = async () => {
        try {
            const state = await api.getCompetitionState();
            setCompetitionState(state);
        } catch (error) {
            console.warn("Failed to poll competition state:", error);
        }
    };

    const intervalId = setInterval(pollState, 7000); // Poll every 7 seconds

    return () => clearInterval(intervalId);
  }, [currentUser]);


  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) element.requestFullscreen().catch(err => console.error(err));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.id !== 'admin') {
      enterFullscreen();
      setCurrentView('challenge');
    } else {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    api.logout();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setCurrentUser(null);
    setCurrentView('login');
  };

  // Anti-cheat event listeners moved to CodingChallenge.tsx to have access to submission logic

  const renderView = () => {
    if (currentView === 'login') {
      return <Login onLogin={handleLogin} />;
    }
    
    if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }
    
    if (currentUser.id === 'admin') {
      return <Admin setCompetitionState={setCompetitionState} />;
    } else {
      const teamUser = currentUser as Team;
      const isCompetitionOver = !competitionState?.isActive;
      const teamDone = teamUser.isDisqualified || teamUser.hasFinished;

      // If team finished, or the competition is over for everyone, show the Thank You / Upsolve page.
      if (teamDone || (isCompetitionOver && competitionState)) {
          return <ThankYou 
              message={teamDone ? "You have finished the competition." : "The competition has ended."} 
              allowUpsolve={isCompetitionOver}
              onUpsolve={() => setCurrentView('challenge')}
          />;
      }
      
      // If competition hasn't started yet.
      if (!competitionState?.isActive) {
          return <Waiting />;
      }
      
      switch (currentView) {
        case 'challenge':
          return <CodingChallenge team={teamUser} competitionState={competitionState} setCurrentUser={setCurrentUser} setCurrentView={setCurrentView} />;
        case 'history':
          return <History team={teamUser} />;
        case 'thankyou':
           return <ThankYou message="Thank you for participating!" />;
        case 'leaderboard': // Fallback for safety, but UI link is removed
        default:
          return <CodingChallenge team={teamUser} competitionState={competitionState} setCurrentUser={setCurrentUser} setCurrentView={setCurrentView} />;
      }
    }
  };
  
  const renderContent = () => {
      if (initError) {
          return <div className="text-center text-red-400 p-8">Failed to initialize app: {initError}</div>;
      }
      if (!competitionState) {
          return <div className="text-center p-8">Loading competition...</div>;
      }
      return renderView();
  }

  return (
    <div className="min-h-screen">
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser} setCurrentView={setCurrentView} onLogout={handleLogout} competitionState={competitionState} />
       {currentUser && currentUser.id !== 'admin' && competitionState?.announcement && (
        <AnnouncementBanner announcement={competitionState.announcement} />
      )}
      {currentUser && currentUser.id !== 'admin' && competitionState?.isPaused && (
        <PauseOverlay />
      )}
      <main className="p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
