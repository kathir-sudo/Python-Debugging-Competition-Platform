import React, { useState, useEffect } from 'react';
import { CompetitionState } from '../types';
import { SpeakerWaveIcon } from './Icons';

interface AnnouncementBannerProps {
  announcement: CompetitionState['announcement'];
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcement }) => {
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (!announcement || !announcement.message || !announcement.timestamp) {
        return;
    }

    const lastSeenTimestamp = parseInt(sessionStorage.getItem('lastAnnouncementTimestamp') || '0', 10);

    if (announcement.timestamp > lastSeenTimestamp) {
      setCurrentMessage(announcement.message);
      setVisible(true);
      sessionStorage.setItem('lastAnnouncementTimestamp', String(announcement.timestamp));

      const timer = setTimeout(() => {
        setVisible(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-full max-w-sm" role="alert">
      <div className="bg-cyan-800/80 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur border border-cyan-500 p-4 flex items-start space-x-4">
        <SpeakerWaveIcon className="h-6 w-6 text-cyan-200 flex-shrink-0 mt-1" />
        <div className="flex-grow">
          <h4 className="font-bold text-lg font-orbitron">Announcement</h4>
          <p className="text-cyan-100">{currentMessage}</p>
        </div>
        <button
          onClick={handleClose}
          className="p-1 -m-1 rounded-full hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;