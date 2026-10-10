export type Language = 'en' | 'am';

export type {
  Game,
  GameCategory,
  GameDifficulty,
  GameStatus,
  GameSortOption,
} from './game';

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  displayNameAm: string;
  avatarUrl?: string;
  initials: string;
  tier: string;
  tierAm: string;
  level: number;
  isVerifiedTelegram: boolean;
  telegramHandle?: string;
}

export interface PlayerStats {
  totalPoints: number;
  gamesPlayed: number;
  leaderboardRank: number;
  totalPlayers: number;
  dailyStreakDays: number;
  weeklyWinRate: number;
  completedChallengesCount: number;
  isMockData: boolean;
}

export interface DailyChallenge {
  id: string;
  title: string;
  titleAm: string;
  gameId: string;
  gameTitle: string;
  instructions: string;
  instructionsAm: string;
  rewardPoints: number;
  status: 'not_started' | 'in_progress' | 'completed';
  currentProgress: number;
  targetProgress: number;
  expiresInHours: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
  score: number;
  gamesWon: number;
  tier: string;
  isCurrentPlayer?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  titleAm: string;
  description: string;
  descriptionAm: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleAm: string;
  message: string;
  messageAm: string;
  timestamp: string;
  isRead: boolean;
  type: 'announcement' | 'reward' | 'challenge' | 'system';
}

export type TabKey = 'home' | 'games' | 'leaderboard' | 'rewards' | 'profile';
