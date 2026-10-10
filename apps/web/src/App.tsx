import React, { useState, useEffect } from 'react';
import type { TabKey, Game, DailyChallenge, NotificationItem } from './types';
import {
  MOCK_PLAYER_PROFILE,
  MOCK_PLAYER_STATS,
  FEATURED_GAMES,
  MOCK_DAILY_CHALLENGE,
  MOCK_LEADERBOARD,
  MOCK_ACHIEVEMENTS,
  MOCK_NOTIFICATIONS,
} from './data/mockData';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { GameModal } from './components/GameModal';
import { NotificationModal } from './components/NotificationModal';
import { ProfileModal } from './components/ProfileModal';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RewardsPage } from './pages/RewardsPage';
import { ProfilePage } from './pages/ProfilePage';
import './App.css';

// Declare Telegram WebApp global window interface
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // Initialize Telegram WebApp if loaded inside Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        if (window.Telegram.WebApp.setHeaderColor) {
          window.Telegram.WebApp.setHeaderColor('#0b0914');
        }
        if (window.Telegram.WebApp.setBackgroundColor) {
          window.Telegram.WebApp.setBackgroundColor('#0b0914');
        }
      } catch (err) {
        console.warn('Telegram WebApp init handled safely:', err);
      }
    }
  }, []);

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleStartChallenge = (challenge: DailyChallenge) => {
    const matchedGame = FEATURED_GAMES.find((g) => g.id === challenge.gameId) || FEATURED_GAMES[0];
    setSelectedGame(matchedGame);
  };

  return (
    <div className="app-container">
      {/* Ambient background glows */}
      <div className="ambient-glow-top" aria-hidden="true" />
      <div className="ambient-glow-bottom" aria-hidden="true" />

      {/* Persistent Brand Header */}
      <Header
        player={MOCK_PLAYER_PROFILE}
        notifications={notifications}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onBrandClick={() => setActiveTab('home')}
      />

      {/* Page Routing */}
      {activeTab === 'home' && (
        <HomePage
          player={MOCK_PLAYER_PROFILE}
          stats={MOCK_PLAYER_STATS}
          featuredGames={FEATURED_GAMES}
          dailyChallenge={MOCK_DAILY_CHALLENGE}
          leaderboardEntries={MOCK_LEADERBOARD}
          achievements={MOCK_ACHIEVEMENTS}
          onSelectGame={(game) => setSelectedGame(game)}
          onViewAllGames={() => setActiveTab('games')}
          onViewFullLeaderboard={() => setActiveTab('leaderboard')}
          onStartChallenge={handleStartChallenge}
        />
      )}

      {activeTab === 'games' && (
        <GamesPage
          games={FEATURED_GAMES}
          onSelectGame={(game) => setSelectedGame(game)}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardPage entries={MOCK_LEADERBOARD} />
      )}

      {activeTab === 'rewards' && <RewardsPage />}

      {activeTab === 'profile' && (
        <ProfilePage
          player={MOCK_PLAYER_PROFILE}
          stats={MOCK_PLAYER_STATS}
        />
      )}

      {/* Persistent Bottom Mobile Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <GameModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />

      <NotificationModal
        notifications={notifications}
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />

      <ProfileModal
        player={MOCK_PLAYER_PROFILE}
        stats={MOCK_PLAYER_STATS}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
